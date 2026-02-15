import { redirect } from 'next/navigation'
import { getTenant } from '@/lib/get-tenant'

export default async function StorefrontHomePage() {
  const tenant = await getTenant()

  // If on a tenant subdomain, redirect to /produtos
  if (tenant) {
    redirect('/produtos')
  }

  // Otherwise show nothing (will be handled by root page.tsx)
  return null
}
