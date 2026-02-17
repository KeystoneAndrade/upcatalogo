import { getTenant } from '@/lib/get-tenant'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { resolveSlugPath, getCategoryPath, getDirectChildren, getAllDescendantIds } from '@/lib/categories'
import { ProductCard } from '@/components/storefront/product-card'
import Link from 'next/link'
import { ChevronRight, FolderOpen, Home } from 'lucide-react'

export default async function CategoryPage({ params }: { params: { slug: string[] } }) {
  const tenant = await getTenant()
  if (!tenant) notFound()

  const supabase = createClient()

  // Buscar todas as categorias ativas do tenant
  const { data: allCategories } = await supabase
    .from('categories')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('display_order')

  if (!allCategories) notFound()

  // Resolver o caminho de slugs para encontrar a categoria atual
  const currentCategory = resolveSlugPath(allCategories, params.slug)
  if (!currentCategory) notFound()

  // Montar breadcrumb
  const breadcrumbPath = getCategoryPath(allCategories, currentCategory.id)

  // Buscar filhas diretas
  const children = getDirectChildren(allCategories, currentCategory.id)
    .filter((c) => c.is_active)

  // Buscar produtos desta categoria E de todas as descendentes (sempre)
  const categoryIds = [currentCategory.id, ...getAllDescendantIds(allCategories, currentCategory.id)]

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .in('category_id', categoryIds)
    .order('display_order')

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
        <Link href="/produtos" className="hover:text-foreground flex items-center">
          <Home className="h-3.5 w-3.5 mr-1" />
          Inicio
        </Link>
        {breadcrumbPath.map((cat, index) => {
          const slugPath = breadcrumbPath
            .slice(0, index + 1)
            .map((c) => c.slug)
            .join('/')
          const isLast = index === breadcrumbPath.length - 1

          return (
            <span key={cat.id} className="flex items-center">
              <ChevronRight className="h-3.5 w-3.5 mx-1" />
              {isLast ? (
                <span className="font-medium text-foreground">{cat.name}</span>
              ) : (
                <Link href={`/categoria/${slugPath}`} className="hover:text-foreground">
                  {cat.name}
                </Link>
              )}
            </span>
          )
        })}
      </nav>

      <h1 className="text-2xl font-bold">{currentCategory.name}</h1>

      {currentCategory.description && (
        <p className="text-muted-foreground">{currentCategory.description}</p>
      )}

      {/* Subcategorias */}
      {children.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Subcategorias</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {children.map((child) => {
              const childSlugPath = breadcrumbPath
                .map((c) => c.slug)
                .concat(child.slug)
                .join('/')

              return (
                <Link
                  key={child.id}
                  href={`/categoria/${childSlugPath}`}
                  className="group"
                >
                  <div className="bg-white rounded-lg border overflow-hidden transition-shadow hover:shadow-md">
                    {child.image_url ? (
                      <div className="aspect-video bg-gray-100">
                        <img
                          src={child.image_url}
                          alt={child.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-100 flex items-center justify-center">
                        <FolderOpen className="h-10 w-10 text-gray-300" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-medium text-center">{child.name}</h3>
                      {child.description && (
                        <p className="text-xs text-muted-foreground text-center mt-1 line-clamp-2">
                          {child.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Produtos */}
      {products && products.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Produtos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {children.length === 0 && (!products || products.length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhuma subcategoria ou produto nesta categoria
        </div>
      )}
    </div>
  )
}
