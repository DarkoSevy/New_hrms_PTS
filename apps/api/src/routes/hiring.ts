import { Router } from 'express';
import { z } from 'zod';
import { CandidateStage, DriverGateKey, OfferStatus, VacancyStage } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireModule } from '../middleware/rbac.js';
import { isAggregateOnly } from '../rbac/matrix.js';
import { audit, auditContextFromReq, snapshot } from '../lib/audit.js';
import { NotFound, UnprocessableEntity, BadRequest } from '../lib/errors.js';

const router = Router();

export const GATE_LABELS: Record<DriverGateKey, string> = {
  LICENCE: 'Valid driving licence, category B and D, with 3+ years held',
  TRAFFIC_RECORD: 'Clean traffic record confirmed with Rwanda National Police',
  ROAD_TEST: 'Practical road test with the Operations Manager',
  MEDICAL_FITNESS: 'Medical fitness certificate before first assignment',
  DEFENSIVE_DRIVING: 'Defensive driving booked within 30 days of start',
};

router.get(
  '/',
  requireModule('hiring', 'view'),
  asyncHandler(async (req, res) => {
    const aggregate = isAggregateOnly(req.principal!.role);
    const [vacancies, candidates, offersOut] = await Promise.all([
      prisma.vacancy.findMany({
        where: { stage: { notIn: [VacancyStage.CLOSED] } },
        include: { department: { select: { name: true } }, _count: { select: { candidates: true } } },
        orderBy: { openedAt: 'asc' },
      }),
      prisma.candidate.findMany({ include: { vacancy: { select: { title: true } }, offer: true } }),
      prisma.offer.count({ where: { status: OfferStatus.ISSUED } }),
    ]);

    const funnelStages: CandidateStage[] = [CandidateStage.APPLIED, CandidateStage.SCREENING, CandidateStage.INTERVIEW, CandidateStage.ROAD_TEST, CandidateStage.OFFER_OUT, CandidateStage.HIRED];
    const order = Object.values(CandidateStage);
    const funnel = funnelStages.map((s) => ({
      stage: s,
      n: candidates.filter((c) => order.indexOf(c.stage) >= order.indexOf(s) && c.stage !== CandidateStage.REJECTED).length,
    }));

    res.json({
      kpis: {
        openPositions: vacancies.reduce((s, v) => s + v.numberOfPositions, 0),
        inPipeline: candidates.filter((c) => c.stage !== CandidateStage.HIRED && c.stage !== CandidateStage.REJECTED).length,
        offersOut,
      },
      openings: vacancies.map((v) => ({
        id: v.id,
        title: v.title,
        dept: v.department.name,
        numberOfPositions: v.numberOfPositions,
        stage: v.stage,
        isOperational: v.isOperational,
        candidates: v._count.candidates,
        since: v.openedAt,
      })),
      funnel,
      candidates: aggregate
        ? []
        : candidates
            .filter((c) => c.stage !== CandidateStage.HIRED && c.stage !== CandidateStage.REJECTED)
            .map((c) => ({ id: c.id, name: c.fullName, initials: c.initials, role: c.vacancy.title, stage: c.stage, note: c.notes, isOperational: c.isOperational, hasOffer: !!c.offer })),
      driverGate: Object.values(DriverGateKey).map((k) => GATE_LABELS[k]),
    });
  }),
);

// Candidate detail with the driver hiring gate.
router.get(
  '/candidates/:id',
  requireModule('hiring', 'view'),
  asyncHandler(async (req, res) => {
    const c = await prisma.candidate.findUnique({
      where: { id: req.params.id },
      include: { vacancy: { select: { title: true, isOperational: true } }, gateChecks: true, interviews: { orderBy: { scheduledAt: 'asc' } }, offer: true },
    });
    if (!c) throw NotFound('Candidate not found');
    const gate = Object.values(DriverGateKey).map((key) => {
      const check = c.gateChecks.find((g) => g.checkKey === key);
      return { key, label: GATE_LABELS[key], cleared: check?.cleared ?? false, clearedAt: check?.clearedAt ?? null, note: check?.note ?? null };
    });
    res.json({
      id: c.id, name: c.fullName, initials: c.initials, role: c.vacancy.title, stage: c.stage, notes: c.notes,
      isOperational: c.isOperational, interviews: c.interviews, offer: c.offer,
      gate, gateComplete: c.isOperational ? gate.every((g) => g.cleared) : true,
    });
  }),
);

const vacancySchema = z.object({
  title: z.string().min(1),
  departmentId: z.string(),
  positionId: z.string().optional().nullable(),
  numberOfPositions: z.number().int().positive().default(1),
  isOperational: z.boolean().optional(),
  stage: z.nativeEnum(VacancyStage).optional(),
});
router.post('/vacancies', requireModule('hiring', 'manage'), asyncHandler(async (req, res) => {
  const data = vacancySchema.parse(req.body);
  const created = await prisma.vacancy.create({ data });
  await audit(auditContextFromReq(req), { action: 'CREATE', entityType: 'Vacancy', entityId: created.id, summary: `Opened vacancy ${created.title}`, newValue: snapshot(created, ['title', 'numberOfPositions', 'isOperational']) });
  res.status(201).json(created);
}));
router.put('/vacancies/:id', requireModule('hiring', 'manage'), asyncHandler(async (req, res) => {
  const existing = await prisma.vacancy.findUnique({ where: { id: req.params.id } });
  if (!existing) throw NotFound('Vacancy not found');
  const data = vacancySchema.partial().parse(req.body);
  const updated = await prisma.vacancy.update({ where: { id: req.params.id }, data });
  await audit(auditContextFromReq(req), { action: 'UPDATE', entityType: 'Vacancy', entityId: updated.id, summary: `Updated vacancy ${updated.title}`, previousValue: snapshot(existing, ['stage', 'numberOfPositions']), newValue: snapshot(updated, ['stage', 'numberOfPositions']) });
  res.json(updated);
}));

