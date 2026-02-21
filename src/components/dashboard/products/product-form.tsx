'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import { buildCategoryTree, flattenTree } from '@/lib/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Trash2, Package } from 'lucide-react'
import { toast } from 'sonner'
import { VariantManager, VariantsData } from './variant-manager'
import { ProductGallery } from './product-gallery'
import { deleteProductImages } from '@/lib/image-upload'
import { saveProduct, deleteProduct } from '@/services/product-service'

interface ProductFormProps {
  tenantId: string
  categories: Array<{ id: string; name: string; parent_id?: string | null }>
  product?: any
}

function parseVariantsFromProduct(product: any): VariantsData | null {
  const rows = product?.produtos_variacoes
  if (!rows || !Array.isArray(rows) || rows.length === 0) return null

  const attrsMap: Record<string, Set<string>> = {}
  for (const row of rows) {
    const combo = row.attributes || {}
    for (const [k, v] of Object.entries(combo)) {
      if (!attrsMap[k]) attrsMap[k] = new Set()
      attrsMap[k].add(String(v))
    }
  }

  const attributes = Object.entries(attrsMap).map(([name, set]) => ({
    name,
    options: Array.from(set)
  }))

  const items = rows.map((row: any) => ({
    id: row.id,
    combination: row.attributes || {},
    price: row.price,
    compare_at_price: row.compare_at_price,
    sku: row.sku || '',
    stock_quantity: row.stock_quantity,
    manage_stock: row.manage_stock,
    image_url: row.image_url,
    is_active: row.is_active,
    weight: row.weight,
    height: row.height,
    width: row.width,
    length: row.length,
  }))

  return { attributes, items }
}

