import { supabase } from './supabase'

export async function checkIsAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('teachers')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return data?.is_admin === true
}