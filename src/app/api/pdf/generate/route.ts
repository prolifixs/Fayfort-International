import { NextResponse } from 'next/server';
import { generateInvoicePDF } from '@/app/components/lib/pdf/generateInvoicePDF';

export async function POST(request: Request) {
  try {
    console.log('📝 Starting PDF generation...');
    
    // Parse request body with error handling
    let invoice;
    try {
      invoice = await request.json();
      console.log('📄 Full invoice data:', JSON.stringify(invoice, null, 2));
      console.log('📄 Invoice data received:', {
        id: invoice.id,
        amount: invoice.amount,
        items: invoice?.invoice_items?.length || 0
      });
    } catch (error) {
      console.error('❌ Failed to parse request body:', error);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Generate PDF with detailed logging
    try {
      const pdfBuffer = await generateInvoicePDF(invoice);
      console.log('✅ PDF generated successfully:', {
        size: pdfBuffer.length,
        invoiceId: invoice.id
      });
      
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${invoice.id}.pdf"`
        }
      });
    } catch (error) {
      console.error('❌ PDF generation failed:', {
        error: 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        invoiceId: invoice.id
      });
      return NextResponse.json({ 
        error: 'PDF generation failed',
        details: 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('💥 Unexpected error in PDF generation route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: 'Unknown error'
    }, { status: 500 });
  }
} 