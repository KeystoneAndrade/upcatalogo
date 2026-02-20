import { getTenant } from '@/lib/get-tenant'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatCurrency, calculateDiscount } from '@/lib/utils'
import { AddToCartButton } from '@/components/storefront/add-to-cart-button'
import { VariantSelector } from '@/components/storefront/variant-selector'
import { Badge } from '@/components/ui/badge'
import { ProductImageGallery } from '@/components/storefront/product-image-gallery'

function hasVariants(product: any): boolean {
  const v = product.variants
  if (!v) return false
  if (Array.isArray(v) && v.length === 0) return false
  return !!(v.attributes && Array.isArray(v.attributes) && v.attributes.length > 0 && v.items?.length > 0)
}

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

  const productHasVariants = hasVariants(product)

  // Coletar imagens das variacoes (sem duplicar)
  const variantImages = productHasVariants
    ? (product.variants.items as any[])
        .map((v: any) => v.image_url)
        .filter(Boolean)
    : []

  const images = [...new Set([
    product.image_url,
    ...((product.images as string[]) || []),
    ...variantImages,
  ])].filter(Boolean) as string[]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        <ProductImageGallery images={images as string[]} productName={product.name} />

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            {discount > 0 && !productHasVariants && (
              <Badge className="mt-2 bg-red-500">-{discount}% OFF</Badge>
            )}
          </div>

          {productHasVariants ? (
            <VariantSelector product={product} />
          ) : (
            <>
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
            </>
          )}

          {/* Descricao sempre visivel, mesmo com variacoes */}
          {productHasVariants && product.description && (
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
