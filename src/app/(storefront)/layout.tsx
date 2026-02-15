import { getTenant } from '@/lib/get-tenant'
import { StorefrontHeader } from '@/components/storefront/header'
import { notFound } from 'next/navigation'

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenant()

  // If no tenant found and user is on a subdomain, return 404
  // This will trigger notFound() which shows a 404 page
  if (!tenant) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StorefrontHeader tenant={tenant} />
      <main className="container mx-auto px-4 py-6">{children}</main>
      <footer className="bg-white border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>{tenant.name}</p>
          {tenant.instagram && <p className="mt-1">@{tenant.instagram}</p>}
          <p className="mt-2 text-xs">Powered by UP Catalogo</p>
        </div>
      </footer>
    </div>
  )
}
