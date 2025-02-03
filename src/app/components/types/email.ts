export interface EmailTrackingData {
  email_id: string;
  delivery_status: 'delivered' | 'failed' | 'bounced';
  opened_at?: string;
  open_count: number;
  updated_at: string;
  email_click_tracking?: EmailClickData[];
}

export interface EmailClickData {
  id: string;
  email_id: string;
  link_url: string;
  clicked_at: string;
} 