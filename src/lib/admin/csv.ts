/**
 * Tiny, allocation-friendly CSV writer. Every field is quoted so
 * embedded commas, newlines, and quote characters are safe.
 *
 * Format compatible with Excel, Google Sheets, Numbers. UTF-8 BOM
 * prefixed so Excel opens UTF-8 correctly on Windows.
 */

export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '""'
  const str = String(value)
  const escaped = str.replace(/"/g, '""')
  return `"${escaped}"`
}

export function buildCsv(headers: string[], rows: unknown[][]): string {
  const lines: string[] = []
  lines.push(headers.map(escapeCsvField).join(','))
  for (const row of rows) {
    lines.push(row.map(escapeCsvField).join(','))
  }
  return '﻿' + lines.join('\r\n')
}

export function csvResponse(
  csv: string,
  filename: string,
): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '')}"`,
      'Cache-Control': 'no-store',
    },
  })
}
