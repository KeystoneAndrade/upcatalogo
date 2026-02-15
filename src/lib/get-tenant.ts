import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function getTenant() {
  const headersList = headers()

  // Try to get tenant from subdomain header first
  const tenantSubdomain = headersList.get('x-tenant-subdomain')

  if (!tenantSubdomain) {
    return null
  }

  try {
    const supabase = createClient()

    // Query by subdomain
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('subdomain', tenantSubdomain)
      .eq('status', 'active')
      .single()

    if (error) {
      console.error('Error fetching tenant:', {
        subdomain: tenantSubdomain,
        error: error.message,
      })
      return null
    }

    return data
  } catch (error) {
    console.error('Exception fetching tenant:', error)
    return null
  }
}
