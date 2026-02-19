'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Truck } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenant, setTenant] = useState<any>(null)
  const [openCartOnAdd, setOpenCartOnAdd] = useState(false)

  // Melhor Envio state
  const [meEnabled, setMeEnabled] = useState(false)
  const [meSandbox, setMeSandbox] = useState(true)
  const [meToken, setMeToken] = useState('')
  const [meCepOrigem, setMeCepOrigem] = useState('')
  const [meDefaultWeight, setMeDefaultWeight] = useState('0.3')
  const [meDefaultHeight, setMeDefaultHeight] = useState('11')
  const [meDefaultWidth, setMeDefaultWidth] = useState('11')
  const [meDefaultLength, setMeDefaultLength] = useState('11')
  const [meAddressStreet, setMeAddressStreet] = useState('')
  const [meAddressNumber, setMeAddressNumber] = useState('')
  const [meAddressComplement, setMeAddressComplement] = useState('')
  const [meAddressNeighborhood, setMeAddressNeighborhood] = useState('')
  const [meAddressCity, setMeAddressCity] = useState('')
  const [meAddressState, setMeAddressState] = useState('')

  const supabase = createClient()

  useEffect(() => {
    loadTenant()
  }, [])

  async function loadTenant() {
    const { data: { session } } = await supabase.auth.getSession()
    const { data } = await supabase
      .from('tenants')
      .select('*')
      .eq('owner_id', session!.user.id)
      .single()
    setTenant(data)
    const settings = (data?.settings as any) || {}
    setOpenCartOnAdd(!!settings.open_cart_on_add)

    // Load ME settings
    setMeEnabled(!!settings.melhor_envio_enabled)
    setMeSandbox(settings.melhor_envio_sandbox !== false)
    setMeToken(settings.melhor_envio_token || '')
    setMeCepOrigem(settings.melhor_envio_cep_origem || '')
    setMeDefaultWeight(String(settings.melhor_envio_default_weight || '0.3'))
    setMeDefaultHeight(String(settings.melhor_envio_default_height || '11'))
    setMeDefaultWidth(String(settings.melhor_envio_default_width || '11'))
    setMeDefaultLength(String(settings.melhor_envio_default_length || '11'))
    const addr = settings.melhor_envio_address || {}
    setMeAddressStreet(addr.street || '')
    setMeAddressNumber(addr.number || '')
    setMeAddressComplement(addr.complement || '')
    setMeAddressNeighborhood(addr.neighborhood || '')
    setMeAddressCity(addr.city || '')
    setMeAddressState(addr.state || '')

    setLoading(false)
  }

  function formatCepField(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)

    const currentSettings = (tenant?.settings as any) || {}

    const { error } = await supabase
      .from('tenants')
      .update({
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
          melhor_envio_enabled: meEnabled,
          melhor_envio_sandbox: meSandbox,
          melhor_envio_token: meToken,
          melhor_envio_cep_origem: meCepOrigem.replace(/\D/g, ''),
          melhor_envio_default_weight: parseFloat(meDefaultWeight) || 0.3,
          melhor_envio_default_height: parseFloat(meDefaultHeight) || 11,
          melhor_envio_default_width: parseFloat(meDefaultWidth) || 11,
          melhor_envio_default_length: parseFloat(meDefaultLength) || 11,
          melhor_envio_address: {
            street: meAddressStreet,
            number: meAddressNumber,
            complement: meAddressComplement,
            neighborhood: meAddressNeighborhood,
            city: meAddressCity,
            state: meAddressState,
            postal_code: meCepOrigem.replace(/\D/g, ''),
          },
        },
      })
      .eq('id', tenant.id)

    if (error) {
      toast.error('Erro ao salvar')
    } else {
      toast.success('Configuracoes salvas!')
      router.refresh()
    }
    setSaving(false)
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Melhor Envio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-medium text-sm">Ativar Melhor Envio</p>
                <p className="text-xs text-muted-foreground">
                  Exibe opcoes de frete via Melhor Envio (Correios, JadLog, etc.) no checkout
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={meEnabled}
                onClick={() => setMeEnabled(!meEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${meEnabled ? 'bg-black' : 'bg-gray-200'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${meEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </label>

            {meEnabled && (
              <div className="space-y-4 pt-2 border-t">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-sm">Modo Sandbox (testes)</p>
                    <p className="text-xs text-muted-foreground">
                      Use o modo sandbox para testar antes de ir para producao
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={meSandbox}
                    onClick={() => setMeSandbox(!meSandbox)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${meSandbox ? 'bg-yellow-500' : 'bg-green-500'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${meSandbox ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </label>
                {!meSandbox && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    Modo producao ativo — as etiquetas serao cobradas do seu saldo Melhor Envio
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="me_token">Token de acesso *</Label>
                  <Input
                    id="me_token"
                    type="password"
                    value={meToken}
                    onChange={(e) => setMeToken(e.target.value)}
                    placeholder="Seu token da API do Melhor Envio"
                  />
                  <p className="text-xs text-muted-foreground">
                    Gere seu token em{' '}
                    <a href={meSandbox ? 'https://sandbox.melhorenvio.com.br/painel/gerenciar/tokens' : 'https://melhorenvio.com.br/painel/gerenciar/tokens'} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {meSandbox ? 'sandbox.melhorenvio.com.br' : 'melhorenvio.com.br'}
                    </a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="me_cep_origem">CEP de origem *</Label>
                  <Input
                    id="me_cep_origem"
                    value={meCepOrigem}
                    onChange={(e) => setMeCepOrigem(formatCepField(e.target.value))}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                </div>

                <div className="space-y-3 pt-2 border-t">
                  <p className="font-medium text-sm">Endereco de origem (remetente)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Rua</Label>
                      <Input value={meAddressStreet} onChange={(e) => setMeAddressStreet(e.target.value)} placeholder="Rua / Av." />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Numero</Label>
                      <Input value={meAddressNumber} onChange={(e) => setMeAddressNumber(e.target.value)} placeholder="123" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Complemento</Label>
                      <Input value={meAddressComplement} onChange={(e) => setMeAddressComplement(e.target.value)} placeholder="Sala 1" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bairro</Label>
                      <Input value={meAddressNeighborhood} onChange={(e) => setMeAddressNeighborhood(e.target.value)} placeholder="Centro" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Cidade</Label>
                      <Input value={meAddressCity} onChange={(e) => setMeAddressCity(e.target.value)} placeholder="Sao Paulo" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Estado (UF)</Label>
                      <Input value={meAddressState} onChange={(e) => setMeAddressState(e.target.value.toUpperCase())} placeholder="SP" maxLength={2} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t">
                  <p className="font-medium text-sm">Dimensoes padrao dos produtos</p>
                  <p className="text-xs text-muted-foreground">
                    Usadas quando o produto nao tem peso/dimensoes cadastradas
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Peso (kg)</Label>
                      <Input type="number" step="0.01" min="0.01" value={meDefaultWeight} onChange={(e) => setMeDefaultWeight(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Altura (cm)</Label>
                      <Input type="number" step="0.1" min="0.4" value={meDefaultHeight} onChange={(e) => setMeDefaultHeight(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Largura (cm)</Label>
                      <Input type="number" step="0.1" min="8" value={meDefaultWidth} onChange={(e) => setMeDefaultWidth(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Comp. (cm)</Label>
                      <Input type="number" step="0.1" min="13" value={meDefaultLength} onChange={(e) => setMeDefaultLength(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            )}
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
