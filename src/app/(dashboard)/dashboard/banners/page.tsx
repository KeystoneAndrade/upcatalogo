'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface Banner {
  id: string
  title: string
  description: string | null
  image_url: string
  link_url: string | null
  open_in_new_tab: boolean
  is_active: boolean
  display_order: number
}

interface FormData {
  title: string
  description: string
  image_url: string
  link_url: string
  open_in_new_tab: boolean
  is_active: boolean
  display_order: number
}

export default function BannersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [banners, setBanners] = useState<Banner[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tenant, setTenant] = useState<any>(null)
  const [bannersPerView, setBannersPerView] = useState(1)
  const [savingSettings, setSavingSettings] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    open_in_new_tab: false,
    is_active: true,
    display_order: 0,
  })
  const supabase = createClient()

  useEffect(() => {
    loadBanners()
  }, [])

  async function loadBanners() {
    const { data: { session } } = await supabase.auth.getSession()
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, settings')
      .eq('owner_id', session!.user.id)
      .single()

    if (!tenant) {
      setLoading(false)
      return
    }

    setTenant(tenant)
    const settings = (tenant?.settings as any) || {}
    setBannersPerView(settings.banners_per_view || 1)

    const { data } = await supabase
      .from('banners')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('display_order')

    setBanners(data || [])
    setLoading(false)
  }

  async function saveSettings() {
    setSavingSettings(true)
    const currentSettings = (tenant?.settings as any) || {}

    const { error } = await supabase
      .from('tenants')
      .update({
        settings: {
          ...currentSettings,
          banners_per_view: bannersPerView,
        }
      })
      .eq('id', tenant.id)

    if (error) {
      toast.error('Erro ao salvar configuração')
    } else {
      toast.success('Configuração salva!')
      // Atualiza o estado local do tenant para futuras edições de settings
      setTenant({
        ...tenant,
        settings: {
          ...currentSettings,
          banners_per_view: bannersPerView,
        }
      })
    }
    setSavingSettings(false)
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      open_in_new_tab: false,
      is_active: true,
      display_order: 0,
    })
    setEditingId(null)
    setDialogOpen(false)
  }

  function editBanner(banner: Banner) {
    setFormData({
      title: banner.title,
      description: banner.description || '',
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      open_in_new_tab: banner.open_in_new_tab || false,
      is_active: banner.is_active,
      display_order: banner.display_order,
    })
    setEditingId(banner.id)
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data: { session } } = await supabase.auth.getSession()
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, settings')
      .eq('owner_id', session!.user.id)
      .single()

    if (!tenant) {
      toast.error('Erro ao salvar')
      setSaving(false)
      return
    }

    if (editingId) {
      const { error } = await supabase
        .from('banners')
        .update(formData)
        .eq('id', editingId)

      if (error) {
        toast.error('Erro ao atualizar banner')
      } else {
        toast.success('Banner atualizado!')
        resetForm()
        loadBanners()
      }
    } else {
      const { error } = await supabase
        .from('banners')
        .insert({
          ...formData,
          tenant_id: tenant.id,
        })

      if (error) {
        toast.error('Erro ao criar banner')
      } else {
        toast.success('Banner criado!')
        resetForm()
        loadBanners()
      }
    }
    setSaving(false)
  }

  async function deleteBanner(id: string) {
    if (!confirm('Tem certeza que deseja deletar este banner?')) return

    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Erro ao deletar banner')
    } else {
      toast.success('Banner deletado!')
      loadBanners()
    }
  }

  async function toggleActive(banner: Banner) {
    const { error } = await supabase
      .from('banners')
      .update({ is_active: !banner.is_active })
      .eq('id', banner.id)

    if (error) {
      toast.error('Erro ao atualizar banner')
    } else {
      loadBanners()
    }
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Banners</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white p-1 px-3 rounded-md border text-sm">
            <span className="text-muted-foreground whitespace-nowrap">Por slide (Desktop):</span>
            <input
              type="number"
              min={1}
              max={4}
              value={bannersPerView}
              onChange={(e) => setBannersPerView(Number(e.target.value))}
              className="w-12 bg-transparent outline-none font-medium"
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={saveSettings}
              disabled={savingSettings}
            >
              {savingSettings ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Salvar'}
            </Button>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Banner
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar' : 'Novo'} Banner</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titulo *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descricao</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image_url">URL da Imagem *</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
                required
              />
              {formData.image_url && (
                <img src={formData.image_url} alt="Preview" className="h-32 w-full object-cover rounded border" />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="link_url">URL do Link</Label>
              <Input
                id="link_url"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_order">Ordem de Exibicao</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm cursor-pointer">
                  Ativo
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="open_in_new_tab"
                  checked={formData.open_in_new_tab}
                  onChange={(e) => setFormData({ ...formData, open_in_new_tab: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="open_in_new_tab" className="text-sm cursor-pointer">
                  Abrir em nova aba
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-4 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? 'Atualizar' : 'Criar'} Banner
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4">
        {banners.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum banner criado ainda
          </div>
        ) : (
          banners.map((banner) => (
            <Card key={banner.id}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {banner.image_url && (
                    <img
                      src={banner.image_url}
                      alt={banner.title}
                      className="h-24 w-40 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{banner.title}</h3>
                    {banner.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {banner.description}
                      </p>
                    )}
                    {banner.link_url && (
                      <p className="text-xs text-blue-600 mt-1">
                        Link: {banner.link_url}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        Ordem: {banner.display_order}
                      </span>
                      {!banner.is_active && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          Inativo
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(banner)}
                    >
                      {banner.is_active ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editBanner(banner)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteBanner(banner.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
