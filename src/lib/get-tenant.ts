import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function getTenant() {
  const headersList = headers()

  // Try to get tenant from subdomain header first
  const tenantSubdomain = headersList.get('x-tenant-subdomain')

  if (!tenantSubdomain) return null

  const supabase = createClient()

  // Query by subdomain
  const { data } = await supabase
    .from('tenants')
    .select('*')
    .eq('subdomain', tenantSubdomain)
    .eq('status', 'active')
    .single()

  return data
}
