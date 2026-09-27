import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Invoice, InvoiceData } from '@/app/components/types/invoice';
import { generateInvoicePDF } from '@/app/components/lib/pdf/generateInvoicePDF';

export const pdfService = {
  async generateAndStore(invoice: Invoice): Promise<string> {
    console.log('📝 PDFService: Starting PDF generation and storage');
    const supabase = createSupabaseBrowserClient();
    
    try {
      const transformedInvoice: InvoiceData = {
        id: invoice.id,
        status: invoice.status,
        amount: invoice.amount,
        created_at: invoice.created_at,
        due_date: invoice.due_date,
        request: {
          customer: {
            name: invoice.request?.customer?.name || 'N/A',
            email: invoice.request?.customer?.email || 'N/A',
            shipping_address: invoice.request?.customer?.shipping_address
          }
        },
        invoices: invoice.invoice_items.map(item => ({
          ...item,
          product: {
            ...item.product,
            category: 'default'
          }
        }))
      };

      console.log('🔄 PDFService: Transformed invoice data:', transformedInvoice);
      const pdfBuffer = await generateInvoicePDF(transformedInvoice);
      console.log('✅ PDFService: PDF buffer generated');

      const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
      
      // Upload directly to Supabase storage
      const filePath = `invoices/${invoice.id}/${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(filePath);

      // Update invoice record with URL
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ pdf_url: publicUrl })
        .eq('id', invoice.id);

      if (updateError) throw updateError;

      console.log('📤 PDFService: PDF uploaded, URL:', publicUrl);
      return publicUrl;

    } catch (error) {
      console.error('❌ PDFService: Failed:', error);
      throw error;
    }
  }
};