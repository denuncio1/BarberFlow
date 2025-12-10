export function exportToCSV(filename: string, rows: any[]) {
  if (!rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent = [keys.join(separator), ...rows.map(row => keys.map(k => row[k]).join(separator))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
