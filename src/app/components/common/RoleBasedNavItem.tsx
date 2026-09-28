import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { roleOf } from '@/lib/auth/role';


interface RoleBasedNavItemProps {
  href: string;
  allowedRoles: string[];
  children: React.ReactNode;
}

export default function RoleBasedNavItem({ href, allowedRoles, children }: RoleBasedNavItemProps) {
  const [isAllowed, setIsAllowed] = useState(false);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAllowed(Boolean(user) && allowedRoles.includes(roleOf(user)));
    };
    checkRole();
  }, [allowedRoles]);

  if (!isAllowed) return null;

  return (
    <Link href={href}>
      {children}
    </Link>
  );

}
