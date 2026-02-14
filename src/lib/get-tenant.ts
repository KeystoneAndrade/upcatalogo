import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function getTenant() {
  const headersList = headers()
  const tenantId = headersList.get('x-tenant-id')

  if (!tenantId) return null

  const supabase = createClient()
  const { data } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  return data
}
