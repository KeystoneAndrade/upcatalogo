'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [tenantId, setTenantId] = useState<string>('')

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('owner_id', session!.user.id)
      .single()
    setTenantId(tenant!.id)

    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', tenant!.id)
      .order('display_order')
    setCategories(data || [])
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string

    const data = {
      tenant_id: tenantId,
      name,
      slug: slugify(name),
      is_active: true,
    }

    if (editingCategory) {
      const { error } = await supabase.from('categories').update(data).eq('id', editingCategory.id)
      if (error) { toast.error('Erro ao atualizar'); setSaving(false); return }
      toast.success('Categoria atualizada!')
    } else {
      const { error } = await supabase.from('categories').insert(data)
      if (error) { toast.error('Erro ao criar: ' + error.message); setSaving(false); return }
      toast.success('Categoria criada!')
    }

    setDialogOpen(false)
    setEditingCategory(null)
    setSaving(false)
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir categoria?')) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir'); return }
    toast.success('Categoria excluida!')
    loadData()
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <Button onClick={() => { setEditingCategory(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {categories.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma categoria cadastrada
            </div>
          ) : (
            <div className="divide-y">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">{cat.name}</span>
                    <Badge variant={cat.is_active ? 'default' : 'secondary'}>
                      {cat.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingCategory(cat); setDialogOpen(true) }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}>
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
            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nome</Label>
              <Input id="cat-name" name="name" required defaultValue={editingCategory?.name} />
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
