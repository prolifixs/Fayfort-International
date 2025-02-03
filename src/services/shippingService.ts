import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface ShippingInfo {
  trackingNumber: string;
  carrier: string;
  shippingDate: string | null;
}

export class ShippingService {
  private supabase = createClientComponentClient();

  async processShippingUpdate(requestId: string, shippingInfo: ShippingInfo) {
    console.group('🚢 Processing Shipping Update');
    
    try {
      // 1. Verify current status
      const { data: currentRequest } = await this.supabase
        .from('requests')
        .select('status')
        .eq('id', requestId)
        .single();

      if (!currentRequest || currentRequest.status !== 'fulfilled') {
        throw new Error(`Invalid request status: ${currentRequest?.status}`);
      }

      // 2. Update in a single transaction
      const { error: updateError } = await this.supabase
        .from('requests')
        .update({
          status: 'shipped',
          tracking_number: shippingInfo.trackingNumber,
          carrier: shippingInfo.carrier,
          shipping_date: shippingInfo.shippingDate || new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('status', 'fulfilled'); // Extra safety check

      if (updateError) throw updateError;

      // 3. Verify update
      const { data: verifiedData, error: verifyError } = await this.supabase
        .from('requests')
        .select('status, tracking_number, carrier, shipping_date')
        .eq('id', requestId)
        .single();

      if (verifyError || !verifiedData || verifiedData.status !== 'shipped') {
        throw new Error('Shipping update verification failed');
      }

      // After successful update
      await this.supabase
        .channel('request_updates')
        .send({
          type: 'broadcast',
          event: 'REQUEST_UPDATE',
          payload: verifiedData
        });

      console.log('✅ Shipping update completed successfully');
      return verifiedData;

    } catch (error) {
      console.error('❌ Shipping update failed:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }
} 