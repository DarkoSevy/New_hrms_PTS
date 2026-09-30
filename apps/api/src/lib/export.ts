import type { Response } from 'express';
import PDFDocument from 'pdfkit';

export interface ExportColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
  width?: number;
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function sendCsv<T>(res: Response, filename: string, columns: ExportColumn<T>[], rows: T[]): void {
  const header = columns.map((c) => csvCell(c.header)).join(',');
  const body = rows.map((row) => columns.map((c) => csvCell(c.value(row))).join(',')).join('\r\n');
  const csv = `﻿${header}\r\n${body}`; // BOM for Excel UTF-8
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.send(csv);
}

export function sendPdf<T>(
  res: Response,
  filename: string,
  opts: { title: string; subtitle?: string; columns: ExportColumn<T>[]; rows: T[] },
): void {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
  doc.pipe(res);

  const ink = '#1C1B18';
  const muted = '#57544B';
  const accent = '#EFC94C';

  // Header band
  doc.rect(36, 36, doc.page.width - 72, 46).fill(ink);
  doc.fillColor('#F7F3E6').fontSize(18).text('PTS.rw HR System', 48, 46);
  doc.fillColor(accent).fontSize(11).text(opts.title, 48, 68);
  doc
    .fillColor('#F7F3E6')
    .fontSize(9)
    .text(new Date().toLocaleString('en-GB'), 36, 52, { width: doc.page.width - 84, align: 'right' });

  let y = 100;
  if (opts.subtitle) {
    doc.fillColor(muted).fontSize(9).text(opts.subtitle, 48, y);
    y += 18;
  }

  const startX = 48;
  const usableWidth = doc.page.width - 96;
  const totalWeight = opts.columns.reduce((s, c) => s + (c.width ?? 1), 0);
  const colX: number[] = [];
  let x = startX;
  for (const c of opts.columns) {
    colX.push(x);
    x += ((c.width ?? 1) / totalWeight) * usableWidth;
  }

  // Column headers
  doc.fillColor(ink).fontSize(9);
  opts.columns.forEach((c, i) => {
    const width = ((c.width ?? 1) / totalWeight) * usableWidth - 6;
    doc.font('Helvetica-Bold').text(c.header, colX[i], y, { width, ellipsis: true });
  });
  y += 16;
  doc.moveTo(startX, y - 4).lineTo(startX + usableWidth, y - 4).strokeColor('#CFCcC4').stroke();

  doc.font('Helvetica').fontSize(8.5);
  for (const row of opts.rows) {
    if (y > doc.page.height - 48) {
      doc.addPage();
      y = 48;
    }
    let maxH = 12;
    opts.columns.forEach((c, i) => {
      const width = ((c.width ?? 1) / totalWeight) * usableWidth - 6;
      const text = c.value(row);
      doc.fillColor('#2B2A26').text(text === null || text === undefined ? '' : String(text), colX[i], y, {
        width,
        ellipsis: true,
      });
      const h = doc.heightOfString(String(text ?? ''), { width });
      if (h > maxH) maxH = h;
    });
    y += maxH + 6;
    doc.moveTo(startX, y - 4).lineTo(startX + usableWidth, y - 4).strokeColor('#EEEBE3').stroke();
  }

  doc.fillColor(muted).fontSize(8).text(`${opts.rows.length} record(s)`, startX, doc.page.height - 40);
  doc.end();
}

export type ExportFormat = 'csv' | 'pdf';

export function exportFormat(value: unknown): ExportFormat | null {
  if (value === 'csv') return 'csv';
  if (value === 'pdf') return 'pdf';
  return null;
}
