'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Loader2, Truck, Zap, RefreshCw, MapPin, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface MeAddress {
  id: string
  label: string
  postal_code: string
  address: string
  number: string
  complement: string
  district: string
  city: string
  state_abbr: string
}

export default function IntegrationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenant, setTenant] = useState<any>(null)

  // Melhor Envio state
  const [meEnabled, setMeEnabled] = useState(false)
  const [meSandbox, setMeSandbox] = useState(true)
  const [meToken, setMeToken] = useState('')
  const [meDefaultWeight, setMeDefaultWeight] = useState('0.3')
  const [meDefaultHeight, setMeDefaultHeight] = useState('11')
  const [meDefaultWidth, setMeDefaultWidth] = useState('11')
  const [meDefaultLength, setMeDefaultLength] = useState('11')

  // ME Addresses state
  const [meAddresses, setMeAddresses] = useState<MeAddress[]>([])
  const [meSelectedAddressId, setMeSelectedAddressId] = useState('')
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [addressesLoaded, setAddressesLoaded] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadTenant()
  }, [])

  async function loadTenant() {
    const { data: { session } } = await supabase.auth.getSession()
    const { data } = await supabase
      .from('lojas')
      .select('*')
      .eq('proprietario_id', session!.user.id)
      .single()
    setTenant(data)
    const settings = (data?.settings as any) || {}

    setMeEnabled(!!settings.melhor_envio_enabled)
    setMeSandbox(settings.melhor_envio_sandbox !== false)
    setMeToken(settings.melhor_envio_token || '')
    setMeDefaultWeight(String(settings.melhor_envio_default_weight || '0.3'))
    setMeDefaultHeight(String(settings.melhor_envio_default_height || '11'))
    setMeDefaultWidth(String(settings.melhor_envio_default_width || '11'))
    setMeDefaultLength(String(settings.melhor_envio_default_length || '11'))
    setMeSelectedAddressId(settings.melhor_envio_address_id || '')

    setLoading(false)
  }

  function formatCepField(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }

  async function fetchMeAddresses() {
    if (!meToken) {
      toast.error('Informe o token de acesso primeiro')
      return
    }
    setLoadingAddresses(true)
    try {
      const res = await fetch('/api/melhor-envio/addresses')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao buscar enderecos')
      }
      const data = await res.json()
      setMeAddresses(data)
      setAddressesLoaded(true)
      if (data.length === 0) {
        toast.info('Nenhum endereco cadastrado no Melhor Envio')
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao buscar enderecos do Melhor Envio')
    } finally {
      setLoadingAddresses(false)
    }
  }

  async function handleSaveME() {
    setSaving(true)
    const currentSettings = (tenant?.settings as any) || {}

    // Derive CEP de origem from selected address
    const selectedAddr = meAddresses.find(a => a.id === meSelectedAddressId)
    const cepOrigem = selectedAddr?.postal_code?.replace(/\D/g, '') || currentSettings.melhor_envio_cep_origem || ''

    const { error } = await supabase
      .from('lojas')
      .update({
        settings: {
          ...currentSettings,
          melhor_envio_enabled: meEnabled,
          melhor_envio_sandbox: meSandbox,
          melhor_envio_token: meToken,
          melhor_envio_cep_origem: cepOrigem,
          melhor_envio_default_weight: parseFloat(meDefaultWeight) || 0.3,
          melhor_envio_default_height: parseFloat(meDefaultHeight) || 11,
          melhor_envio_default_width: parseFloat(meDefaultWidth) || 11,
          melhor_envio_default_length: parseFloat(meDefaultLength) || 11,
          melhor_envio_address_id: meSelectedAddressId || null,
          // Clean up old manual address field if it exists
          melhor_envio_address: undefined,
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

  const selectedAddress = meAddresses.find(a => a.id === meSelectedAddressId)

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

            {/* Endereco de origem - seletor do Melhor Envio */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Endereco de origem (remetente)</p>
                  <p className="text-xs text-muted-foreground">
                    Selecione um endereco cadastrado na sua conta Melhor Envio
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fetchMeAddresses}
                  disabled={loadingAddresses || !meToken}
                >
                  {loadingAddresses ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {addressesLoaded ? 'Atualizar' : 'Buscar enderecos'}
                </Button>
              </div>

              {!meToken && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                  Informe o token de acesso acima para buscar seus enderecos do Melhor Envio.
                </div>
              )}

              {meToken && !addressesLoaded && !loadingAddresses && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                  <MapPin className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                  Clique em &quot;Buscar enderecos&quot; para carregar seus enderecos cadastrados no Melhor Envio.
                </div>
              )}

              {addressesLoaded && meAddresses.length === 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                  Nenhum endereco encontrado. Cadastre um endereco em{' '}
                  <a
                    href={meSandbox ? 'https://sandbox.melhorenvio.com.br/painel/endereco' : 'https://melhorenvio.com.br/painel/endereco'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {meSandbox ? 'sandbox.melhorenvio.com.br' : 'melhorenvio.com.br'}
                  </a>
                </div>
              )}

              {meAddresses.length > 0 && (
                <div className="space-y-2">
                  <Select
                    value={meSelectedAddressId}
                    onChange={(e) => setMeSelectedAddressId(e.target.value)}
                  >
                    <option value="">Selecione um endereco...</option>
                    {meAddresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.label ? `${addr.label} - ` : ''}{addr.address}, {addr.number}{addr.complement ? ` (${addr.complement})` : ''} - {addr.district}, {addr.city}/{addr.state_abbr} - CEP {addr.postal_code}
                      </option>
                    ))}
                  </Select>

                  {selectedAddress && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          {selectedAddress.label && (
                            <p className="font-medium text-green-800 text-xs">{selectedAddress.label}</p>
                          )}
                          <p className="text-green-700 text-xs">
                            {selectedAddress.address}, {selectedAddress.number}
                            {selectedAddress.complement ? ` - ${selectedAddress.complement}` : ''}
                          </p>
                          <p className="text-green-700 text-xs">
                            {selectedAddress.district}, {selectedAddress.city}/{selectedAddress.state_abbr}
                          </p>
                          <p className="text-green-700 text-xs">CEP: {selectedAddress.postal_code}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Previously saved address that's not in the loaded list */}
                  {meSelectedAddressId && !selectedAddress && !loadingAddresses && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                      Endereco salvo anteriormente (ID: {meSelectedAddressId}). Clique em &quot;Atualizar&quot; para verificar.
                    </div>
                  )}
                </div>
              )}

              {/* Previously saved address ID shown when addresses not yet loaded */}
              {!addressesLoaded && meSelectedAddressId && (
                <div className="p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                  <CheckCircle2 className="inline h-3.5 w-3.5 mr-1 -mt-0.5 text-green-500" />
                  Endereco de origem configurado. Clique em &quot;Buscar enderecos&quot; para ver detalhes.
                </div>
              )}
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
