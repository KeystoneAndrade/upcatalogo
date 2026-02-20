'use client'

import { useState, useMemo } from 'react'
import { useCartStore } from '@/store/cart-store'
import { useTenantSettings } from '@/components/storefront/tenant-settings-provider'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'

interface VariantAttribute {
  name: string
  options: string[]
}

interface VariantItem {
  id: string
  combination: Record<string, string>
  price: number
  compare_at_price: number | null
  sku: string
  stock_quantity: number
  manage_stock: boolean
  image_url: string | null
  is_active: boolean
  weight?: number | null
  height?: number | null
  width?: number | null
  length?: number | null
}

interface VariantsData {
  attributes: VariantAttribute[]
  items: VariantItem[]
}

interface VariantSelectorProps {
  product: {
    id: string
    name: string
    price: number
    compare_at_price: number | null
    image_url: string | null
    manage_stock: boolean
    stock_quantity: number
    produtos_variacoes?: any[]
  }
}

function parseVariacoes(rows: any[] | undefined): VariantsData | null {
  if (!rows || !Array.isArray(rows) || rows.length === 0) return null

  const attrsMap: Record<string, Set<string>> = {}
  const items: VariantItem[] = []

  for (const row of rows) {
    // attributes armazenado no db como Record<string, string> ("Cor": "Azul")
    const combination = row.attributes || {}
    for (const [k, v] of Object.entries(combination)) {
      if (!attrsMap[k]) attrsMap[k] = new Set()
      attrsMap[k].add(String(v))
    }

    items.push({
      id: row.id,
      combination,
      price: row.price,
      compare_at_price: row.compare_at_price,
      sku: row.sku || '',
      stock_quantity: row.stock_quantity,
      manage_stock: row.manage_stock, // Se a variation for criada sem, usamos true for safety aqui? Ou db default resolve.
      image_url: row.image_url,
      is_active: row.is_active,
      weight: row.weight,
      height: row.height,
      width: row.width,
      length: row.length,
    })
  }

  const attributes = Object.entries(attrsMap).map(([name, set]) => ({
    name,
    options: Array.from(set)
  }))

  if (attributes.length === 0) return null

  return { attributes, items }
}

export function VariantSelector({ product }: VariantSelectorProps) {
  const addItem = useCartStore((s) => s.addItem)
  const openMiniCart = useCartStore((s) => s.openMiniCart)
  const settings = useTenantSettings()
  const variantsData = useMemo(() => parseVariacoes(product.produtos_variacoes), [product.produtos_variacoes])

  const [selected, setSelected] = useState<Record<string, string>>({})

  const selectedVariant = useMemo(() => {
    if (!variantsData) return null
    if (Object.keys(selected).length !== variantsData.attributes.length) return null

    return variantsData.items.find(item =>
      item.is_active &&
      variantsData.attributes.every(
        attr => item.combination[attr.name] === selected[attr.name]
      )
    ) || null
  }, [variantsData, selected])

  const allSelected = variantsData
    ? Object.keys(selected).length === variantsData.attributes.length
    : true

  // Para cada atributo, determinar quais opcoes estao disponiveis
  // baseado nas selecoes dos outros atributos
  function getAvailableOptions(attrName: string): Set<string> {
    if (!variantsData) return new Set()
    const available = new Set<string>()

    for (const item of variantsData.items) {
      if (!item.is_active) continue

      // Verificar se este item e compativel com as selecoes atuais (exceto o atributo em questao)
      const compatible = variantsData.attributes.every(attr => {
        if (attr.name === attrName) return true
        if (!selected[attr.name]) return true
        return item.combination[attr.name] === selected[attr.name]
      })

      if (compatible) {
        available.add(item.combination[attrName])
      }
    }

    return available
  }

  function handleSelect(attrName: string, value: string) {
    setSelected(prev => {
      if (prev[attrName] === value) {
        const next = { ...prev }
        delete next[attrName]
        return next
      }
      return { ...prev, [attrName]: value }
    })
  }

  function handleAddToCart() {
    if (!selectedVariant) return

    const variantLabel = Object.entries(selectedVariant.combination)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' / ')

    addItem({
      productId: product.id,
      variacaoId: selectedVariant.id,
      sku: selectedVariant.sku || null,
      name: product.name,
      price: selectedVariant.price,
      image: selectedVariant.image_url || product.image_url,
      variant: variantLabel,
      stock_quantity: selectedVariant.stock_quantity,
      manage_stock: selectedVariant.manage_stock,
      weight: selectedVariant.weight ?? null,
      height: selectedVariant.height ?? null,
      width: selectedVariant.width ?? null,
      length: selectedVariant.length ?? null,
      attributes: selectedVariant.combination,
    })
    toast.success('Adicionado ao carrinho!')
    if (settings.open_cart_on_add) {
      setTimeout(() => openMiniCart(), 300)
    }
  }

  // Produto sem variacoes - nao renderizar nada (usa o AddToCartButton padrao)
  if (!variantsData) return null

  const isOutOfStock = selectedVariant &&
    selectedVariant.manage_stock &&
    selectedVariant.stock_quantity <= 0

  const displayPrice = selectedVariant ? selectedVariant.price : product.price
  const displayComparePrice = selectedVariant
    ? selectedVariant.compare_at_price
    : product.compare_at_price

  return (
    <div className="space-y-4">
      {/* Seletores de atributos */}
      {variantsData.attributes.map((attr) => {
        const availableOptions = getAvailableOptions(attr.name)

        return (
          <div key={attr.name} className="space-y-2">
            <label className="text-sm font-medium">
              {attr.name}
              {selected[attr.name] && (
                <span className="text-muted-foreground ml-1">: {selected[attr.name]}</span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {attr.options.map((option) => {
                const isAvailable = availableOptions.has(option)
                const isSelected = selected[attr.name] === option

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => isAvailable && handleSelect(attr.name, option)}
                    disabled={!isAvailable}
                    className={`
                      px-3 py-1.5 text-sm border rounded-md transition-colors
                      ${isSelected
                        ? 'border-black bg-black text-white'
                        : isAvailable
                          ? 'border-gray-300 hover:border-gray-500 bg-white'
                          : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                      }
                    `}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Preco atualizado */}
      <div className="space-y-1">
        {displayComparePrice && (
          <p className="text-lg text-muted-foreground line-through">
            {formatCurrency(displayComparePrice)}
          </p>
        )}
        <p className="text-3xl font-bold">
          {!allSelected && 'A partir de '}
          {formatCurrency(displayPrice)}
        </p>
      </div>

      {/* Botao de adicionar */}
      {isOutOfStock ? (
        <p className="text-red-500 font-medium">Variacao esgotada</p>
      ) : (
        <Button
          size="lg"
          className="w-full"
          onClick={handleAddToCart}
          disabled={!allSelected || !selectedVariant}
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          {allSelected ? 'Adicionar ao carrinho' : 'Selecione as opcoes'}
        </Button>
      )}

      {/* SKU da variacao */}
      {selectedVariant?.sku && (
        <p className="text-xs text-muted-foreground">SKU: {selectedVariant.sku}</p>
      )}
    </div>
  )
}
