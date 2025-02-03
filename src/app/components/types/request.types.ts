import { Database } from './database.types';

// Base request type from database
export type BaseRequest = Database['public']['Tables']['requests']['Row'];

// Extended request type with relationships
export interface RequestWithRelations {
  id: string;
  status: RequestStatus;
  created_at: string;
  quantity: number;
  budget: number;
  invoice?: {
    amount: number;
  };
  product: {
    id: string;
    name: string;
  };
  customer: {
    id: string;
    email: string | null;
  };
}

export function isValidRequest(request: any): request is RequestWithRelations {
  return (
    request &&
    typeof request.id === 'string' &&
    typeof request.customer_id === 'string' &&
    typeof request.product_id === 'string' &&
    request.product &&
    typeof request.product.name === 'string'
  )
}

// Request status type
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'shipped';

export type RequestStatusWithAll = RequestStatus | 'all';

// Request form data type
export type RequestFormData = Pick<BaseRequest, 'product_id' | 'quantity' | 'budget'> & {
  notes?: string;
};

export type SortField = 'created_at' | 'status' | 'product.name' | 'user.email' | 'budget' | 'quantity'; 