import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { activityService } from './activityService';
import { pdfService } from './pdfService';
import { emailService } from './emailService';

export async function generateInvoice(requestId: string) {
  const supabase = createClientComponentClient();
  
  try {
    console.log('🔍 Fetching request:', requestId);
    
    // First query: Get request details
    const { data: request, error: requestError } = await supabase
      .from('requests')
      .select('id, budget, customer_id, product_id, quantity')
      .eq('id', requestId)
      .single();

    console.log('📝 Request data:', { request, error: requestError?.message });

    if (requestError) throw requestError;
    if (!request) throw new Error(`Request not found: ${requestId}`);

    // Second query: Get user details directly
    const { data: user, error: error2 } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', request.customer_id)
      .single();
    
    console.log('👤 User data:', { 
      user_id: request.customer_id,
      user,
      error: error2?.message 
    });

    if (error2) throw error2;
    if (!user) throw new Error(`User not found: ${request.customer_id}`);

    // Create invoice with due_date (30 days from now by default)
    const { data: newInvoice, error: createError } = await supabase
      .from('invoices')
      .insert({
        request_id: requestId,
        user_id: request.customer_id,
        amount: request.budget,
        status: 'draft',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      })
      .select()
      .single();

    if (createError) throw createError;
    if (!newInvoice) throw new Error('Failed to create invoice');

    // Add invoice items
    const { error: itemError } = await supabase
      .from('invoice_items')
      .insert({
        invoice_id: newInvoice.id,
        product_id: request.product_id,
        quantity: request.quantity,
        unit_price: request.budget / request.quantity,
        total_price: request.budget
      });

    if (itemError) throw itemError;

    // Now fetch the complete invoice with all relations
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        request:requests (
          *,
          customer:users (
            id,
            name,
            email
          )
        ),
        invoice_items (
          *,
          product:products (
            *
          )
        )
      `)
      .eq('id', newInvoice.id)
      .single();

    console.log('📋 Invoice creation result:', { invoice, error: invoiceError?.message });

    if (invoiceError) throw invoiceError;

    // Generate and store PDF
    const pdfUrl = await pdfService.generateAndStore(invoice);

    // Send invoice email (make it optional)
    try {
      await emailService.sendInvoiceEmail(invoice, user.email);
    } catch (error) {
      console.warn('Email sending failed, but continuing:', error);
      // Don't throw error, allow process to continue
    }

    // Create notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: request.customer_id,
        type: 'invoice_ready',
        content: `New invoice generated for your request ${requestId}`,
        reference_id: invoice.id,
        reference_type: 'invoice',
        read_status: false,
        metadata: {
          invoice_id: invoice.id,
          amount: request.budget,
          request_id: requestId,
          pdf_url: pdfUrl
        }
      });

    if (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    // Use activityService to log to activity_log table
    await activityService.logActivity({
      type: 'invoice_generated',
      content: `Invoice generated for request ${requestId}`,
      description: `Invoice generated for request ${requestId} with amount ${request.budget}`,
      reference_id: invoice.id,
      user_email: user.email,
      metadata: {
        request_id: requestId,
        invoice_id: invoice.id,
        amount: request.budget
      }
    });

    console.log('✅ Invoice created successfully');
    return true;
  } catch (error) {
    console.error('❌ Invoice generation failed:', error);
    throw error;
  }
} 