import jsPDF from 'jspdf';
import { InvoiceData } from '../../types/invoice';

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'paid': return '#34D399';
    case 'pending': return '#FBBF24';
    case 'overdue': return '#EF4444';
    default: return '#000000';
  }
}

export async function generateInvoicePDF(invoice: InvoiceData): Promise<Buffer> {
  console.log('🔍 Starting PDF generation for invoice:', invoice.id);
  
  // Validate invoice structure
  if (!invoice.request?.customer) {
    throw new Error('Invalid invoice data: missing customer information');
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header
      doc.setFontSize(20);
      doc.text('INVOICE', 105, 20, { align: 'center' });
      
      // Invoice Details
      doc.setFontSize(12);
      doc.text(`Invoice #: ${invoice.id}`, 20, 40);
      doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 20, 50);
      doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, 60);
      
      // Customer Info
      doc.text('Bill To:', 20, 80);
      doc.text(invoice.request.customer.name, 20, 90);
      doc.text(invoice.request.customer.email, 20, 100);

      // Items Table
      let yPos = 120;
      const headers = ['Item', 'Qty', 'Price', 'Total'];
      const columnPositions = [20, 100, 140, 180];
      
      headers.forEach((header, i) => {
        doc.text(header, columnPositions[i], yPos);
      });

      yPos += 10;
      invoice.invoice_items?.forEach(item => {
        doc.text(item.product.name, columnPositions[0], yPos);
        doc.text(item.quantity.toString(), columnPositions[1], yPos);
        doc.text(`$${item.unit_price.toFixed(2)}`, columnPositions[2], yPos);
        doc.text(`$${item.total_price.toFixed(2)}`, columnPositions[3], yPos);
        yPos += 10;
      });

      // Total
      doc.text(`Total Amount: $${invoice.amount.toFixed(2)}`, 180, yPos + 20, { align: 'right' });
      
      // Footer
      doc.text('Thank you for your business!', 105, yPos + 40, { align: 'center' });

      // Convert to Buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      resolve(pdfBuffer);
      
    } catch (err) {
      console.error('💥 Unexpected error in PDF generation:', err);
      reject(new Error(`PDF generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`));
    }
  });
}