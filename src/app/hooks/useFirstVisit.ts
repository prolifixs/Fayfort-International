import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export const useFirstVisit = () => {
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(true);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const checkFirstVisit = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const userId = session.user.id;
      const visitKey = `hasVisited_${userId}`;
      
      const hasVisited = localStorage.getItem(visitKey);
      if (!hasVisited) {
        setIsFirstVisit(true);
      } else {
        setIsFirstVisit(false);
      }
    };

    checkFirstVisit();
  }, []);

  const markVisited = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const userId = session.user.id;
    const visitKey = `hasVisited_${userId}`;
    localStorage.setItem(visitKey, 'true');
    setIsFirstVisit(false);
  };

  return { isFirstVisit, markVisited };
}; 