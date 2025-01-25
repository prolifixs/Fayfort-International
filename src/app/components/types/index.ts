export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price_range: string;
  image_url: string | null;
  availability: boolean;
  created_at: string;
  updated_at: string;
}

export interface Request {
  id: string;
  customer_id: string;
  product_details: {
    name: string;
    description: string;
    quantity: number;
    budget: number;
  };
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'supplier';
} 