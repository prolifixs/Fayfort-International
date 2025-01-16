export interface Customer {
  name: string
  email: string
  shipping_address?: {
    street_address: string
    city: string
    state: string
    postal_code: string
    country: string
  }
}

export interface Product {
  name: string
  category: string
}

export interface InvoiceItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: Product;
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
  invoice_items: InvoiceItem[];
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled'

export interface NotificationEmailData {
  to: string
  subject: string
  content: string
}

export interface Invoice {
  id: string
  request_id: string
  request: {
    id: string
    customer: {
      name: string
      email: string
    }
  }
  user_id: string
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  amount: number
  due_date: string
  created_at: string
  updated_at: string
  pdf_url?: string
}

// For when we need user/customer info, extend the base interface
export interface InvoiceWithCustomer extends Invoice {
  customer_name: string
  customer_email: string
}

// For when we need items, extend again
export interface InvoiceWithItems extends InvoiceWithCustomer {
  items: {
    id: string
    quantity: number
    unit_price: number
    total_price: number
    product_name: string
    product_description: string
  }[]
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