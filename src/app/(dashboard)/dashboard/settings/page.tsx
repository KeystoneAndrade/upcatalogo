'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getTenant, updateTenant } from '@/services/tenant-service'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenant, setTenant] = useState<any>(null)
  const [openCartOnAdd, setOpenCartOnAdd] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadTenant()
  }, [])

  async function loadTenant() {
    const supabase = createClient()
    try {
      const data = await getTenant(supabase)
      setTenant(data)
      const settings = (data?.settings as any) || {}
      setOpenCartOnAdd(!!settings.open_cart_on_add)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)

    const currentSettings = (tenant?.settings as any) || {}

    const data = {
      name: formData.get('name') as string,
      whatsapp: formData.get('whatsapp') as string || null,
      email: formData.get('email') as string || null,
      instagram: formData.get('instagram') as string || null,
      primary_color: formData.get('primary_color') as string,
      secondary_color: formData.get('secondary_color') as string,
      logo_url: formData.get('logo_url') as string || null,
      meta_title: formData.get('meta_title') as string || null,
      meta_description: formData.get('meta_description') as string || null,
      settings: {
        ...currentSettings,
        open_cart_on_add: openCartOnAdd,
      },
    }

    try {
      await updateTenant(supabase, tenant.id, data)
      toast.success('Configuracoes salvas!')
      router.refresh()
    } catch (err) {
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configuracoes da Loja</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Informacoes Gerais</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da loja</Label>
              <Input id="name" name="name" required defaultValue={tenant?.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo_url">URL do Logo</Label>
              <Input id="logo_url" name="logo_url" placeholder="https://..." defaultValue={tenant?.logo_url} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contato</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp (com DDD)</Label>
              <Input id="whatsapp" name="whatsapp" placeholder="5511999999999" defaultValue={tenant?.whatsapp} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={tenant?.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram (sem @)</Label>
              <Input id="instagram" name="instagram" placeholder="minhaloja" defaultValue={tenant?.instagram} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Carrinho</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-sm">Abrir mini cart ao adicionar produto</p>
                <p className="text-xs text-muted-foreground">
                  Abre o carrinho lateral automaticamente quando um produto e adicionado
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={openCartOnAdd}
                onClick={() => setOpenCartOnAdd(!openCartOnAdd)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${openCartOnAdd ? 'bg-black' : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${openCartOnAdd ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
              </button>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Aparencia</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Cor primaria</Label>
                <div className="flex items-center space-x-2">
                  <input type="color" id="primary_color" name="primary_color" defaultValue={tenant?.primary_color || '#000000'} className="h-10 w-14 rounded border cursor-pointer" />
                  <Input defaultValue={tenant?.primary_color || '#000000'} readOnly className="w-28" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary_color">Cor secundaria</Label>
                <div className="flex items-center space-x-2">
                  <input type="color" id="secondary_color" name="secondary_color" defaultValue={tenant?.secondary_color || '#ffffff'} className="h-10 w-14 rounded border cursor-pointer" />
                  <Input defaultValue={tenant?.secondary_color || '#ffffff'} readOnly className="w-28" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meta_title">Titulo da pagina</Label>
              <Input id="meta_title" name="meta_title" defaultValue={tenant?.meta_title} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meta_description">Descricao da pagina</Label>
              <Input id="meta_description" name="meta_description" defaultValue={tenant?.meta_description} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar configuracoes
          </Button>
        </div>
      </form>
    </div>
  )
}
