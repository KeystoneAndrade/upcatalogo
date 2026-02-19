'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select } from '@/components/ui/select'
import { Plus, Pencil, Trash2, Loader2, MapPin, Package, X, Truck, Info } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

const MANUAL_METHODS = [
  'Motoboy',
  'Transportadora',
  'Retirada no local',
  'Entrega propria',
  'Frete fixo',
]

const INTEGRATION_METHODS = [
  { value: '__melhor_envio__', label: 'Melhor Envio (calculo automatico)', integration: 'melhor_envio' },
]

// Todos para lookup
const ALL_PREDEFINED = [...MANUAL_METHODS]

function isIntegrationMethod(name: string) {
  return INTEGRATION_METHODS.some(m => m.value === name) || isMeServiceMethod(name)
}

function isMeServiceMethod(name: string) {
  return name.startsWith('__me_service_')
}

function parseMeServiceId(name: string): number | null {
  const match = name.match(/^__me_service_(\d+)__$/)
  return match ? parseInt(match[1]) : null
}

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
  const [selectedMethodName, setSelectedMethodName] = useState('')
  const [customMethodName, setCustomMethodName] = useState('')

  // ME services state
  const [meServices, setMeServices] = useState<any[]>([])
  const [loadingMeServices, setLoadingMeServices] = useState(false)
  const [selectedMeServiceIds, setSelectedMeServiceIds] = useState<number[]>([])
  const [meServiceNames, setMeServiceNames] = useState<Record<number, string>>({})

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

    // Load ME service names from existing methods for display
    const serviceNames: Record<number, string> = {}
      ; (data || []).forEach((zone: any) => {
        ; (zone.shipping_methods || []).forEach((m: any) => {
          if (isMeServiceMethod(m.name)) {
            // name is stored as __me_service_<id>__, but we also store display name
            // We'll have a mapping loaded from ME API or fallback
          }
        })
      })

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
    setSelectedMethodName('')
    setCustomMethodName('')
    setMeServices([])
    setSelectedMeServiceIds([])
    setMethodDialogOpen(true)
  }

  function openEditMethod(method: any) {
    setEditingMethod(method)
    setCurrentZoneId(method.zone_id)
    const matchedIntegration = INTEGRATION_METHODS.find(m => m.value === method.name)
    if (matchedIntegration || isMeServiceMethod(method.name)) {
      setSelectedMethodName('__melhor_envio__')
      setCustomMethodName('')
      // Pre-select this service
      const serviceId = parseMeServiceId(method.name)
      if (serviceId !== null) {
        setSelectedMeServiceIds([serviceId])
      }
    } else if (MANUAL_METHODS.includes(method.name)) {
      setSelectedMethodName(method.name)
      setCustomMethodName('')
    } else {
      setSelectedMethodName('__custom__')
      setCustomMethodName(method.name)
    }
    setMethodDialogOpen(true)
  }

  function getMethodNameForSave(): string {
    if (selectedMethodName === '__custom__') return customMethodName
    return selectedMethodName
  }

  const isSelectedIntegration = isIntegrationMethod(selectedMethodName)

  async function fetchMeServicesForDialog() {
    setLoadingMeServices(true)
    try {
      const res = await fetch('/api/melhor-envio/services')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao buscar servicos')
      }
      const data = await res.json()
      setMeServices(data)

      // Pre-select services that are already in this zone
      const zone = zones.find(z => z.id === currentZoneId)
      const existingIds: number[] = []
        ; (zone?.shipping_methods || []).forEach((m: any) => {
          const sid = parseMeServiceId(m.name)
          if (sid !== null) existingIds.push(sid)
        })
      setSelectedMeServiceIds(existingIds)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao buscar servicos do Melhor Envio')
    } finally {
      setLoadingMeServices(false)
    }
  }

  function toggleMeService(id: number) {
    setSelectedMeServiceIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function handleSaveMethod(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingMethod(true)
    const formData = new FormData(e.currentTarget)

    // --- Melhor Envio: save one method per selected service ---
    if (selectedMethodName === '__melhor_envio__') {
      if (selectedMeServiceIds.length === 0) {
        toast.error('Selecione pelo menos um servico')
        setSavingMethod(false)
        return
      }

      // Delete existing ME methods in this zone first
      const zone = zones.find(z => z.id === currentZoneId)
      const existingMeMethodIds = (zone?.shipping_methods || [])
        .filter((m: any) => isMeServiceMethod(m.name) || m.name === '__melhor_envio__')
        .map((m: any) => m.id)

      if (existingMeMethodIds.length > 0) {
        await supabase.from('shipping_methods').delete().in('id', existingMeMethodIds)
      }

      // Insert one method per selected service
      const methodsToInsert = selectedMeServiceIds.map((serviceId, idx) => {
        const service = meServices.find(s => s.id === serviceId)
        return {
          zone_id: currentZoneId,
          name: `__me_service_${serviceId}__`,
          price: 0,
          free_shipping_threshold: null,
          delivery_time_min: null,
          delivery_time_max: null,
          is_active: true,
          display_order: idx,
        }
      })

      const { error } = await supabase.from('shipping_methods').insert(methodsToInsert)
      if (error) {
        toast.error('Erro ao salvar servicos: ' + error.message)
        setSavingMethod(false)
        return
      }

      toast.success('Servicos Melhor Envio atualizados!')
      setMethodDialogOpen(false)
      setSavingMethod(false)
      loadData()
      return
    }

    // --- Manual method ---
    const finalName = getMethodNameForSave()
    if (!finalName) {
      toast.error('Selecione ou digite o nome da forma de entrega')
      setSavingMethod(false)
      return
    }

    const methodData: any = {
      zone_id: currentZoneId,
      name: finalName,
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

      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium flex items-center gap-1.5">
            <Truck className="h-4 w-4" /> Integracao com Melhor Envio disponivel!
          </p>
          <p className="mt-1 text-blue-700">
            Alem das zonas manuais abaixo, voce pode ativar o calculo automatico de frete via Correios, JadLog e outras transportadoras.
            Configure em <a href="/dashboard/integrations" className="underline font-medium">Integracoes → Melhor Envio</a>.
          </p>
        </div>
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
            // Group ME services together for display
            const manualMethods = methods.filter((m: any) => !isMeServiceMethod(m.name) && m.name !== '__melhor_envio__')
            const meMethods = methods.filter((m: any) => isMeServiceMethod(m.name) || m.name === '__melhor_envio__')

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
                        {/* Manual methods */}
                        {manualMethods.map((m: any) => (
                          <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                            <div className="flex-1 flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{m.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {formatCurrency(m.price)}
                              </span>
                              {m.delivery_time_min != null && m.delivery_time_max != null && (
                                <span className="text-xs text-muted-foreground">
                                  ({m.delivery_time_min}-{m.delivery_time_max} dias)
                                </span>
                              )}
                              {m.free_shipping_threshold && (
                                <span className="text-xs text-green-600">
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

                        {/* ME services grouped */}
                        {meMethods.length > 0 && (
                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-sm text-blue-800">Melhor Envio</span>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                                  Integracao
                                </span>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                  // Open dialog to edit ME services for this zone
                                  setEditingMethod(null)
                                  setCurrentZoneId(zone.id)
                                  setSelectedMethodName('__melhor_envio__')
                                  setCustomMethodName('')
                                  setMethodDialogOpen(true)
                                  fetchMeServicesForDialog()
                                }}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => {
                                  if (!confirm('Remover todos os servicos Melhor Envio desta zona?')) return
                                  const ids = meMethods.map((m: any) => m.id)
                                  await supabase.from('shipping_methods').delete().in('id', ids)
                                  toast.success('Servicos removidos!')
                                  loadData()
                                }}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {meMethods.filter((m: any) => isMeServiceMethod(m.name)).map((m: any) => {
                                const serviceId = parseMeServiceId(m.name)
                                return (
                                  <span key={m.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-200 text-blue-900">
                                    Servico #{serviceId}
                                  </span>
                                )
                              })}
                            </div>
                            <p className="text-xs text-blue-600">Preco e prazo calculados automaticamente</p>
                          </div>
                        )}
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
              <p className="text-xs text-muted-foreground text-left">
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
              <Label>Forma de entrega *</Label>
              <Select
                value={selectedMethodName}
                onChange={(e) => {
                  setSelectedMethodName(e.target.value)
                  if (e.target.value !== '__custom__') {
                    setCustomMethodName('')
                  }
                }}
                required={selectedMethodName !== '__custom__'}
              >
                <option value="" disabled>Selecione uma opcao...</option>
                <optgroup label="Integracoes">
                  {INTEGRATION_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Manuais">
                  {MANUAL_METHODS.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </optgroup>
                <option value="__custom__">Outro (digitar nome)</option>
              </Select>
              {selectedMethodName === '__custom__' && (
                <Input
                  value={customMethodName}
                  onChange={(e) => setCustomMethodName(e.target.value)}
                  placeholder="Digite o nome da forma de entrega"
                  required
                  autoFocus
                />
              )}
              {selectedMethodName === '__melhor_envio__' && (
                <div className="space-y-3">
                  {meServices.length === 0 && !loadingMeServices && (
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={fetchMeServicesForDialog}>
                        <Truck className="mr-2 h-4 w-4" />
                        Buscar servicos disponiveis
                      </Button>
                    </div>
                  )}
                  {loadingMeServices && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Buscando servicos...
                    </div>
                  )}
                  {meServices.length > 0 && (
                    <div className="space-y-2">
                      <Label>Selecione os servicos *</Label>
                      <div className="max-h-60 overflow-y-auto space-y-1 border rounded-lg p-2">
                        {meServices.map((service: any) => (
                          <label
                            key={service.id}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedMeServiceIds.includes(service.id)
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-gray-50 border border-transparent'
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedMeServiceIds.includes(service.id)}
                              onChange={() => toggleMeService(service.id)}
                              className="rounded border-gray-300"
                            />
                            {service.company_picture && (
                              <img src={service.company_picture} alt="" className="h-5 w-5 object-contain" />
                            )}
                            <div className="flex-1">
                              <span className="text-sm font-medium">
                                {service.company_name} - {service.name}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedMeServiceIds.length} servico(s) selecionado(s)
                      </p>
                    </div>
                  )}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                    <p className="font-medium">Preco e prazo calculados automaticamente</p>
                    <p className="mt-1">Os valores serao buscados em tempo real pela integracao no momento do checkout.</p>
                  </div>
                </div>
              )}
            </div>

            {selectedMethodName !== '__melhor_envio__' && !isMeServiceMethod(selectedMethodName) && selectedMethodName !== '' && (
              <>
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
              </>
            )}

            {selectedMethodName !== '__melhor_envio__' && (
              <div className="space-y-2">
                <Label htmlFor="method-order">Ordem de exibicao</Label>
                <Input id="method-order" name="method_order" type="number" defaultValue={editingMethod?.display_order || 0} />
              </div>
            )}

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
