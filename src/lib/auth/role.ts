import type { User } from '@supabase/supabase-js'

export type Role = 'admin' | 'customer' | 'supplier'

/**
 * A user's role, read from app_metadata: only the service role can write it. user_metadata is
 * editable by every signed-in user (supabase.auth.updateUser), so a role kept there lets anyone
 * make themselves admin. Anyone without a role in app_metadata is a customer.
 *
 * Grant a role from the Supabase SQL editor:
 *   update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' where email = '…';
 */
export function roleOf(user: Pick<User, 'app_metadata'> | null | undefined): Role {
  const role = user?.app_metadata?.role
  return role === 'admin' || role === 'supplier' ? role : 'customer'
}
