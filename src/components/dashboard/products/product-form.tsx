'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { VariantManager, VariantsData } from './variant-manager'

interface ProductFormProps {
  tenantId: string
  categories: Array<{ id: string; name: string }>
  product?: any
}

function parseVariantsFromProduct(product: any): VariantsData | null {
  if (!product?.variants) return null
  const v = product.variants
  if (Array.isArray(v) && v.length === 0) return null
  if (v.attributes && Array.isArray(v.attributes) && v.attributes.length > 0) {
    return v as VariantsData
  }
  return null
}

export function ProductForm({ tenantId, categories, product }: ProductFormProps) {
  const router = useRouter()
  const isEditing = !!product
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const existingVariants = parseVariantsFromProduct(product)
  const [hasVariants, setHasVariants] = useState(!!existingVariants)
  const [variantsData, setVariantsData] = useState<VariantsData>(
    existingVariants || { attributes: [], items: [] }
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const compareAtPrice = formData.get('compare_at_price') as string
    const categoryId = formData.get('category_id') as string
    const sku = formData.get('sku') as string
    const stockQuantity = parseInt(formData.get('stock_quantity') as string) || 0
    const manageStock = formData.get('manage_stock') === 'on'
    const isActive = formData.get('is_active') === 'on'
    const featured = formData.get('featured') === 'on'
    const imageUrl = formData.get('image_url') as string

    // Se tem variacoes, ajustar preco para o menor das variacoes
    let finalPrice = price
    let variants: any = []

    if (hasVariants && variantsData.items.length > 0) {
      variants = variantsData
      const activeItems = variantsData.items.filter(i => i.is_active)
      if (activeItems.length > 0) {
        finalPrice = Math.min(...activeItems.map(i => i.price))
      }
    }

    const data = {
      tenant_id: tenantId,
      name,
      slug: slugify(name),
      description: description || null,
      price: finalPrice,
      compare_at_price: compareAtPrice ? parseFloat(compareAtPrice) : null,
      category_id: categoryId || null,
      sku: sku || null,
      stock_quantity: stockQuantity,
      manage_stock: manageStock,
      is_active: isActive,
      featured,
      image_url: imageUrl || null,
      variants,
    }

    const supabase = createClient()

    if (isEditing) {
      const { error } = await supabase
        .from('products')
        .update(data)
        .eq('id', product.id)
      if (error) {
        toast.error('Erro ao atualizar produto')
        setLoading(false)
        return
      }
      toast.success('Produto atualizado!')
    } else {
      const { error } = await supabase.from('products').insert(data)
      if (error) {
        toast.error('Erro ao criar produto: ' + error.message)
        setLoading(false)
        return
      }
      toast.success('Produto criado!')
    }

    router.push('/dashboard/products')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (error) {
      toast.error('Erro ao excluir produto')
      setDeleting(false)
      return
    }
    toast.success('Produto excluido!')
    router.push('/dashboard/products')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            <Label htmlFor="image_url">URL da imagem</Label>
            <Input id="image_url" name="image_url" placeholder="https://..." defaultValue={product?.image_url} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preco e Estoque</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">
                {hasVariants ? 'Preco base (R$)' : 'Preco (R$) *'}
              </Label>
              <Input id="price" name="price" type="number" step="0.01" min="0" required defaultValue={product?.price} />
              {hasVariants && (
                <p className="text-xs text-muted-foreground">
                  O preco exibido sera o menor entre as variacoes ativas
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="compare_at_price">Preco "De" (R$)</Label>
              <Input id="compare_at_price" name="compare_at_price" type="number" step="0.01" min="0" defaultValue={product?.compare_at_price} />
            </div>
          </div>
          {!hasVariants && (
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
          )}
          {!hasVariants && (
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2">
                <input type="checkbox" name="manage_stock" defaultChecked={product?.manage_stock} className="rounded border-gray-300" />
                <span className="text-sm">Gerenciar estoque</span>
              </label>
            </div>
          )}
          {hasVariants && (
            <>
              <input type="hidden" name="sku" value="" />
              <input type="hidden" name="stock_quantity" value="0" />
            </>
          )}
        </CardContent>
      </Card>

      {/* Variacoes */}
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
                  }
                }}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Este produto tem variacoes</span>
            </label>
          </div>
        </CardHeader>
        {hasVariants && (
          <CardContent>
            <VariantManager
              value={variantsData}
              onChange={setVariantsData}
              basePrice={product?.price || 0}
            />
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organizacao</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category_id">Categoria</Label>
            <Select id="category_id" name="category_id" defaultValue={product?.category_id || ''}>
              <option value="">Sem categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
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
