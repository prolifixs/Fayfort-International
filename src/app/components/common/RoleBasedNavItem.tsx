import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';


interface RoleBasedNavItemProps {
  href: string;
  allowedRoles: string[];
  children: React.ReactNode;
}

export default function RoleBasedNavItem({ href, allowedRoles, children }: RoleBasedNavItemProps) {
  const [isAllowed, setIsAllowed] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userRole = session?.user?.user_metadata?.role;
      setIsAllowed(allowedRoles.includes(userRole));
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
