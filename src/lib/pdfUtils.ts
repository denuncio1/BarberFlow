import jsPDF from "jspdf";

export function exportToPDF(filename: string, title: string, rows: any[]) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 10, 10);
  if (!rows.length) {
    doc.text("Sem dados.", 10, 20);
  } else {
    const keys = Object.keys(rows[0]);
    let y = 20;
    doc.setFontSize(10);
    doc.text(keys.join(" | "), 10, y);
    y += 8;
    rows.forEach(row => {
      doc.text(keys.map(k => String(row[k])).join(" | "), 10, y);
      y += 8;
    });
  }
  doc.save(filename);
}
