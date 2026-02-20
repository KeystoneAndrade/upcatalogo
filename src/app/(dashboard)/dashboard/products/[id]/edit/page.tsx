import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProductForm } from '@/components/dashboard/products/product-form'
import { getTenant } from '@/services/tenant-service'
import { getProductById } from '@/services/product-service'
import { getCategories } from '@/services/category-service'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const tenant = await getTenant(supabase)

  const product = await getProductById(supabase, tenant.id, params.id)
  if (!product) notFound()

  const categories = await getCategories(supabase, tenant.id, true)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Produto</h1>
      <ProductForm tenantId={tenant!.id} categories={categories || []} product={product} />
    </div>
  )
}