export function ProductForm({ tenantId, categories, product }: ProductFormProps) {
  const router = useRouter()
  const isEditing = !!product
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories])
  const flatCategories = useMemo(() => flattenTree(categoryTree), [categoryTree])

  const existingVariants = parseVariantsFromProduct(product)
  const [hasVariants, setHasVariants] = useState(!!existingVariants)
  const [variantsData, setVariantsData] = useState<VariantsData>(
    existingVariants || { attributes: [], items: [] }
  )

  // Para produtos variaveis, manage_stock eh controlado por um toggle global no VariantManager
  const existingManageStockVariants = existingVariants?.items?.some(i => i.manage_stock) ?? false
  const [manageStockVariants, setManageStockVariants] = useState(existingManageStockVariants)

  // Imagens do produto
  const [tempProductId] = useState(() => product?.id || `temp-${crypto.randomUUID()}`)
  const [productImages, setProductImages] = useState<string[]>(() => {
    const imgs: string[] = []
    if (product?.image_url) imgs.push(product.image_url)
    if (Array.isArray(product?.images)) {
      imgs.push(...(product.images as string[]).filter(Boolean))
    }
    return imgs
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const categoryId = formData.get('categoria_id') as string
    const isActive = formData.get('is_active') === 'on'
    const featured = formData.get('featured') === 'on'

    let finalPrice: number
    let finalCompareAtPrice: number | null = null
    let finalSku: string | null = null
    let finalStockQuantity = 0
    let finalManageStock = false
    let variants: any = []
    let finalWeight: number | null = null
    let finalHeight: number | null = null
    let finalWidth: number | null = null
    let finalLength: number | null = null

    if (hasVariants && variantsData.items.length > 0) {
      // Validacao: deve ter ao menos uma variacao ativa
      const activeItems = variantsData.items.filter(i => i.is_active)
      if (activeItems.length === 0) {
        toast.error('Produtos variáveis devem ter ao menos uma variação ativa (visível).')
        setLoading(false)
        return
      }

      // Produto variavel: preco = menor das variacoes ativas
      variants = variantsData
      finalPrice = activeItems.length > 0
        ? Math.min(...activeItems.map(i => i.price))
        : parseFloat(formData.get('price') as string) || 0
      // manage_stock do produto fica true se gerencia por variacao
      finalManageStock = manageStockVariants
      // stock = soma das variacoes
      finalStockQuantity = manageStockVariants
        ? variantsData.items.reduce((sum, i) => sum + (i.is_active ? i.stock_quantity : 0), 0)
        : 0
    } else {
      // Produto simples
      finalPrice = parseFloat(formData.get('price') as string) || 0
      const compareAtPrice = formData.get('compare_at_price') as string
      finalCompareAtPrice = compareAtPrice ? parseFloat(compareAtPrice) : null
      finalSku = (formData.get('sku') as string) || null
      finalStockQuantity = parseInt(formData.get('stock_quantity') as string) || 0
      finalManageStock = formData.get('manage_stock') === 'on'

      const weightVal = formData.get('weight') as string
      const heightVal = formData.get('height') as string
      const widthVal = formData.get('width') as string
      const lengthVal = formData.get('length') as string
      finalWeight = weightVal ? parseFloat(weightVal) : null
      finalHeight = heightVal ? parseFloat(heightVal) : null
      finalWidth = widthVal ? parseFloat(widthVal) : null
      finalLength = lengthVal ? parseFloat(lengthVal) : null
    }

    const data = {
      loja_id: tenantId,
      name,
      slug: slugify(name),
      description: description || null,
      price: finalPrice,
      compare_at_price: finalCompareAtPrice,
      categoria_id: categoryId || null,
      sku: finalSku,
      stock_quantity: finalStockQuantity,
      manage_stock: finalManageStock,
      is_active: isActive,
      featured,
      image_url: productImages[0] || null,
      images: productImages.slice(1),
      weight: finalWeight,
      height: finalHeight,
      width: finalWidth,
      length: finalLength,
    }

    const supabase = createClient()
    try {
      await saveProduct(
        supabase,
        tenantId,
        data,
        hasVariants ? variantsData.items : [],
        product?.id
      )
      toast.success(isEditing ? 'Produto atualizado!' : 'Produto criado!')
    } catch (err: any) {
      console.error('Erro ao salvar produto:', err)
      toast.error('Erro ao salvar produto: ' + err.message)
      setLoading(false)
      return
    }

    router.push('/dashboard/products')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    setDeleting(true)

    // Collect all image URLs to delete from storage
    const allImageUrls: string[] = [...productImages]
    if (product?.produtos_variacoes) {
      for (const variant of product.produtos_variacoes) {
        if (variant.image_url) allImageUrls.push(variant.image_url)
      }
    }

    const supabase = createClient()
    try {
      await deleteProduct(supabase, tenantId, product.id)

      // Clean up storage images (fire-and-forget)
      if (allImageUrls.length > 0) {
        deleteProductImages(allImageUrls).catch(() => { })
      }

      toast.success('Produto excluido!')
      router.push('/dashboard/products')
      router.refresh()
    } catch (err) {
      toast.error('Erro ao excluir produto')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informacoes Basicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informacoes Basicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do produto *</Label>
            <Input id="name" name="name" required defaultValue={product?.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descricao</Label>
            <Textarea id="description" name="description" rows={4} defaultValue={product?.description} />
          </div>
          <div className="space-y-2">
            <Label>Imagens do produto</Label>
            <ProductGallery
              images={productImages}
              onChange={setProductImages}
              tenantId={tenantId}
              productId={tempProductId}
            />
          </div>
        </CardContent>
      </Card>

      {/* Variacoes — aparece logo apos informacoes basicas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Variacoes</CardTitle>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={hasVariants}
                onChange={(e) => {
                  setHasVariants(e.target.checked)
                  if (!e.target.checked) {
                    setVariantsData({ attributes: [], items: [] })
                    setManageStockVariants(false)
                  }
                }}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Este produto tem variacoes</span>
            </label>
          </div>
          {hasVariants && (
            <p className="text-xs text-muted-foreground mt-1">
              Configure as variacoes com preco, estoque, SKU e dimensoes de envio individuais
            </p>
          )}
        </CardHeader>
        {hasVariants && (
          <CardContent>
            <VariantManager
              value={variantsData}
              onChange={setVariantsData}
              basePrice={product?.price || 0}
              manageStockGlobal={manageStockVariants}
              onManageStockChange={setManageStockVariants}
              tenantId={tenantId}
              productId={tempProductId}
            />
          </CardContent>
        )}
      </Card>

      {/* Preco e Estoque — somente para produtos simples */}
      {!hasVariants && (
        <Card>
          <CardHeader>
            <CardTitle>Preco e Estoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preco (R$) *</Label>
                <Input id="price" name="price" type="number" step="0.01" min="0" required defaultValue={product?.price} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compare_at_price">Preco &quot;De&quot; (R$)</Label>
                <Input id="compare_at_price" name="compare_at_price" type="number" step="0.01" min="0" defaultValue={product?.compare_at_price} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" defaultValue={product?.sku} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Quantidade em estoque</Label>
                <Input id="stock_quantity" name="stock_quantity" type="number" min="0" defaultValue={product?.stock_quantity || 0} />
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="manage_stock" defaultChecked={product?.manage_stock} className="rounded border-gray-300" />
                <span className="text-sm">Gerenciar estoque</span>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Envio — somente para produtos simples */}
      {!hasVariants && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Envio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Deixe em branco para usar as dimensoes padrao da loja (configuradas em Integracoes → Melhor Envio)
            </p>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input id="weight" name="weight" type="number" step="0.001" min="0" placeholder="0.300" defaultValue={product?.weight || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Altura (cm)</Label>
                <Input id="height" name="height" type="number" step="0.1" min="0" placeholder="11" defaultValue={product?.height || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Largura (cm)</Label>
                <Input id="width" name="width" type="number" step="0.1" min="0" placeholder="11" defaultValue={product?.width || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="length">Comprimento (cm)</Label>
                <Input id="length" name="length" type="number" step="0.1" min="0" placeholder="11" defaultValue={product?.length || ''} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden inputs para produto variavel (para o form data nao ficar vazio) */}
      {hasVariants && (
        <>
          <input type="hidden" name="price" value={product?.price || 0} />
          <input type="hidden" name="sku" value="" />
          <input type="hidden" name="stock_quantity" value="0" />
        </>
      )}

      {/* Organizacao */}
      <Card>
        <CardHeader>
          <CardTitle>Organizacao</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoria_id">Categoria</Label>
            <Select id="categoria_id" name="categoria_id" defaultValue={product?.categoria_id || ''}>
              <option value="">Sem categoria</option>
              {flatCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {'— '.repeat(cat.level)}{cat.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2">
              <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} className="rounded border-gray-300" />
              <span className="text-sm">Ativo (visivel na loja)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" name="featured" defaultChecked={product?.featured} className="rounded border-gray-300" />
              <span className="text-sm">Destaque</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          {isEditing && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          )}
        </div>
        <div className="flex space-x-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Salvar' : 'Criar produto'}
          </Button>
        </div>
      </div>
    </form>
  )
}
