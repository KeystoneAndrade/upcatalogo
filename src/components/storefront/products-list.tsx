import { getTenant } from '@/lib/get-tenant'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProductCard } from '@/components/storefront/product-card'

export async function ProductsList() {
  const tenant = await getTenant()
  if (!tenant) notFound()

  const supabase = createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('display_order')

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('display_order')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Todos os Produtos</h1>

      {categories && categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat.id}
              className="px-3 py-1 bg-white border rounded-full text-sm cursor-pointer hover:bg-gray-50"
            >
              {cat.name}
            </span>
          ))}
        </div>
      )}

      {!products || products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum produto disponivel
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
