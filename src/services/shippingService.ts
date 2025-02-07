import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface ShippingInfo {
  trackingNumber: string;
  carrier: string;
  shippingDate: string | null;
}

export class ShippingService {
  private supabase = createClientComponentClient();

  async processShippingUpdate(requestId: string, shippingInfo: ShippingInfo): Promise<void> {
    console.group('🚢 Shipping Update Flow');
    console.log('1️⃣ Starting Shipping Update:', { requestId, shippingInfo });
    
    try {
      console.log('2️⃣ Updating Request with Shipping Info');
      const { error: updateError } = await this.supabase
        .from('requests')
        .update({
          tracking_number: shippingInfo.trackingNumber,
          carrier: shippingInfo.carrier,
          shipping_date: shippingInfo.shippingDate || new Date().toISOString(),
          status: 'shipped',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('3️⃣ Shipping Update Failed:', updateError);
        throw updateError;
      }
      
      console.log('4️⃣ Shipping Update Successful');
    } catch (error) {
      console.error('❌ Shipping Update Error:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }
} 