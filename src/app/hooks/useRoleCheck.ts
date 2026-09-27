import { useState, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export function useRoleCheck() {
  const [roleCache] = useState(new Map())
  const supabase = createSupabaseBrowserClient()
  
  const checkRole = useCallback(async (userId: string) => {
    if (roleCache.has(userId)) return roleCache.get(userId)
    
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
      
    if (error) throw error
    
    roleCache.set(userId, data.role)
    return data.role
  }, [])

  return { checkRole }
} 