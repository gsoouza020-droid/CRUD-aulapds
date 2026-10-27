import JSZip from 'jszip';
import { PROJECT_FILES } from '../data/projectFiles';

export async function downloadProjectZip(): Promise<void> {
  const zip = new JSZip();

  PROJECT_FILES.forEach((file) => {
    zip.file(file.path, file.content);
  });

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'crud-funcionario-docker-python.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCSV(data: Record<string, unknown>[], filename = 'funcionarios.csv'): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(item =>
    headers.map(h => {
      const val = item[h] !== null && item[h] !== undefined ? String(item[h]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    }).join(';')
  );
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToJSON(data: unknown, filename = 'funcionarios.json'): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
