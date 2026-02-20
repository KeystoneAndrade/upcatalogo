'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const paymentTypes = [
  { value: 'pix', label: 'PIX' },
  { value: 'money', label: 'Dinheiro' },
  { value: 'card', label: 'Cartao' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'other', label: 'Outro' },
]

export default function PaymentsPage() {
  const [methods, setMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [tenantId, setTenantId] = useState('')
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    const { data: tenant } = await supabase.from('lojas').select('id').eq('proprietario_id', session!.user.id).single()
    setTenantId(tenant!.id)
    const { data } = await supabase.from('metodos_pagamento').select('*').eq('loja_id', tenant!.id).order('display_order')
    setMethods(data || [])
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      loja_id: tenantId,
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      instructions: formData.get('instructions') as string || null,
      is_active: true,
    }

    if (editing) {
      const { error } = await supabase.from('metodos_pagamento').update(data).eq('id', editing.id)
      if (error) { toast.error('Erro'); setSaving(false); return }
      toast.success('Atualizado!')
    } else {
      const { error } = await supabase.from('metodos_pagamento').insert(data)
      if (error) { toast.error('Erro: ' + error.message); setSaving(false); return }
      toast.success('Criado!')
    }
    setDialogOpen(false); setEditing(null); setSaving(false); loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir?')) return
    await supabase.from('metodos_pagamento').delete().eq('id', id)
    toast.success('Excluido!'); loadData()
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Formas de Pagamento</h1>
        <Button onClick={() => { setEditing(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Nova Forma
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {methods.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhuma forma cadastrada</div>
          ) : (
            <div className="divide-y">
              {methods.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{m.name}</span>
                      <Badge variant="secondary">{paymentTypes.find(t => t.value === m.type)?.label || m.type}</Badge>
                    </div>
                    {m.instructions && <p className="text-sm text-muted-foreground mt-1">{m.instructions}</p>}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(m); setDialogOpen(true) }}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Nova'} Forma de Pagamento</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="pm-name">Nome</Label>
              <Input id="pm-name" name="name" required defaultValue={editing?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pm-type">Tipo</Label>
              <Select id="pm-type" name="type" required defaultValue={editing?.type || 'pix'}>
                {paymentTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pm-instructions">Instrucoes (ex: chave PIX)</Label>
              <Textarea id="pm-instructions" name="instructions" rows={3} defaultValue={editing?.instructions} />
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
