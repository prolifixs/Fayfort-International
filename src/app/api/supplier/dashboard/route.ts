import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/app/components/types/database.types';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supplier_id = session.user.id;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'week';

    // Calculate date range
    const now = new Date();
    const daysToFetch = range === 'week' ? 7 : range === 'month' ? 30 : 365;
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - daysToFetch);

    const [salesData, productData, requestData, inventoryData] = await Promise.all([
      supabase
        .from('requests')
        .select('created_at, total_amount')
        .eq('supplier_id', supplier_id)
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString()),
      
      supabase
        .from('products')
        .select('name, request_count')
        .eq('supplier_id', supplier_id),
      
      supabase
        .from('requests')
        .select('status')
        .eq('supplier_id', supplier_id),
      
      supabase
        .from('products')
        .select('in_stock')
        .eq('supplier_id', supplier_id)
    ]);

    return NextResponse.json({
      salesData: salesData.data || [],
      productData: productData.data || [],
      requestData: requestData.data || [],
      inventoryData: inventoryData.data || []
    });

  } catch (error) {
    console.error('Error fetching supplier dashboard data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 