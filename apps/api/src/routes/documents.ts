import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireModule } from '../middleware/rbac.js';
import { audit, auditContextFromReq, snapshot } from '../lib/audit.js';
import { Forbidden, NotFound, BadRequest } from '../lib/errors.js';
import { evaluateRosterEligibility } from '../services/compliance.js';

const router = Router();

const uploadRoot = path.resolve(process.cwd(), env.uploadDir, 'employee-documents');
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype);
    if (!ok) return cb(new Error('Only PDF or image files are allowed'));
    return cb(null, true);
  },
});

// List documents for an employee.
router.get(
  '/employee/:employeeId',
  requireModule('people', 'view'),
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    const canSeeSensitive = p.role === 'HR_ADMINISTRATOR' || p.role === 'HR_OFFICER';
    const docs = await prisma.employeeDocument.findMany({
      where: { employeeId: req.params.employeeId },
      include: { documentType: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      data: docs.map((d) => ({
        id: d.id,
        name: d.documentType.name,
        category: d.documentType.category,
        fileName: canSeeSensitive || !d.isSensitive ? d.fileName : null,
        issueDate: d.issueDate,
        expiryDate: d.expiryDate,
        version: d.version,
        isSensitive: d.isSensitive,
        restricted: d.isSensitive && !canSeeSensitive,
        downloadable: !!d.filePath && !d.filePath.startsWith('seed://') && (canSeeSensitive || !d.isSensitive),
      })),
    });
  }),
);

const metaSchema = z.object({
  documentTypeId: z.string(),
  issueDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
});

router.post(
  '/employee/:employeeId',
  requireModule('people', 'manage'),
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw BadRequest('A file is required.');
    const meta = metaSchema.parse(req.body);
    const type = await prisma.documentType.findUnique({ where: { id: meta.documentTypeId } });
    if (!type) throw BadRequest('Unknown document type.');

    const created = await prisma.employeeDocument.create({
      data: {
        employeeId: req.params.employeeId,
        documentTypeId: meta.documentTypeId,
        fileName: req.file.originalname,
        filePath: req.file.path,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        issueDate: meta.issueDate ? new Date(meta.issueDate) : null,
        expiryDate: meta.expiryDate ? new Date(meta.expiryDate) : null,
        isSensitive: type.isSensitive,
        uploadedById: req.principal!.userId,
      },
    });
    // A new compliance document may restore rosterability.
    await evaluateRosterEligibility(req.params.employeeId);
    await audit(auditContextFromReq(req), {
      action: 'CREATE', entityType: 'EmployeeDocument', entityId: created.id,
      summary: `Uploaded ${type.name}`, newValue: snapshot(created, ['fileName', 'expiryDate', 'documentTypeId']),
    });
    res.status(201).json(created);
  }),
);

router.get(
  '/:id/download',
  requireModule('people', 'view'),
  asyncHandler(async (req, res) => {
    const p = req.principal!;
    const doc = await prisma.employeeDocument.findUnique({ where: { id: req.params.id }, include: { documentType: true, employee: { select: { fullName: true } } } });
    if (!doc) throw NotFound('Document not found');
    const canSeeSensitive = p.role === 'HR_ADMINISTRATOR' || p.role === 'HR_OFFICER';
    if (doc.isSensitive && !canSeeSensitive) throw Forbidden('This document is restricted.');
    if (!doc.filePath || doc.filePath.startsWith('seed://') || !fs.existsSync(doc.filePath)) throw NotFound('File is not available.');

    await audit(auditContextFromReq(req), { action: 'READ', entityType: 'EmployeeDocument', entityId: doc.id, summary: `Downloaded ${doc.documentType.name} for ${doc.employee.fullName}` });
    res.download(doc.filePath, doc.fileName);
  }),
);

router.delete(
  '/:id',
  requireModule('people', 'manage'),
  asyncHandler(async (req, res) => {
    const doc = await prisma.employeeDocument.findUnique({ where: { id: req.params.id }, include: { documentType: true } });
    if (!doc) throw NotFound('Document not found');
    await prisma.employeeDocument.delete({ where: { id: req.params.id } });
    if (doc.filePath && !doc.filePath.startsWith('seed://') && fs.existsSync(doc.filePath)) {
      fs.unlink(doc.filePath, () => undefined);
    }
    await evaluateRosterEligibility(doc.employeeId);
    await audit(auditContextFromReq(req), { action: 'DELETE', entityType: 'EmployeeDocument', entityId: doc.id, summary: `Deleted ${doc.documentType.name}`, previousValue: snapshot(doc, ['fileName', 'documentTypeId', 'expiryDate']) });
    res.status(204).end();
  }),
);

// Documents nearing expiry across the company (compliance).
router.get(
  '/expiring',
  requireModule('people', 'view'),
  asyncHandler(async (req, res) => {
    const now = new Date();
    const soon = new Date(now.getTime() + 60 * 86400000);
    const docs = await prisma.employeeDocument.findMany({
      where: { expiryDate: { lte: soon }, documentType: { hasExpiry: true } },
      include: { documentType: true, employee: { select: { fullName: true, employeeCode: true, isOperational: true } } },
      orderBy: { expiryDate: 'asc' },
      take: 100,
    });
    res.json({ data: docs });
  }),
);

export default router;
