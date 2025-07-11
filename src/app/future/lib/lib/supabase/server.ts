import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerClient() {
  const cookieStore = cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export async function getUser() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getSession() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUserCompany() {
  const user = await getUser();
  if (!user) return null;

  const supabase = createServerClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  return profile?.company_id || null;
}