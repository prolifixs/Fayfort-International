export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'customer' | 'supplier'
          status: 'active' | 'inactive'
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          category_id: string
          price_range: string
          image_url: string | null
          availability: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description?: string | null
          category_id: string
          price_range: string
          image_url?: string | null
          availability?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      requests: {
        Row: {
          id: string
          customer_id: string
          product_id: string
          quantity: number
          budget: number
          status: 'pending' | 'approved' | 'rejected' | 'fulfilled'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['requests']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['requests']['Insert']>
      }
      status_history: {
        Row: {
          id: string
          request_id: string
          status: string
          notes: string | null
          updated_by: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['status_history']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['status_history']['Insert']>
      }
      categories: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      supplier_responses: {
        Row: {
          id: string
          request_id: string
          supplier_id: string
          price: number | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['supplier_responses']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['supplier_responses']['Insert']>
      }
      activity_log: {
        Row: {
          id: string
          user_id: string
          user_email: string
          type: string
          content: string
          reference_id: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['activity_log']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['activity_log']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'success' | 'error' | 'warning' | 'info' | 'status_change' | 'invoice_ready' | 
                'invoice_paid' | 'payment_received' | 'payment_due' | 'request_update'
          content: string
          reference_id: string | null
          reference_type: string
          metadata: Json | null
          read_status: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          request_id: string
          user_id: string
          status: 'draft' | 'sent' | 'paid' | 'cancelled'
          amount: number
          due_date: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
      product_media: {
        Row: {
          id: string
          product_id: string
          url: string
          media_type: 'image' | 'video'
          is_primary: boolean
          order_index: number
          thumbnail_url?: string
          created_at: string
        }
        Insert: {
          product_id: string
          url: string
          media_type: 'image' | 'video'
          is_primary?: boolean
          order_index?: number
          thumbnail_url?: string
        }
        Update: {
          url?: string
          is_primary?: boolean
          order_index?: number
          thumbnail_url?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type TableRow<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

export type TableInsert<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']

export type TableUpdate<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'] 

export type SupabaseRequestResponse = {
  id: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  quantity: number;
  budget: number;
  notes: string | null;
  customer_id: string;
  product_id: string;
  product: [{
    name: string;
    category: string;
    image_url: string | null;
  }];
  customer: [{
    name: string;
    email: string;
  }];
  status_history: {
    id: string;
    status: string;
    notes: string | null;
    created_at: string;
    updated_by: {
      id: string;
      name: string;
    };
  }[];
}

export function isSupabaseRequestResponse(obj: any): obj is SupabaseRequestResponse {
  return obj 
    && typeof obj.id === 'string'
    && Array.isArray(obj.product)
    && Array.isArray(obj.customer);
} 

export type Activity = Database['public']['Tables']['activity_log']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationType = Notification['type'] 