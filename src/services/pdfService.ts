import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Invoice, InvoiceData } from '@/app/components/types/invoice';
import { generateInvoicePDF } from '@/app/components/lib/pdf/generateInvoicePDF';

export const pdfService = {
  async generateAndStore(invoice: Invoice) {
    const supabase = createClientComponentClient();
    
    try {
      // Generate PDF buffer directly
      const pdfBuffer = await generateInvoicePDF(invoice as unknown as InvoiceData);
      
      // Convert Buffer to Blob
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

      return publicUrl;

    } catch (error) {
      console.error('PDF generation/storage failed:', error);
      throw new Error('PDF processing failed');
    }
  }
};