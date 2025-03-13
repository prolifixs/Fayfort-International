import jsPDF from 'jspdf';
import { InvoiceData } from '@/app/components/types/invoice';

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'paid': return '#34D399';
    case 'pending': return '#FBBF24';
    case 'overdue': return '#EF4444';
    default: return '#000000';
  }
}

export async function generateInvoicePDF(invoice: InvoiceData): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Header bar
  doc.setFillColor(45, 55, 72); // Dark blue
  doc.rect(0, 0, 210, 30, 'F');

  // Invoice Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('INVOICE', 20, 20);

  // Company Details (Left)
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 70);
  doc.text('FayFort International', 20, 50);
  doc.text('Building 1, No. 198, Jiaogong District', 20, 55);
  doc.text('Hangzhou, Zhejiang Province', 20, 60);
  doc.text('China', 20, 65);
  doc.text('310018', 20, 70);

  // Invoice To (Middle)
  doc.setFontSize(11);
  doc.setTextColor(45, 55, 72);
  doc.text('INVOICE TO:', 85, 50);
  doc.setFontSize(10);
  doc.text(invoice.request.customer.name, 85, 55);
  doc.text(invoice.request.customer.shipping_address?.street_address || '', 85, 60);
  doc.text(`${invoice.request.customer.shipping_address?.city || ''}, ${invoice.request.customer.shipping_address?.state || ''}`, 85, 65);
  doc.text(invoice.request.customer.shipping_address?.country || '', 85, 70);

  // Invoice Details (Right)
  doc.text('Invoice Number', 150, 50);
  doc.setFontSize(11);
  doc.text(`#${invoice.id}`, 150, 55);
  doc.setFontSize(10);
  doc.text('Date of Invoice', 150, 65);
  doc.text(new Date(invoice.created_at).toLocaleDateString(), 150, 70);
  doc.text('Due Date', 150, 80);
  doc.text(new Date(invoice.due_date).toLocaleDateString(), 150, 85);

  // Table Headers
  const startY = 100;
  doc.setFillColor(45, 55, 72);
  doc.rect(20, startY, 170, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text('DESCRIPTION', 25, startY + 7);
  doc.text('QTY', 95, startY + 7);
  doc.text('UNIT PRICE', 120, startY + 7);
  doc.text('TOTAL', 170, startY + 7);

  // Table Content with alternating rows
  let yPos = startY + 15;
  doc.setTextColor(70, 70, 70);
  invoice.invoices?.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(20, yPos - 5, 170, 10, 'F');
    }
    doc.text(item.product.name, 25, yPos);
    doc.text(item.quantity.toString(), 95, yPos);
    doc.text(`$${item.unit_price.toFixed(2)}`, 120, yPos);
    doc.text(`$${item.total_price.toFixed(2)}`, 170, yPos);
    yPos += 10;
  });

  // Totals section
  yPos += 10;
  doc.text('SUBTOTAL', 120, yPos);
  doc.text(`$${invoice.amount.toFixed(2)}`, 170, yPos);
  
  yPos += 10;
  doc.text('DISCOUNT', 120, yPos);
  doc.text('0.00', 170, yPos);
  
  yPos += 10;
  doc.text('SUBTOTAL LESS DISCOUNT', 120, yPos);
  doc.text(`$${invoice.amount.toFixed(2)}`, 170, yPos);
  
  yPos += 10;
  doc.text('TAX RATE', 120, yPos);
  doc.text('0.00', 170, yPos);
  
  yPos += 10;
  doc.text('TAX TOTAL', 120, yPos);
  doc.text('0.00', 170, yPos);

  yPos += 15;
  doc.setFontSize(12);
  doc.setTextColor(45, 55, 72);
  doc.text('BALANCE DUE', 120, yPos);
  doc.text(`$${invoice.amount.toFixed(2)}`, 170, yPos);

  // Notes Section
  yPos += 20;
  doc.setFontSize(11);
  doc.text('NOTES:', 20, yPos);
  yPos += 7;
  doc.setFontSize(9);
  doc.text('Thank you for your business. Please process this invoice within the due date.', 20, yPos);

  // Terms and Conditions
  yPos += 15;
  doc.setFontSize(11);
  doc.text('TERMS AND CONDITIONS:', 20, yPos);
  yPos += 7;
  doc.setFontSize(9);
  doc.text('Payment is due within 15 days', 20, yPos);

  // Footer bar
  doc.setFillColor(45, 55, 72);
  doc.rect(0, 277, 210, 20, 'F');

  // Footer text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('Powered by WondaTechnologies', 105, 290, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}