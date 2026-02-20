import { ProductForm } from '@/components/dashboard/products/product-form'
import { createClient } from '@/lib/supabase/server'
import { getTenant } from '@/services/tenant-service'
import { getCategories } from '@/services/category-service'

export default async function NewProductPage() {
  const supabase = createClient()
  const tenant = await getTenant(supabase)

  const categories = await getCategories(supabase, tenant.id, true)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Novo Produto</h1>
      <ProductForm tenantId={tenant!.id} categories={categories || []} />
    </div>
  )
}
