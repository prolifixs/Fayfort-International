import { headers } from "next/headers";

import { supabaseAdmin } from "../components/lib/supabase";

import { redirect } from "next/navigation";

export default async function RequestLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = headers();
  const token = headersList.get('authorization');
  
  if (token) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!['admin', 'supplier'].includes(user?.user_metadata?.role)) {
      redirect('/unauthorized');
    }
  }

  return <>{children}</>;
}
