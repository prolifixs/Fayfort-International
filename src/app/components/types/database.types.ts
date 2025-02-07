import { InvoiceStatus } from "./invoice"

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
          status: 'active' | 'inactive'
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
          status?: 'active' | 'inactive'
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
          status: RequestStatus
          resolution_status: ResolutionStatus
          invoice_status: 'paid' | 'unpaid'
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
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'success' | 'error' | 'warning' | 'info' | 'status_change' | 'invoice_ready' | 
                'invoice_paid' | 'payment_received' | 'payment_due' | 'request_update' | 'email_sent'
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
          media_type: 'video' | 'image'
          is_primary: boolean
          order_index: number
          thumbnail_url?: string
          created_at: string
        }
        Insert: {
          product_id: string
          url: string
          media_type: 'video' | 'image'
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
      shipping_address: {
        Row: {
          id: string
          user_id: string
          street_address: string
          city: string
          state: string
          postal_code: string
          country: string
          is_default: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['shipping_address']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['shipping_address']['Insert']>
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
export type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

export type TableInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']

export type TableUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

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

export type NotificationType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'status_change' 
  | 'invoice_ready'
  | 'invoice_paid' 
  | 'payment_received' 
  | 'payment_due' 
  | 'request_update'
  | 'email_sent'

export type RequestStatus = 
  | 'pending' 
  | 'approved' 
  | 'fulfilled' 
  | 'shipped'
  | 'rejected'
  | 'notified'
  | 'resolved';

export type ProductStatus = 'active' | 'inactive'

export interface User extends TableRow<'users'> {
  email: string
}

export interface Request extends TableRow<'requests'> {
  product: {
    id: string
    name: string
    status: string
  }
  customer: {
    id: string
    email: string
  }
  status: 'pending' | 'approved' | 'rejected'
  resolution_status: 'pending' | 'notified' | 'resolved'
  notification_sent: boolean
  created_at: string
  quantity: number
  budget: number
}

export type ProductMedia = TableRow<'product_media'>
export type Category = TableRow<'categories'>

// Base product type
interface BaseProduct extends TableRow<'products'> {
  media?: ProductMedia[]
  category?: Category
}

// Product with different states
export interface ActiveProduct extends BaseProduct {
  requests: (Request & {
    invoice_status: 'paid' | 'unpaid'
    status: 'pending' | 'approved' | 'rejected'
  })[]
}

export interface InactiveProduct extends BaseProduct {
  requests: (Request & {
    invoice_status: InvoiceStatus
    resolution_status: RequestStatus
    notification_sent: boolean
  })[]
}

export type Product = ActiveProduct | InactiveProduct

export type ProductWithRequests = BaseProduct & {
  requests: Request[]
}

export type ResolutionStatus = 'pending' | 'notified' | 'resolved';

// Update RequestProcessor method signature
export interface RequestProcessor {
  updateRequestStatus: (requestId: string, status: RequestStatus | ResolutionStatus, type?: 'request' | 'resolution') => Promise<void>;
}

export interface DatabaseRequest extends TableRow<'requests'> {
  status: RequestStatus;
  resolution_status: ResolutionStatus;
  invoice_status: 'paid' | 'unpaid';
  notification_sent: boolean;
}