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
          category: string
          price_range: string
          image_url: string | null
          availability: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
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
          price: number
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['supplier_responses']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['supplier_responses']['Insert']>
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