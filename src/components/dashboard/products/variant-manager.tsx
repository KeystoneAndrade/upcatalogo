'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Plus,
  X,
  RefreshCw,
  Trash2,
  Copy,
  Pencil,
  Package,
  DollarSign,
  Archive,
  Eye,
  EyeOff,
  GripVertical,
  Settings2,
  ImageIcon,
} from 'lucide-react'
import { ImageUpload } from './image-upload'

export interface VariantAttribute {
  name: string
  options: string[]
}

export interface VariantItem {
  id: string
  combination: Record<string, string>
  price: number
  compare_at_price: number | null
  sku: string
  stock_quantity: number
  manage_stock: boolean
  image_url: string | null
  is_active: boolean
  weight: number | null
  height: number | null
  width: number | null
  length: number | null
}

export interface VariantsData {
  attributes: VariantAttribute[]
  items: VariantItem[]
}

interface VariantManagerProps {
  value: VariantsData
  onChange: (data: VariantsData) => void
  basePrice: number
  manageStockGlobal: boolean
  onManageStockChange: (v: boolean) => void
  tenantId: string
  productId: string
}

function generateId() {
  return crypto.randomUUID()
}

function cartesianProduct(attributes: VariantAttribute[]): Record<string, string>[] {
  if (attributes.length === 0) return []
  const filtered = attributes.filter(a => a.name && a.options.length > 0)
  if (filtered.length === 0) return []

  return filtered.reduce<Record<string, string>[]>(
    (acc, attr) => {
      if (acc.length === 0) {
        return attr.options.map(opt => ({ [attr.name]: opt }))
      }
      const result: Record<string, string>[] = []
      for (const existing of acc) {
        for (const opt of attr.options) {
          result.push({ ...existing, [attr.name]: opt })
        }
      }
      return result
    },
    []
  )
}

function combinationKey(combination: Record<string, string>): string {
  return Object.entries(combination)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join('|')
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
}

// ====== Sub-component: Variant Edit Dialog ======

interface VariantEditDialogProps {
  item: VariantItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (item: VariantItem) => void
  manageStock: boolean
  tenantId: string
  productId: string
}

