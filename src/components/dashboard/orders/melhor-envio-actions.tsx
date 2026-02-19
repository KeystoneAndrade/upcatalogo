'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  ShoppingCart,
  CreditCard,
  FileText,
  Printer,
  Truck,
  XCircle,
  ExternalLink,
  PackageSearch,
} from 'lucide-react'
import { toast } from 'sonner'

interface MelhorEnvioActionsProps {
  orderId: string
  shipmentId: string | null
  serviceId: number | null
  serviceName: string | null
  protocol: string | null
  labelUrl: string | null
  meStatus: string | null
  trackingCode: string | null
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'No carrinho', color: 'bg-yellow-100 text-yellow-800' },
  released: { label: 'Comprado', color: 'bg-blue-100 text-blue-800' },
  generated: { label: 'Etiqueta gerada', color: 'bg-indigo-100 text-indigo-800' },
  printed: { label: 'Etiqueta impressa', color: 'bg-purple-100 text-purple-800' },
  posted: { label: 'Postado', color: 'bg-green-100 text-green-800' },
  delivered: { label: 'Entregue', color: 'bg-green-200 text-green-900' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
}

export function MelhorEnvioActions({
  orderId,
  shipmentId,
  serviceId,
  serviceName,
  protocol,
  labelUrl,
  meStatus,
  trackingCode,
}: MelhorEnvioActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [currentShipmentId, setCurrentShipmentId] = useState(shipmentId)
  const [currentStatus, setCurrentStatus] = useState(meStatus)
  const [currentProtocol, setCurrentProtocol] = useState(protocol)
  const [currentLabelUrl, setCurrentLabelUrl] = useState(labelUrl)
  const [currentTracking, setCurrentTracking] = useState(trackingCode)

  async function callApi(endpoint: string, method = 'POST') {
    const url = method === 'GET'
      ? `/api/melhor-envio/${endpoint}?order_id=${orderId}`
      : `/api/melhor-envio/${endpoint}`

    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    }

    if (method === 'POST') {
      options.body = JSON.stringify({ order_id: orderId })
    }

    const res = await fetch(url, options)

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
      throw new Error(err.error || `Erro ${res.status}`)
    }

    return res.json()
  }

  async function handleAddToCart() {
    setLoading('cart')
    try {
      const result = await callApi('cart')
      setCurrentShipmentId(result.id || result.order_id)
      setCurrentStatus('pending')
      toast.success('Frete adicionado ao carrinho do Melhor Envio!')
    } catch (err: any) {
      toast.error(err.message)
    }
    setLoading(null)
  }

  async function handleCheckout() {
    setLoading('checkout')
    try {
      const result = await callApi('checkout')
      setCurrentStatus('released')
      if (result?.purchase?.protocol) {
        setCurrentProtocol(result.purchase.protocol)
      }
      toast.success('Frete comprado com sucesso!')
    } catch (err: any) {
      toast.error(err.message)
    }
    setLoading(null)
  }

  async function handleGenerate() {
    setLoading('generate')
    try {
      await callApi('generate')
      setCurrentStatus('generated')
      toast.success('Etiqueta gerada! Aguarde alguns segundos para imprimir.')
    } catch (err: any) {
      toast.error(err.message)
    }
    setLoading(null)
  }

  async function handlePrint() {
    setLoading('print')
    try {
      const result = await callApi('print')
      if (result?.url) {
        setCurrentLabelUrl(result.url)
        window.open(result.url, '_blank')
      }
      toast.success('Etiqueta pronta para impressao!')
    } catch (err: any) {
      toast.error(err.message)
    }
    setLoading(null)
  }

  async function handleTracking() {
    setLoading('tracking')
    try {
      const result = await callApi('tracking', 'GET')
      if (result?.tracking) {
        setCurrentTracking(result.tracking)
      }
      toast.success('Rastreamento atualizado!')
    } catch (err: any) {
      toast.error(err.message)
    }
    setLoading(null)
  }

  async function handleCancel() {
    if (!confirm('Cancelar o envio pelo Melhor Envio?')) return
    setLoading('cancel')
    try {
      await callApi('cancel')
      setCurrentStatus('cancelled')
      setCurrentShipmentId(null)
      toast.success('Envio cancelado no Melhor Envio')
    } catch (err: any) {
      toast.error(err.message)
    }
    setLoading(null)
  }

  const status = statusLabels[currentStatus || '']

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Melhor Envio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Service info */}
        {serviceName && (
          <div className="text-sm">
            <p className="text-muted-foreground">Servico selecionado:</p>
            <p className="font-medium">{serviceName}</p>
          </div>
        )}

        {/* Status badge */}
        {status && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Badge variant="outline" className={status.color}>{status.label}</Badge>
          </div>
        )}

        {/* Protocol */}
        {currentProtocol && (
          <div className="text-sm">
            <span className="text-muted-foreground">Protocolo:</span>{' '}
            <span className="font-mono">{currentProtocol}</span>
          </div>
        )}

        {/* Tracking */}
        {currentTracking && (
          <div className="text-sm">
            <span className="text-muted-foreground">Rastreio:</span>{' '}
            <span className="font-mono font-medium">{currentTracking}</span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-2 border-t">
          {/* Step 1: Add to cart (needs serviceId but no shipmentId yet) */}
          {serviceId && !currentShipmentId && currentStatus !== 'cancelled' && (
            <Button onClick={handleAddToCart} disabled={!!loading} className="w-full" variant="outline">
              {loading === 'cart' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
              1. Adicionar ao Carrinho ME
            </Button>
          )}

          {/* Step 2: Checkout (purchase) */}
          {currentShipmentId && currentStatus === 'pending' && (
            <Button onClick={handleCheckout} disabled={!!loading} className="w-full" variant="outline">
              {loading === 'checkout' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
              2. Comprar Frete
            </Button>
          )}

          {/* Step 3: Generate label */}
          {currentShipmentId && currentStatus === 'released' && (
            <Button onClick={handleGenerate} disabled={!!loading} className="w-full" variant="outline">
              {loading === 'generate' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              3. Gerar Etiqueta
            </Button>
          )}

          {/* Step 4: Print label */}
          {currentShipmentId && (currentStatus === 'generated' || currentStatus === 'printed') && (
            <Button onClick={handlePrint} disabled={!!loading} className="w-full" variant="outline">
              {loading === 'print' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
              4. Imprimir Etiqueta
            </Button>
          )}

          {/* Open label URL */}
          {currentLabelUrl && (
            <a href={currentLabelUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full rounded-md text-sm font-medium ring-offset-white transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir Etiqueta (PDF)
            </a>
          )}

          {/* Tracking */}
          {currentShipmentId && currentStatus && !['pending', 'cancelled'].includes(currentStatus) && (
            <Button onClick={handleTracking} disabled={!!loading} className="w-full" variant="outline">
              {loading === 'tracking' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageSearch className="mr-2 h-4 w-4" />}
              Atualizar Rastreamento
            </Button>
          )}

          {/* Cancel */}
          {currentShipmentId && currentStatus && ['pending', 'released', 'generated'].includes(currentStatus) && (
            <Button onClick={handleCancel} disabled={!!loading} variant="destructive" className="w-full">
              {loading === 'cancel' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Cancelar Envio ME
            </Button>
          )}

          {/* No ME on this order */}
          {!serviceId && !currentShipmentId && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Este pedido nao usa Melhor Envio
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
