import PDFDocument from 'pdfkit';

export const pdfConfig = {
  createDocument(options = {}) {
    return new PDFDocument({
      autoFirstPage: true,
      size: 'A4',
      margin: 50,
      font: undefined,
      ...options
    });
  }
}; 