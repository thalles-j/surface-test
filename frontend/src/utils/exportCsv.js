/**
 * Utilitário de exportação de dados — gera CSV a partir de arrays de objetos.
 * Preparação para funcionalidade de export no admin.
 */

export function arrayToCsv(data, columns) {
  if (!data || data.length === 0) return '';

  const cols = columns || Object.keys(data[0]);
  const header = cols.map(c => (typeof c === 'object' ? c.label : c)).join(';');

  const rows = data.map(row =>
    cols.map(c => {
      const key = typeof c === 'object' ? c.key : c;
      let val = row[key] ?? '';
      if (typeof val === 'string' && (val.includes(';') || val.includes('"') || val.includes('\n'))) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(';')
  );

  return [header, ...rows].join('\n');
}

export function downloadCsv(csvString, filename = 'export.csv') {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
