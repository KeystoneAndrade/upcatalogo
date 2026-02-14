'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

export default function ShippingPage() {
  const [zones, setZones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [tenantId, setTenantId] = useState('')
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

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    const citiesStr = formData.get('cities') as string
    const data = {
      tenant_id: tenantId,
      name: formData.get('name') as string,
      cities: citiesStr.split(',').map(c => c.trim()).filter(Boolean),
      price: parseFloat(formData.get('price') as string),
      free_shipping_threshold: formData.get('free_shipping_threshold') ? parseFloat(formData.get('free_shipping_threshold') as string) : null,
      delivery_time_min: formData.get('delivery_time_min') ? parseInt(formData.get('delivery_time_min') as string) : null,
      delivery_time_max: formData.get('delivery_time_max') ? parseInt(formData.get('delivery_time_max') as string) : null,
      is_active: true,
    }

    if (editing) {
      const { error } = await supabase.from('shipping_zones').update(data).eq('id', editing.id)
      if (error) { toast.error('Erro'); setSaving(false); return }
      toast.success('Atualizado!')
    } else {
      const { error } = await supabase.from('shipping_zones').insert(data)
      if (error) { toast.error('Erro: ' + error.message); setSaving(false); return }
      toast.success('Criado!')
    }
    setDialogOpen(false); setEditing(null); setSaving(false); loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir zona?')) return
    await supabase.from('shipping_zones').delete().eq('id', id)
    toast.success('Excluido!'); loadData()
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Zonas de Entrega</h1>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Nova Zona
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {zones.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhuma zona cadastrada</div>
          ) : (
            <div className="divide-y">
              {zones.map((z) => (
                <div key={z.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{z.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Cidades: {z.cities?.join(', ')} | Frete: {formatCurrency(z.price)}
                      {z.delivery_time_min && z.delivery_time_max && ` | ${z.delivery_time_min}-${z.delivery_time_max} dias`}
                    </p>
                    {z.free_shipping_threshold && (
                      <p className="text-xs text-green-600">Frete gratis acima de {formatCurrency(z.free_shipping_threshold)}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(z); setDialogOpen(true) }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(z.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Nova'} Zona de Entrega</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="sz-name">Nome</Label>
              <Input id="sz-name" name="name" required defaultValue={editing?.name} placeholder="Ex: Centro" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sz-cities">Cidades (separadas por virgula)</Label>
              <Input id="sz-cities" name="cities" required defaultValue={editing?.cities?.join(', ')} placeholder="Sao Paulo, Guarulhos" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sz-price">Preco do frete (R$)</Label>
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
