import { getTenant } from '@/lib/get-tenant'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProductCard } from '@/components/storefront/product-card'
import Link from 'next/link'
import { FolderOpen } from 'lucide-react'

export async function ProductsList() {
  const tenant = await getTenant()
  if (!tenant) notFound()

  const supabase = createClient()
  const { data: products } = await supabase
    .from('produtos')
    .select('*, produtos_variacoes(*)')
    .eq('loja_id', tenant.id)
    .eq('is_active', true)
    .order('display_order')

  const { data: categories } = await supabase
    .from('categorias')
    .select('*')
    .eq('loja_id', tenant.id)
    .eq('is_active', true)
    .order('display_order')

  // Apenas categorias raiz (sem parent_id)
  const rootCategories = (categories || []).filter((cat) => !cat.parent_id)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Todos os Produtos</h1>

      {rootCategories.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Categorias</h2>
          <div className="flex flex-wrap gap-2">
            {rootCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categoria/${cat.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border rounded-full text-sm hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                <FolderOpen className="h-3.5 w-3.5 text-gray-400" />
                {cat.name}
              </Link>
            ))}
          </div>
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