function VariantEditDialog({ item, open, onOpenChange, onSave, manageStock, tenantId, productId }: VariantEditDialogProps) {
  const [editItem, setEditItem] = useState<VariantItem | null>(null)

  // Sync when opening
  const currentId = item?.id
  useState(() => {
    if (item) setEditItem({ ...item })
  })

  // Keep editItem in sync with item changes
  if (item && editItem?.id !== item.id) {
    setEditItem({ ...item })
  }

  if (!editItem) return null

  const label = Object.entries(editItem.combination)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' / ')

  function handleSave() {
    if (editItem) {
      onSave(editItem)
      onOpenChange(false)
    }
  }

  function updateField(field: keyof VariantItem, value: any) {
    setEditItem(prev => prev ? { ...prev, [field]: value } : prev)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Editar variacao
          </DialogTitle>
          <DialogDescription>{label}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Ativo */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Visibilidade</p>
              <p className="text-xs text-muted-foreground">
                {editItem.is_active ? 'Visivel na loja' : 'Oculto da loja'}
              </p>
            </div>
            <Switch
              checked={editItem.is_active}
              onCheckedChange={(v) => updateField('is_active', v)}
            />
          </div>

          <hr />

          {/* Preco */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="h-4 w-4 text-green-600" />
              Precificacao
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Preco (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editItem.price}
                  onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Preco &quot;De&quot; (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editItem.compare_at_price ?? ''}
                  onChange={(e) => updateField('compare_at_price', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Opcional"
                />
              </div>
            </div>
          </div>

          <hr />

          {/* Inventario */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Archive className="h-4 w-4 text-blue-600" />
              Inventario
            </div>
            <div className="space-y-1">
              <Label className="text-xs">SKU</Label>
              <Input
                value={editItem.sku}
                onChange={(e) => updateField('sku', e.target.value)}
                placeholder="Codigo do produto"
              />
            </div>
            {manageStock && (
              <div className="space-y-1">
                <Label className="text-xs">Quantidade em estoque</Label>
                <Input
                  type="number"
                  min="0"
                  value={editItem.stock_quantity}
                  onChange={(e) => updateField('stock_quantity', parseInt(e.target.value) || 0)}
                />
              </div>
            )}
          </div>

          <hr />

          {/* Envio */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4 text-orange-600" />
              Envio
            </div>
            <p className="text-xs text-muted-foreground -mt-1">
              Deixe em branco para usar as dimensoes padrao da loja
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={editItem.weight ?? ''}
                  onChange={(e) => updateField('weight', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0.300"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Altura (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={editItem.height ?? ''}
                  onChange={(e) => updateField('height', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="11"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Largura (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={editItem.width ?? ''}
                  onChange={(e) => updateField('width', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="11"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Comprimento (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={editItem.length ?? ''}
                  onChange={(e) => updateField('length', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="11"
                />
              </div>
            </div>
          </div>

          {/* Imagem */}
          <hr />
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ImageIcon className="h-4 w-4 text-purple-600" />
              Imagem
            </div>
            <ImageUpload
              value={editItem.image_url}
              onChange={(url) => updateField('image_url', url)}
              tenantId={tenantId}
              productId={productId}
              size="md"
              aspectRatio={1}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            Salvar alteracoes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ====== Sub-component: Bulk Edit Dialog ======

interface BulkEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemCount: number
  onApply: (changes: Partial<VariantItem>) => void
  manageStock: boolean
}

function BulkEditDialog({ open, onOpenChange, itemCount, onApply, manageStock }: BulkEditDialogProps) {
  const [price, setPrice] = useState('')
  const [compareAtPrice, setCompareAtPrice] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [width, setWidth] = useState('')
  const [length, setLength] = useState('')
  const [stockQty, setStockQty] = useState('')

  function handleApply() {
    const changes: Partial<VariantItem> = {}

    if (price) changes.price = parseFloat(price)
    if (compareAtPrice) changes.compare_at_price = parseFloat(compareAtPrice)
    if (weight) changes.weight = parseFloat(weight)
    if (height) changes.height = parseFloat(height)
    if (width) changes.width = parseFloat(width)
    if (length) changes.length = parseFloat(length)
    if (stockQty) changes.stock_quantity = parseInt(stockQty)

    if (Object.keys(changes).length === 0) return

    onApply(changes)
    onOpenChange(false)
    // Reset
    setPrice('')
    setCompareAtPrice('')
    setWeight('')
    setHeight('')
    setWidth('')
    setLength('')
    setStockQty('')
  }

  const hasChanges = !!(price || compareAtPrice || weight || height || width || length || stockQty)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Edicao em massa
          </DialogTitle>
          <DialogDescription>
            Aplicar valores para todas as {itemCount} variacoes. Preencha apenas os campos que deseja alterar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Preco */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="h-4 w-4 text-green-600" />
              Precificacao
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Preco (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: 49.90"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Preco &quot;De&quot; (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>
          </div>

          {/* Estoque */}
          {manageStock && (
            <>
              <hr />
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Archive className="h-4 w-4 text-blue-600" />
                  Estoque
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Quantidade em estoque</Label>
                  <Input
                    type="number"
                    min="0"
                    value={stockQty}
                    onChange={(e) => setStockQty(e.target.value)}
                    placeholder="Ex: 100"
                  />
                </div>
              </div>
            </>
          )}

          {/* Envio */}
          <hr />
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4 text-orange-600" />
              Envio
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.300"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Altura (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="11"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Largura (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="11"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Comprimento (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="11"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleApply} disabled={!hasChanges}>
            Aplicar a todas
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ====== Main Component ======

export function VariantManager({ value, onChange, basePrice, manageStockGlobal, onManageStockChange, tenantId, productId }: VariantManagerProps) {
  const [newOptionInputs, setNewOptionInputs] = useState<Record<number, string>>({})
  const [editingItem, setEditingItem] = useState<VariantItem | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)

  // Stats
  const stats = useMemo(() => {
    const active = value.items.filter(i => i.is_active)
    const inactive = value.items.filter(i => !i.is_active)
    const totalStock = manageStockGlobal
      ? value.items.reduce((sum, i) => sum + (i.is_active ? i.stock_quantity : 0), 0)
      : null
    const priceRange = active.length > 0
      ? {
        min: Math.min(...active.map(i => i.price)),
        max: Math.max(...active.map(i => i.price)),
      }
      : null

    return { active: active.length, inactive: inactive.length, totalStock, priceRange }
  }, [value.items, manageStockGlobal])

  function addAttribute() {
    onChange({
      ...value,
      attributes: [...value.attributes, { name: '', options: [] }],
    })
  }

  function removeAttribute(index: number) {
    const newAttrs = value.attributes.filter((_, i) => i !== index)
    onChange({ ...value, attributes: newAttrs, items: [] })
  }

  function updateAttributeName(index: number, name: string) {
    const newAttrs = [...value.attributes]
    newAttrs[index] = { ...newAttrs[index], name }
    onChange({ ...value, attributes: newAttrs })
  }

  function addOption(attrIndex: number) {
    const input = (newOptionInputs[attrIndex] || '').trim()
    if (!input) return

    const attr = value.attributes[attrIndex]
    const newOptions = input
      .split(/[,;]/)
      .map(opt => opt.trim())
      .filter(opt => opt && !attr.options.includes(opt))

    if (newOptions.length === 0) return

    const newAttrs = [...value.attributes]
    newAttrs[attrIndex] = { ...attr, options: [...attr.options, ...newOptions] }
    onChange({ ...value, attributes: newAttrs })
    setNewOptionInputs({ ...newOptionInputs, [attrIndex]: '' })
  }

  function removeOption(attrIndex: number, optIndex: number) {
    const newAttrs = [...value.attributes]
    newAttrs[attrIndex] = {
      ...newAttrs[attrIndex],
      options: newAttrs[attrIndex].options.filter((_, i) => i !== optIndex),
    }
    onChange({ ...value, attributes: newAttrs, items: [] })
  }

  function generateVariants() {
    const combinations = cartesianProduct(value.attributes)
    const existingMap = new Map(
      value.items.map(item => [combinationKey(item.combination), item])
    )

    const newItems: VariantItem[] = combinations.map(combo => {
      const key = combinationKey(combo)
      const existing = existingMap.get(key)
      if (existing) return { ...existing, manage_stock: manageStockGlobal }

      return {
        id: generateId(),
        combination: combo,
        price: basePrice,
        compare_at_price: null,
        sku: '',
        stock_quantity: 0,
        manage_stock: manageStockGlobal,
        image_url: null,
        is_active: true,
        weight: null,
        height: null,
        width: null,
        length: null,
      }
    })

    onChange({ ...value, items: newItems })
  }

  function removeVariantItem(itemId: string) {
    onChange({ ...value, items: value.items.filter(item => item.id !== itemId) })
  }

  function handleSaveVariant(updated: VariantItem) {
    const newItems = value.items.map(item =>
      item.id === updated.id ? updated : item
    )
    onChange({ ...value, items: newItems })
  }

  function handleBulkApply(changes: Partial<VariantItem>) {
    const newItems = value.items.map(item => ({ ...item, ...changes }))
    onChange({ ...value, items: newItems })
  }

  function handleManageStockToggle(checked: boolean) {
    onManageStockChange(checked)
    const newItems = value.items.map(item => ({ ...item, manage_stock: checked }))
    onChange({ ...value, items: newItems })
  }

  function openEditDialog(item: VariantItem) {
    setEditingItem(item)
    setEditDialogOpen(true)
  }

  const canGenerate = value.attributes.some(a => a.name && a.options.length > 0)

  return (
    <div className="space-y-5">
      {/* Atributos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Atributos</Label>
          <Button type="button" variant="outline" size="sm" onClick={addAttribute}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar atributo
          </Button>
        </div>

        {value.attributes.map((attr, attrIndex) => (
          <Card key={attrIndex}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Nome do atributo (ex: Cor, Tamanho)"
                  value={attr.name}
                  onChange={(e) => updateAttributeName(attrIndex, e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttribute(attrIndex)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {attr.options.map((opt, optIndex) => (
                  <span
                    key={optIndex}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-sm font-medium"
                  >
                    {opt}
                    <button
                      type="button"
                      onClick={() => removeOption(attrIndex, optIndex)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar opcoes (separe por virgula: Azul, Vermelho, Preto)"
                  value={newOptionInputs[attrIndex] || ''}
                  onChange={(e) =>
                    setNewOptionInputs({ ...newOptionInputs, [attrIndex]: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addOption(attrIndex)
                    }
                  }}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => addOption(attrIndex)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gerar Variacoes */}
      {canGenerate && (
        <Button type="button" variant="outline" onClick={generateVariants}>
          <RefreshCw className="h-4 w-4 mr-1" />
          {value.items.length > 0 ? 'Regenerar variacoes' : 'Gerar variacoes'}
        </Button>
      )}

      {/* Variacoes geradas */}
      {value.items.length > 0 && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg border">
            <Badge variant="secondary" className="gap-1">
              {stats.active} {stats.active === 1 ? 'ativa' : 'ativas'}
            </Badge>
            {stats.inactive > 0 && (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <EyeOff className="h-3 w-3" />
                {stats.inactive} {stats.inactive === 1 ? 'oculta' : 'ocultas'}
              </Badge>
            )}
            {stats.priceRange && (
              <Badge variant="outline" className="gap-1">
                <DollarSign className="h-3 w-3" />
                {stats.priceRange.min === stats.priceRange.max
                  ? formatPrice(stats.priceRange.min)
                  : `${formatPrice(stats.priceRange.min)} - ${formatPrice(stats.priceRange.max)}`
                }
              </Badge>
            )}
            {stats.totalStock !== null && (
              <Badge variant="outline" className="gap-1">
                <Archive className="h-3 w-3" />
                {stats.totalStock} em estoque
              </Badge>
            )}
          </div>

          {/* Toolbar: stock toggle + bulk edit */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Switch
                checked={manageStockGlobal}
                onCheckedChange={handleManageStockToggle}
              />
              <div>
                <p className="text-sm font-medium leading-none">Gerenciar estoque</p>
                <p className="text-xs text-muted-foreground mt-0.5">Controlar quantidade por variacao</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBulkDialogOpen(true)}
            >
              <Settings2 className="h-4 w-4 mr-1" />
              Edicao em massa
            </Button>
          </div>

          {/* Header da lista */}
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">
              Variacoes ({value.items.length})
            </Label>
          </div>

          {/* Variant Cards */}
          <div className="grid gap-2">
            {value.items.map((item) => {
              const label = Object.values(item.combination).join(' / ')
              const hasDimensions = item.weight || item.height || item.width || item.length

              return (
                <div
                  key={item.id}
                  className={`
                    group relative flex items-center gap-3 p-3 rounded-lg border
                    transition-all duration-150 hover:shadow-sm hover:border-gray-300
                    ${!item.is_active ? 'opacity-50 bg-gray-50' : 'bg-white'}
                  `}
                >
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={label}
                        className="h-12 w-12 object-cover rounded-md border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                            ; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-md border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                        <Package className="h-5 w-5 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{label}</p>
                      {!item.is_active && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          <EyeOff className="h-2.5 w-2.5 mr-0.5" />
                          Oculta
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-sm font-semibold text-green-700">
                        {formatPrice(item.price)}
                      </span>
                      {item.compare_at_price && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(item.compare_at_price)}
                        </span>
                      )}
                      {item.sku && (
                        <span className="text-xs text-muted-foreground">
                          SKU: {item.sku}
                        </span>
                      )}
                      {manageStockGlobal && (
                        <span className={`text-xs ${item.stock_quantity <= 0 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                          {item.stock_quantity <= 0 ? 'Sem estoque' : `${item.stock_quantity} un.`}
                        </span>
                      )}
                      {hasDimensions && (
                        <span className="text-[10px] text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded hidden sm:inline">
                          <Package className="h-2.5 w-2.5 inline mr-0.5" />
                          {[
                            item.weight ? `${item.weight}kg` : null,
                            (item.height || item.width || item.length)
                              ? [item.height, item.width, item.length].filter(Boolean).join('x') + 'cm'
                              : null,
                          ].filter(Boolean).join(' ')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(item)}
                      className="h-8 w-8 p-0 opacity-70 group-hover:opacity-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariantItem(item.id)}
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-600 opacity-70 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <VariantEditDialog
        item={editingItem}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveVariant}
        manageStock={manageStockGlobal}
        tenantId={tenantId}
        productId={productId}
      />

      <BulkEditDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        itemCount={value.items.length}
        onApply={handleBulkApply}
        manageStock={manageStockGlobal}
      />
    </div>
  )
}