const candidateSchema = z.object({
  fullName: z.string().min(1),
  vacancyId: z.string(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isOperational: z.boolean().optional(),
});
router.post('/candidates', requireModule('hiring', 'manage'), asyncHandler(async (req, res) => {
  const data = candidateSchema.parse(req.body);
  const vacancy = await prisma.vacancy.findUnique({ where: { id: data.vacancyId } });
  if (!vacancy) throw BadRequest('Unknown vacancy.');
  const created = await prisma.candidate.create({
    data: { ...data, initials: data.fullName.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase(), isOperational: data.isOperational ?? vacancy.isOperational },
  });
  // Seed empty gate checks for operational candidates.
  if (created.isOperational) {
    await prisma.driverGateCheck.createMany({ data: Object.values(DriverGateKey).map((key) => ({ candidateId: created.id, checkKey: key })) });
  }
  await audit(auditContextFromReq(req), { action: 'CREATE', entityType: 'Candidate', entityId: created.id, summary: `Added candidate ${created.fullName}`, newValue: snapshot(created, ['fullName', 'vacancyId', 'isOperational']) });
  res.status(201).json(created);
}));

const stageSchema = z.object({ stage: z.nativeEnum(CandidateStage) });
router.put('/candidates/:id/stage', requireModule('hiring', 'manage'), asyncHandler(async (req, res) => {
  const { stage } = stageSchema.parse(req.body);
  const existing = await prisma.candidate.findUnique({ where: { id: req.params.id } });
  if (!existing) throw NotFound('Candidate not found');
  const updated = await prisma.candidate.update({ where: { id: req.params.id }, data: { stage } });
  await audit(auditContextFromReq(req), { action: 'UPDATE', entityType: 'Candidate', entityId: updated.id, summary: `Moved ${updated.fullName} to ${stage}`, previousValue: { stage: existing.stage }, newValue: { stage } });
  res.json(updated);
}));

// Update a driver gate check.
const gateSchema = z.object({ cleared: z.boolean(), note: z.string().optional().nullable() });
router.put('/candidates/:id/gate/:key', requireModule('hiring', 'manage'), asyncHandler(async (req, res) => {
  const key = req.params.key as DriverGateKey;
  if (!Object.values(DriverGateKey).includes(key)) throw BadRequest('Unknown gate check.');
  const { cleared, note } = gateSchema.parse(req.body);
  const check = await prisma.driverGateCheck.upsert({
    where: { candidateId_checkKey: { candidateId: req.params.id, checkKey: key } },
    create: { candidateId: req.params.id, checkKey: key, cleared, note: note ?? null, clearedAt: cleared ? new Date() : null, clearedById: req.principal!.userId },
    update: { cleared, note: note ?? null, clearedAt: cleared ? new Date() : null, clearedById: req.principal!.userId },
  });
  await audit(auditContextFromReq(req), { action: 'UPDATE', entityType: 'DriverGateCheck', entityId: check.id, summary: `${cleared ? 'Cleared' : 'Un-cleared'} gate check ${GATE_LABELS[key]}`, newValue: { cleared } });
  res.json(check);
}));

// Issue an offer — enforces the five-check driver hiring gate.
const offerSchema = z.object({ salary: z.number().optional().nullable(), expiresAt: z.string().optional().nullable() });
router.post('/candidates/:id/offer', requireModule('hiring', 'manage'), asyncHandler(async (req, res) => {
  const candidate = await prisma.candidate.findUnique({ where: { id: req.params.id }, include: { gateChecks: true, offer: true } });
  if (!candidate) throw NotFound('Candidate not found');
  if (candidate.offer) throw BadRequest('An offer already exists for this candidate.');

  if (candidate.isOperational) {
    const missing = Object.values(DriverGateKey).filter((k) => !candidate.gateChecks.find((g) => g.checkKey === k && g.cleared));
    if (missing.length > 0) {
      await audit(auditContextFromReq(req), {
        action: 'ACCESS_DENIED', entityType: 'Offer', entityId: candidate.id,
        summary: `Blocked offer to ${candidate.fullName}: ${missing.length} driver hiring gate check(s) not cleared`,
        newValue: { missing: missing.map((k) => GATE_LABELS[k]) },
      });
      throw UnprocessableEntity('No offer can be issued until all five driver hiring gate checks are cleared.', {
        missing: missing.map((k) => ({ key: k, label: GATE_LABELS[k] })),
      });
    }
  }

  const data = offerSchema.parse(req.body);
  const offer = await prisma.offer.create({
    data: { candidateId: candidate.id, salary: data.salary != null ? data.salary : null, status: OfferStatus.ISSUED, issuedAt: new Date(), expiresAt: data.expiresAt ? new Date(data.expiresAt) : null },
  });
  await prisma.candidate.update({ where: { id: candidate.id }, data: { stage: CandidateStage.OFFER_OUT } });
  await audit(auditContextFromReq(req), { action: 'CREATE', entityType: 'Offer', entityId: offer.id, summary: `Issued offer to ${candidate.fullName}` });
  res.status(201).json(offer);
}));

export default router;
