'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Loader2, MapPin, Package, X } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

function formatCep(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function normalizeCep(cep: string) {
  return cep.replace(/\D/g, '').padEnd(8, '0')
}

interface CepRange {
  start: string
  end: string
}

export default function ShippingPage() {
  const [zones, setZones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tenantId, setTenantId] = useState('')
  const supabase = createClient()

  // Zone dialog
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<any>(null)
  const [zoneName, setZoneName] = useState('')
  const [cepRanges, setCepRanges] = useState<CepRange[]>([{ start: '', end: '' }])
  const [savingZone, setSavingZone] = useState(false)

  // Method dialog
  const [methodDialogOpen, setMethodDialogOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<any>(null)
  const [currentZoneId, setCurrentZoneId] = useState('')
  const [savingMethod, setSavingMethod] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    const { data: tenant } = await supabase.from('tenants').select('id').eq('owner_id', session!.user.id).single()
    setTenantId(tenant!.id)

    const { data } = await supabase
      .from('shipping_zones')
      .select('*, shipping_zone_ranges(*), shipping_methods(*)')
      .eq('tenant_id', tenant!.id)
      .order('display_order')

    setZones(data || [])
    setLoading(false)
  }

  // ---- Zone CRUD ----

  function openNewZone() {
    setEditingZone(null)
    setZoneName('')
    setCepRanges([{ start: '', end: '' }])
    setZoneDialogOpen(true)
  }

  function openEditZone(zone: any) {
    setEditingZone(zone)
    setZoneName(zone.name)
    const ranges = (zone.shipping_zone_ranges || []).map((r: any) => ({
      start: formatCep(r.cep_start),
      end: formatCep(r.cep_end),
    }))
    setCepRanges(ranges.length > 0 ? ranges : [{ start: '', end: '' }])
    setZoneDialogOpen(true)
  }

  function addCepRange() {
    setCepRanges([...cepRanges, { start: '', end: '' }])
  }

  function removeCepRange(index: number) {
    if (cepRanges.length <= 1) return
    setCepRanges(cepRanges.filter((_, i) => i !== index))
  }

  function updateCepRange(index: number, field: 'start' | 'end', value: string) {
    const updated = [...cepRanges]
    updated[index] = { ...updated[index], [field]: formatCep(value) }
    setCepRanges(updated)
  }

  async function handleSaveZone(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingZone(true)

    // Validate ranges
    const validRanges = cepRanges.filter(r => r.start.replace(/\D/g, '').length >= 5)
    if (validRanges.length === 0) {
      toast.error('Adicione pelo menos uma faixa de CEP')
      setSavingZone(false)
      return
    }

    for (const r of validRanges) {
      const s = normalizeCep(r.start)
      const e = r.end ? normalizeCep(r.end) : s
      if (e < s) {
        toast.error(`CEP final deve ser maior ou igual ao inicial: ${r.start}`)
        setSavingZone(false)
        return
      }
    }

    const zoneData: any = {
      tenant_id: tenantId,
      name: zoneName,
      price: 0,
      is_active: true,
    }

    let zoneId: string

    if (editingZone?.id) {
      const { error } = await supabase.from('shipping_zones').update(zoneData).eq('id', editingZone.id)
      if (error) { toast.error('Erro ao atualizar zona'); setSavingZone(false); return }
      zoneId = editingZone.id
      // Delete old ranges and reinsert
      await supabase.from('shipping_zone_ranges').delete().eq('zone_id', zoneId)
    } else {
      const { data, error } = await supabase.from('shipping_zones').insert(zoneData).select('id').single()
      if (error || !data) { toast.error('Erro ao criar zona: ' + (error?.message || '')); setSavingZone(false); return }
      zoneId = data.id
    }

    // Insert ranges
    const rangesData = validRanges.map(r => ({
      zone_id: zoneId,
      cep_start: normalizeCep(r.start),
      cep_end: r.end ? normalizeCep(r.end) : normalizeCep(r.start),
    }))
    const { error: rangeError } = await supabase.from('shipping_zone_ranges').insert(rangesData)
    if (rangeError) { toast.error('Erro ao salvar faixas de CEP'); setSavingZone(false); return }

    toast.success(editingZone ? 'Zona atualizada!' : 'Zona criada!')
    setZoneDialogOpen(false)
    setSavingZone(false)
    loadData()
  }

  async function handleDeleteZone(id: string) {
    if (!confirm('Excluir zona de entrega e todas as formas de entrega associadas?')) return
    await supabase.from('shipping_zones').delete().eq('id', id)
    toast.success('Zona excluida!')
    loadData()
  }

  // ---- Method CRUD ----

  function openNewMethod(zoneId: string) {
    setEditingMethod(null)
    setCurrentZoneId(zoneId)
    setMethodDialogOpen(true)
  }

  function openEditMethod(method: any) {
    setEditingMethod(method)
    setCurrentZoneId(method.zone_id)
    setMethodDialogOpen(true)
  }

  async function handleSaveMethod(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingMethod(true)
    const formData = new FormData(e.currentTarget)

    const methodData: any = {
      zone_id: currentZoneId,
      name: formData.get('method_name') as string,
      price: parseFloat(formData.get('method_price') as string),
      free_shipping_threshold: formData.get('method_free_threshold') ? parseFloat(formData.get('method_free_threshold') as string) : null,
      delivery_time_min: formData.get('method_time_min') ? parseInt(formData.get('method_time_min') as string) : null,
      delivery_time_max: formData.get('method_time_max') ? parseInt(formData.get('method_time_max') as string) : null,
      is_active: true,
      display_order: formData.get('method_order') ? parseInt(formData.get('method_order') as string) : 0,
    }

    if (editingMethod) {
      const { error } = await supabase.from('shipping_methods').update(methodData).eq('id', editingMethod.id)
      if (error) { toast.error('Erro ao atualizar'); setSavingMethod(false); return }
      toast.success('Forma de entrega atualizada!')
    } else {
      const { error } = await supabase.from('shipping_methods').insert(methodData)
      if (error) { toast.error('Erro: ' + error.message); setSavingMethod(false); return }
      toast.success('Forma de entrega criada!')
    }
    setMethodDialogOpen(false)
    setSavingMethod(false)
    loadData()
  }

  async function handleDeleteMethod(id: string) {
    if (!confirm('Excluir forma de entrega?')) return
    await supabase.from('shipping_methods').delete().eq('id', id)
    toast.success('Excluida!')
    loadData()
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Zonas de Entrega</h1>
        <Button onClick={openNewZone}>
          <Plus className="mr-2 h-4 w-4" /> Nova Zona
        </Button>
      </div>

      {zones.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <MapPin className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p>Nenhuma zona cadastrada</p>
            <p className="text-xs mt-1">Crie zonas com faixas de CEP e formas de entrega</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {zones.map((zone) => {
            const ranges = zone.shipping_zone_ranges || []
            const methods = (zone.shipping_methods || []).sort((a: any, b: any) => a.display_order - b.display_order)

            return (
              <Card key={zone.id}>
                <CardContent className="p-4 space-y-3">
                  {/* Zone header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{zone.name}</h3>
                      {ranges.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {ranges.map((r: any, i: number) => (
                            <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {formatCep(r.cep_start)}
                              {r.cep_end !== r.cep_start && ` a ${formatCep(r.cep_end)}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditZone(zone)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteZone(zone.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Methods list */}
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" />
                        Formas de Entrega
                      </p>
                      <Button variant="outline" size="sm" onClick={() => openNewMethod(zone.id)}>
                        <Plus className="mr-1 h-3 w-3" /> Adicionar
                      </Button>
                    </div>

                    {methods.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">Nenhuma forma de entrega cadastrada nesta zona</p>
                    ) : (
                      <div className="space-y-1.5">
                        {methods.map((m: any) => (
                          <div key={m.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <span className="font-medium text-sm">{m.name}</span>
                              <span className="text-sm text-muted-foreground ml-3">
                                {formatCurrency(m.price)}
                              </span>
                              {m.delivery_time_min != null && m.delivery_time_max != null && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({m.delivery_time_min}-{m.delivery_time_max} dias)
                                </span>
                              )}
                              {m.free_shipping_threshold && (
                                <span className="text-xs text-green-600 ml-2">
                                  Gratis acima de {formatCurrency(m.free_shipping_threshold)}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditMethod(m)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteMethod(m.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Zone Dialog */}
      <Dialog open={zoneDialogOpen} onOpenChange={setZoneDialogOpen}>
        <DialogContent onClose={() => setZoneDialogOpen(false)} className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingZone ? 'Editar' : 'Nova'} Zona de Entrega</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveZone} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="zone-name">Nome da zona *</Label>
              <Input
                id="zone-name"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                required
                placeholder="Ex: Sao Paulo Capital, Grande SP"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Faixas de CEP *</Label>
                <a
                  href="https://buscacepinter.correios.com.br/app/faixa_cep_uf_localidade/index.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  Não sabe as faixas? Consultar Correios
                </a>
              </div>
              <div className="space-y-2">
                {cepRanges.map((range, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={range.start}
                      onChange={(e) => updateCepRange(idx, 'start', e.target.value)}
                      placeholder="01000-000"
                      maxLength={9}
                      className="flex-1"
                      required
                    />
                    <span className="text-sm text-muted-foreground">ate</span>
                    <Input
                      value={range.end}
                      onChange={(e) => updateCepRange(idx, 'end', e.target.value)}
                      placeholder="09999-999"
                      maxLength={9}
                      className="flex-1"
                    />
                    {cepRanges.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => removeCepRange(idx)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addCepRange} className="mt-1">
                <Plus className="mr-1 h-3 w-3" /> Adicionar faixa
              </Button>
              <p className="text-xs text-muted-foreground">
                Deixe o CEP final vazio para faixa de CEP unico
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setZoneDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={savingZone}>
                {savingZone && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Zona
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Method Dialog */}
      <Dialog open={methodDialogOpen} onOpenChange={setMethodDialogOpen}>
        <DialogContent onClose={() => setMethodDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingMethod ? 'Editar' : 'Nova'} Forma de Entrega</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveMethod} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="method-name">Nome *</Label>
              <Input id="method-name" name="method_name" required defaultValue={editingMethod?.name} placeholder="Ex: Sedex, PAC, Motoboy" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="method-price">Preco do frete (R$) *</Label>
                <Input id="method-price" name="method_price" type="number" step="0.01" min="0" required defaultValue={editingMethod?.price} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="method-free">Frete gratis acima de (R$)</Label>
                <Input id="method-free" name="method_free_threshold" type="number" step="0.01" min="0" defaultValue={editingMethod?.free_shipping_threshold} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="method-min">Prazo min (dias)</Label>
                <Input id="method-min" name="method_time_min" type="number" min="0" defaultValue={editingMethod?.delivery_time_min} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="method-max">Prazo max (dias)</Label>
                <Input id="method-max" name="method_time_max" type="number" min="0" defaultValue={editingMethod?.delivery_time_max} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="method-order">Ordem de exibição</Label>
              <Input id="method-order" name="method_order" type="number" defaultValue={editingMethod?.display_order || 0} />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setMethodDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={savingMethod}>
                {savingMethod && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
