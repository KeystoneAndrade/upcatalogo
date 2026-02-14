import { getTenant } from '@/lib/get-tenant'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatCurrency, calculateDiscount } from '@/lib/utils'
import { AddToCartButton } from '@/components/storefront/add-to-cart-button'
import { Badge } from '@/components/ui/badge'

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const tenant = await getTenant()
  if (!tenant) notFound()

  const supabase = createClient()
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single()

  if (!product) notFound()

  const discount = product.compare_at_price
    ? calculateDiscount(product.compare_at_price, product.price)
    : 0

  const images = [product.image_url, ...((product.images as string[]) || [])].filter(Boolean)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          {images.length > 0 ? (
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={images[0]!}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-300">
              Sem imagem
            </div>
          )}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(1).map((img, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded overflow-hidden">
                  <img src={img!} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            {discount > 0 && (
              <Badge className="mt-2 bg-red-500">-{discount}% OFF</Badge>
            )}
          </div>

          <div className="space-y-1">
            {product.compare_at_price && (
              <p className="text-lg text-muted-foreground line-through">
                {formatCurrency(product.compare_at_price)}
              </p>
            )}
            <p className="text-3xl font-bold">{formatCurrency(product.price)}</p>
          </div>

          {product.description && (
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          {product.manage_stock && product.stock_quantity <= 0 ? (
            <p className="text-red-500 font-medium">Produto esgotado</p>
          ) : (
            <AddToCartButton product={product} />
          )}

          {product.sku && (
            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
          )}
        </div>
      </div>
    </div>
  )
}
