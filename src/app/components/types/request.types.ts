import { Database } from './database.types';

// Base request type from database
export type BaseRequest = Database['public']['Tables']['requests']['Row'];

// Extended request type with relationships
export interface RequestWithRelations extends BaseRequest {
  product: {
    name: string;
    category: string;
    image_url: string | null;
  };
  customer?: {
    name: string;
    email: string;
  };
  status_history?: {
    id: string;
    status: string;
    notes?: string;
    created_at: string;
    updated_by: {
      id: string;
      name: string;
    };
  }[];
}

// Request status type
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'fulfilled';

export type RequestStatusWithAll = RequestStatus | 'all';

// Request form data type
export type RequestFormData = Pick<BaseRequest, 'product_id' | 'quantity' | 'budget'> & {
  notes?: string;
}; 