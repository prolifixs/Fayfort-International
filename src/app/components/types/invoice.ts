export interface Customer {
  name: string
  email: string
  shipping_address?: ShippingAddress
}

export interface Product {
  name: string
  category: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  product: {
    name: string
    description: string
  }
}

export interface InvoiceRequest {
  customer: Customer
}

export interface InvoiceData {
  id: string;
  status: string;
  amount: number;
  created_at: string;
  due_date: string;
  request: {
    customer: {
      name: string;
      email: string;
      shipping_address?: {
        street_address: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
      };
    };
  };
  invoices: InvoiceItem[];
}

export type InvoiceStatus = 'paid' | 'unpaid' | 'pending'

export interface NotificationEmailData {
  to: string
  subject: string
  content: string
}

export interface InvoiceWithCustomer {
  id: string
  request_id: string
  user_id: string
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  amount: number
  due_date: string
  created_at: string
  updated_at: string
  pdf_url?: string
  customer_name: string
  customer_email: string
  user: {
    name: string
    email: string
    shipping_address: {
      street_address: string
      city: string
      state: string
      postal_code: string
      country: string
    }
  }
}

export interface ShippingAddress {
  street_address: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
  user_id?: string
}

export interface Invoice {
  id: string
  request_id: string
  user_id: string
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  amount: number
  due_date: string
  created_at: string
  updated_at: string
  pdf_url?: string
  invoice_items: InvoiceItem[]
  request?: {
    id: string
    customer: {
      name: string
      email: string
      shipping_address?: ShippingAddress
    }
  }
}

export interface EmailQueueItem {
  id?: string;
  status: string;
  attempts: number;
  lastAttempt: number | null;
  createdAt: number;
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
  }>;
} 