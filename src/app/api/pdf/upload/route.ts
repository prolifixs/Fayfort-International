import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const formData = await request.formData();
    const pdfBlob = formData.get('pdf') as Blob;
    const invoiceId = formData.get('invoiceId') as string;
    
    const filePath = `invoices/${invoiceId}/${Date.now()}.pdf`;
    
    // Upload to Supabase storage
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

    // Update invoice record
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ pdf_url: publicUrl })
      .eq('id', invoiceId);

    if (updateError) throw updateError;

    return NextResponse.json({ url: publicUrl });
    
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json(
      { error: 'Upload failed' }, 
      { status: 500 }
    );
  }
} 