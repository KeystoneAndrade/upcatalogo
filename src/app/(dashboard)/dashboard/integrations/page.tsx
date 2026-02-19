'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Truck, Zap } from 'lucide-react'
import { toast } from 'sonner'

export default function IntegrationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenant, setTenant] = useState<any>(null)

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

  async function handleSaveME() {
    setSaving(true)
    const currentSettings = (tenant?.settings as any) || {}

    const { error } = await supabase
      .from('tenants')
      .update({
        settings: {
          ...currentSettings,
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
      toast.success('Integracao salva!')
      router.refresh()
    }
    setSaving(false)
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integracoes</h1>
        <p className="text-muted-foreground text-sm mt-1">Conecte servicos externos a sua loja</p>
      </div>

      {/* Melhor Envio */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Melhor Envio</CardTitle>
                <p className="text-xs text-muted-foreground">Calculo de frete automatico (Correios, JadLog, Loggi, etc.)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {meEnabled && (
                <Badge variant="outline" className={meSandbox ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'}>
                  {meSandbox ? 'Sandbox' : 'Producao'}
                </Badge>
              )}
              <button
                type="button"
                role="switch"
                aria-checked={meEnabled}
                onClick={() => setMeEnabled(!meEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${meEnabled ? 'bg-black' : 'bg-gray-200'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${meEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </CardHeader>

        {meEnabled && (
          <CardContent className="space-y-5 border-t pt-5">
            {/* Sandbox toggle */}
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

            {/* Token */}
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

            {/* CEP origem */}
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

            {/* Endereco remetente */}
            <div className="space-y-3 pt-3 border-t">
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

            {/* Dimensoes padrao */}
            <div className="space-y-3 pt-3 border-t">
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

            {/* Save button */}
            <div className="flex justify-end pt-3 border-t">
              <Button onClick={handleSaveME} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Melhor Envio
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Placeholder para futuras integracoes */}
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground">
          <Zap className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="font-medium text-sm">Mais integracoes em breve</p>
          <p className="text-xs mt-1">Gateway de pagamento, ERPs, marketplaces e mais</p>
        </CardContent>
      </Card>
    </div>
  )
}
