'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, X, RefreshCw, Trash2, ChevronDown, ChevronRight, Copy } from 'lucide-react'

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

export function VariantManager({ value, onChange, basePrice, manageStockGlobal, onManageStockChange }: VariantManagerProps) {
  const [newOptionInputs, setNewOptionInputs] = useState<Record<number, string>>({})
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Bulk edit state
  const [bulkPrice, setBulkPrice] = useState('')
  const [bulkWeight, setBulkWeight] = useState('')
  const [bulkHeight, setBulkHeight] = useState('')
  const [bulkWidth, setBulkWidth] = useState('')
  const [bulkLength, setBulkLength] = useState('')

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

  function updateVariantItem(itemId: string, field: keyof VariantItem, fieldValue: any) {
    const newItems = value.items.map(item =>
      item.id === itemId ? { ...item, [field]: fieldValue } : item
    )
    onChange({ ...value, items: newItems })
  }

  function removeVariantItem(itemId: string) {
    onChange({ ...value, items: value.items.filter(item => item.id !== itemId) })
    setExpandedItems(prev => {
      const next = new Set(prev)
      next.delete(itemId)
      return next
    })
  }

  function toggleExpanded(itemId: string) {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  // Bulk actions
  function applyBulkPrice() {
    const p = parseFloat(bulkPrice)
    if (isNaN(p) || p < 0) return
    const newItems = value.items.map(item => ({ ...item, price: p }))
    onChange({ ...value, items: newItems })
    setBulkPrice('')
  }

  function applyBulkDimensions() {
    const w = bulkWeight ? parseFloat(bulkWeight) : undefined
    const h = bulkHeight ? parseFloat(bulkHeight) : undefined
    const wi = bulkWidth ? parseFloat(bulkWidth) : undefined
    const l = bulkLength ? parseFloat(bulkLength) : undefined

    if (w === undefined && h === undefined && wi === undefined && l === undefined) return

    const newItems = value.items.map(item => ({
      ...item,
      ...(w !== undefined && !isNaN(w) ? { weight: w } : {}),
      ...(h !== undefined && !isNaN(h) ? { height: h } : {}),
      ...(wi !== undefined && !isNaN(wi) ? { width: wi } : {}),
      ...(l !== undefined && !isNaN(l) ? { length: l } : {}),
    }))
    onChange({ ...value, items: newItems })
    setBulkWeight('')
    setBulkHeight('')
    setBulkWidth('')
    setBulkLength('')
  }

  function handleManageStockToggle(checked: boolean) {
    onManageStockChange(checked)
    // Update all existing variants
    const newItems = value.items.map(item => ({ ...item, manage_stock: checked }))
    onChange({ ...value, items: newItems })
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
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-sm"
                  >
                    {opt}
                    <button
                      type="button"
                      onClick={() => removeOption(attrIndex, optIndex)}
                      className="text-gray-400 hover:text-red-500"
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
          {/* Gerenciar estoque toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            <div>
              <p className="text-sm font-medium">Gerenciar estoque por variacao</p>
              <p className="text-xs text-muted-foreground">Controlar a quantidade disponivel de cada variacao</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={manageStockGlobal}
              onClick={() => handleManageStockToggle(!manageStockGlobal)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${manageStockGlobal ? 'bg-black' : 'bg-gray-200'}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${manageStockGlobal ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Edicao em massa */}
          <div className="border rounded-lg p-4 bg-blue-50/50 space-y-3">
            <div className="flex items-center gap-2">
              <Copy className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-800">Edicao em massa</p>
            </div>

            {/* Preco em massa */}
            <div className="flex items-end gap-2">
              <div className="space-y-1 flex-1">
                <Label className="text-xs">Preco (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  placeholder="Ex: 49.90"
                  className="bg-white"
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={applyBulkPrice} disabled={!bulkPrice} className="whitespace-nowrap">
                Aplicar preco
              </Button>
            </div>

            {/* Dimensoes em massa */}
            <div className="space-y-1">
              <Label className="text-xs">Dimensoes (preencha os campos desejados)</Label>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <span className="text-[10px] text-muted-foreground">Peso (kg)</span>
                  <Input type="number" step="0.001" min="0" value={bulkWeight} onChange={(e) => setBulkWeight(e.target.value)} placeholder="kg" className="bg-white" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-muted-foreground">Altura (cm)</span>
                  <Input type="number" step="0.1" min="0" value={bulkHeight} onChange={(e) => setBulkHeight(e.target.value)} placeholder="cm" className="bg-white" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-muted-foreground">Largura (cm)</span>
                  <Input type="number" step="0.1" min="0" value={bulkWidth} onChange={(e) => setBulkWidth(e.target.value)} placeholder="cm" className="bg-white" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] text-muted-foreground">Comp. (cm)</span>
                  <Input type="number" step="0.1" min="0" value={bulkLength} onChange={(e) => setBulkLength(e.target.value)} placeholder="cm" className="bg-white" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyBulkDimensions}
                  disabled={!bulkWeight && !bulkHeight && !bulkWidth && !bulkLength}
                  className="whitespace-nowrap"
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de variacoes */}
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">
              Variacoes ({value.items.length})
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (expandedItems.size === value.items.length) {
                  setExpandedItems(new Set())
                } else {
                  setExpandedItems(new Set(value.items.map(i => i.id)))
                }
              }}
              className="text-xs"
            >
              {expandedItems.size === value.items.length ? 'Recolher todas' : 'Expandir todas'}
            </Button>
          </div>

          <div className="space-y-1">
            {value.items.map((item) => {
              const label = Object.values(item.combination).join(' / ')
              const isExpanded = expandedItems.has(item.id)
              const hasDimensions = item.weight || item.height || item.width || item.length
              const dimSummary = hasDimensions
                ? [
                    item.weight ? `${item.weight}kg` : null,
                    item.height ? `${item.height}×` : null,
                    item.width ? `${item.width}×` : null,
                    item.length ? `${item.length}cm` : null,
                  ].filter(Boolean).join('')
                : null

              return (
                <div key={item.id} className={`border rounded-lg ${!item.is_active ? 'opacity-50' : ''}`}>
                  {/* Linha principal */}
                  <div className="flex items-center gap-2 p-3">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(item.id)}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                      {isExpanded
                        ? <ChevronDown className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />
                      }
                    </button>

                    <span className="font-medium text-sm min-w-[100px]">{label}</span>

                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">R$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.price}
                          onChange={(e) => updateVariantItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          className="w-24 h-8 text-sm"
                        />
                      </div>

                      <Input
                        value={item.sku}
                        onChange={(e) => updateVariantItem(item.id, 'sku', e.target.value)}
                        className="w-28 h-8 text-sm"
                        placeholder="SKU"
                      />

                      {manageStockGlobal && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Estq.</span>
                          <Input
                            type="number"
                            min="0"
                            value={item.stock_quantity}
                            onChange={(e) => updateVariantItem(item.id, 'stock_quantity', parseInt(e.target.value) || 0)}
                            className="w-16 h-8 text-sm"
                          />
                        </div>
                      )}

                      {dimSummary && (
                        <span className="text-[10px] text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded hidden sm:inline">
                          {dimSummary}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer" title={item.is_active ? 'Ativo' : 'Inativo'}>
                        <input
                          type="checkbox"
                          checked={item.is_active}
                          onChange={(e) => updateVariantItem(item.id, 'is_active', e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <span className="hidden sm:inline">Ativo</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeVariantItem(item.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Detalhes expandidos */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0 border-t mx-3 mt-0 space-y-3">
                      <div className="grid grid-cols-4 gap-3 pt-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Peso (kg)</Label>
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            value={item.weight ?? ''}
                            onChange={(e) => updateVariantItem(item.id, 'weight', e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder="Padrao"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Altura (cm)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={item.height ?? ''}
                            onChange={(e) => updateVariantItem(item.id, 'height', e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder="Padrao"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Largura (cm)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={item.width ?? ''}
                            onChange={(e) => updateVariantItem(item.id, 'width', e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder="Padrao"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Comprimento (cm)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={item.length ?? ''}
                            onChange={(e) => updateVariantItem(item.id, 'length', e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder="Padrao"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Deixe em branco para usar as dimensoes padrao da loja (configuradas em Integracoes)
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
