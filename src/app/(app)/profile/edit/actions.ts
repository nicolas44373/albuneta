'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateProfileAction(
  formData: FormData
): Promise<{ error: string } | void> {
  const username = (formData.get('username') as string).trim()
  const city     = (formData.get('city') as string).trim()
  const province = (formData.get('province') as string).trim()

  if (!username) return { error: 'El nombre de usuario es obligatorio' }
  if (!province) return { error: 'La provincia es obligatoria' }
  if (!city) return { error: 'La localidad o ciudad es obligatoria' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Check username is not taken by someone else
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .neq('id', user.id)
    .maybeSingle()

  if (existing) return { error: 'Ese nombre de usuario ya está en uso' }

  const { error } = await supabase
    .from('profiles')
    .update({ username, city, province })
    .eq('id', user.id)

  if (error) return { error: error.message }
}
