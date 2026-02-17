'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Loader2, MapPin } from 'lucide-react'
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

export default function ShippingPage() {
  const [zones, setZones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [tenantId, setTenantId] = useState('')
  const [cepStart, setCepStart] = useState('')
  const [cepEnd, setCepEnd] = useState('')
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    const { data: tenant } = await supabase.from('tenants').select('id').eq('owner_id', session!.user.id).single()
    setTenantId(tenant!.id)
    const { data } = await supabase.from('shipping_zones').select('*').eq('tenant_id', tenant!.id).order('display_order')
    setZones(data || [])
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    setCepStart('')
    setCepEnd('')
    setDialogOpen(true)
  }

  function openEdit(zone: any) {
    setEditing(zone)
    setCepStart(zone.cep_start ? formatCep(zone.cep_start) : '')
    setCepEnd(zone.cep_end ? formatCep(zone.cep_end) : '')
    setDialogOpen(true)
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)

    const cepStartNorm = normalizeCep(cepStart)
    const cepEndNorm = cepEnd ? normalizeCep(cepEnd) : cepStartNorm

    if (cepStartNorm.length !== 8) {
      toast.error('CEP inicial invalido')
      setSaving(false)
      return
    }

    if (cepEndNorm < cepStartNorm) {
      toast.error('CEP final deve ser maior ou igual ao CEP inicial')
      setSaving(false)
      return
    }

    const data: any = {
      tenant_id: tenantId,
      name: formData.get('name') as string,
      cep_start: cepStartNorm,
      cep_end: cepEndNorm,
      cities: [],
      price: parseFloat(formData.get('price') as string),
      free_shipping_threshold: formData.get('free_shipping_threshold') ? parseFloat(formData.get('free_shipping_threshold') as string) : null,
      delivery_time_min: formData.get('delivery_time_min') ? parseInt(formData.get('delivery_time_min') as string) : null,
      delivery_time_max: formData.get('delivery_time_max') ? parseInt(formData.get('delivery_time_max') as string) : null,
      is_active: true,
    }

    if (editing) {
      const { error } = await supabase.from('shipping_zones').update(data).eq('id', editing.id)
      if (error) { toast.error('Erro ao atualizar'); setSaving(false); return }
      toast.success('Zona atualizada!')
    } else {
      const { error } = await supabase.from('shipping_zones').insert(data)
      if (error) { toast.error('Erro: ' + error.message); setSaving(false); return }
      toast.success('Zona criada!')
    }
    setDialogOpen(false)
    setEditing(null)
    setSaving(false)
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir zona de entrega?')) return
    await supabase.from('shipping_zones').delete().eq('id', id)
    toast.success('Excluido!')
    loadData()
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Zonas de Entrega</h1>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Nova Zona
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {zones.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MapPin className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p>Nenhuma zona cadastrada</p>
              <p className="text-xs mt-1">Cadastre zonas com faixas de CEP para calcular o frete automaticamente</p>
            </div>
          ) : (
            <div className="divide-y">
              {zones.map((z) => (
                <div key={z.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{z.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {z.cep_start && z.cep_end ? (
                        <>
                          CEP: {formatCep(z.cep_start)}
                          {z.cep_end !== z.cep_start && ` ate ${formatCep(z.cep_end)}`}
                        </>
                      ) : z.cities?.length > 0 ? (
                        <>Cidades: {z.cities.join(', ')}</>
                      ) : null}
                      {' | '}Frete: {formatCurrency(z.price)}
                      {z.delivery_time_min && z.delivery_time_max && ` | ${z.delivery_time_min}-${z.delivery_time_max} dias`}
                    </p>
                    {z.free_shipping_threshold && (
                      <p className="text-xs text-green-600">Frete gratis acima de {formatCurrency(z.free_shipping_threshold)}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(z)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(z.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar' : 'Nova'} Zona de Entrega</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="sz-name">Nome da zona *</Label>
              <Input id="sz-name" name="name" required defaultValue={editing?.name} placeholder="Ex: Regiao Centro, Capital SP" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sz-cep-start">CEP Inicial *</Label>
                <Input
                  id="sz-cep-start"
                  value={cepStart}
                  onChange={(e) => setCepStart(formatCep(e.target.value))}
                  placeholder="01000-000"
                  required
                  maxLength={9}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sz-cep-end">CEP Final</Label>
                <Input
                  id="sz-cep-end"
                  value={cepEnd}
                  onChange={(e) => setCepEnd(formatCep(e.target.value))}
                  placeholder="01999-999"
                  maxLength={9}
                />
                <p className="text-xs text-muted-foreground">
                  Deixe vazio para CEP unico
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sz-price">Preco do frete (R$) *</Label>
                <Input id="sz-price" name="price" type="number" step="0.01" min="0" required defaultValue={editing?.price} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sz-free">Frete gratis acima de (R$)</Label>
                <Input id="sz-free" name="free_shipping_threshold" type="number" step="0.01" min="0" defaultValue={editing?.free_shipping_threshold} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sz-min">Prazo min (dias)</Label>
                <Input id="sz-min" name="delivery_time_min" type="number" min="0" defaultValue={editing?.delivery_time_min} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sz-max">Prazo max (dias)</Label>
                <Input id="sz-max" name="delivery_time_max" type="number" min="0" defaultValue={editing?.delivery_time_max} />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
