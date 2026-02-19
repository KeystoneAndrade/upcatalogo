'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, X, RefreshCw, Trash2, Package } from 'lucide-react'

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

export function VariantManager({ value, onChange, basePrice }: VariantManagerProps) {
  const [newOptionInputs, setNewOptionInputs] = useState<Record<number, string>>({})

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

    // Permitir múltiplas opções separadas por vírgula ou ponto-e-vírgula
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
      if (existing) return existing

      return {
        id: generateId(),
        combination: combo,
        price: basePrice,
        compare_at_price: null,
        sku: '',
        stock_quantity: 0,
        manage_stock: false,
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
  }

  function applyPriceToAll() {
    const newItems = value.items.map(item => ({ ...item, price: basePrice }))
    onChange({ ...value, items: newItems })
  }

  const canGenerate = value.attributes.some(a => a.name && a.options.length > 0)

  return (
    <div className="space-y-4">
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
                  placeholder="Adicionar opcoes (separe por vírgula: Azul, Vermelho, Preto)"
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
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={generateVariants}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Gerar variacoes
          </Button>
          {value.items.length > 0 && (
            <Button type="button" variant="outline" onClick={applyPriceToAll}>
              Aplicar preco base a todas
            </Button>
          )}
        </div>
      )}

      {/* Tabela de Variacoes */}
      {value.items.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base font-semibold">
            Variacoes ({value.items.length})
          </Label>
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">Variacao</th>
                  <th className="text-left p-3 font-medium">Preco (R$)</th>
                  <th className="text-left p-3 font-medium">SKU</th>
                  <th className="text-left p-3 font-medium">Estoque</th>
                  <th className="text-left p-3 font-medium" title="Peso (kg)">Peso</th>
                  <th className="text-left p-3 font-medium" title="Altura (cm)">Alt.</th>
                  <th className="text-left p-3 font-medium" title="Largura (cm)">Larg.</th>
                  <th className="text-left p-3 font-medium" title="Comprimento (cm)">Comp.</th>
                  <th className="text-center p-3 font-medium">Ativo</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {value.items.map((item) => {
                  const label = Object.values(item.combination).join(' / ')
                  return (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="p-3 font-medium whitespace-nowrap">{label}</td>
                      <td className="p-3">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.price}
                          onChange={(e) =>
                            updateVariantItem(item.id, 'price', parseFloat(e.target.value) || 0)
                          }
                          className="w-24"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          value={item.sku}
                          onChange={(e) => updateVariantItem(item.id, 'sku', e.target.value)}
                          className="w-28"
                          placeholder="SKU"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min="0"
                          value={item.stock_quantity}
                          onChange={(e) =>
                            updateVariantItem(item.id, 'stock_quantity', parseInt(e.target.value) || 0)
                          }
                          className="w-20"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          value={item.weight ?? ''}
                          onChange={(e) =>
                            updateVariantItem(item.id, 'weight', e.target.value ? parseFloat(e.target.value) : null)
                          }
                          className="w-20"
                          placeholder="kg"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={item.height ?? ''}
                          onChange={(e) =>
                            updateVariantItem(item.id, 'height', e.target.value ? parseFloat(e.target.value) : null)
                          }
                          className="w-16"
                          placeholder="cm"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={item.width ?? ''}
                          onChange={(e) =>
                            updateVariantItem(item.id, 'width', e.target.value ? parseFloat(e.target.value) : null)
                          }
                          className="w-16"
                          placeholder="cm"
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={item.length ?? ''}
                          onChange={(e) =>
                            updateVariantItem(item.id, 'length', e.target.value ? parseFloat(e.target.value) : null)
                          }
                          className="w-16"
                          placeholder="cm"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={item.is_active}
                          onChange={(e) => updateVariantItem(item.id, 'is_active', e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => removeVariantItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
