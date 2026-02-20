import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTracking, extractMeConfig } from '@/lib/melhor-envio'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('order_id')

    if (!orderId) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
    }

    const { data: tenant } = await supabase
      .from('lojas')
      .select('id, settings')
      .eq('proprietario_id', session.user.id)
      .single()

    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const meConfig = extractMeConfig(tenant.settings as any)
    if (!meConfig) return NextResponse.json({ error: 'Melhor Envio not configured' }, { status: 400 })

    const { data: order } = await supabase
      .from('pedidos')
      .select('melhor_envio_shipment_id')
      .eq('id', orderId)
      .eq('loja_id', tenant.id)
      .single()

    if (!order?.melhor_envio_shipment_id) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 400 })
    }

    const result = await getTracking(meConfig, [order.melhor_envio_shipment_id])

    // Extract tracking info for this shipment
    const trackingInfo = result?.[order.melhor_envio_shipment_id] || result

    // Update tracking code if available
    if (trackingInfo?.tracking) {
      await supabase.from('pedidos').update({
        tracking_code: trackingInfo.tracking,
        melhor_envio_status: trackingInfo.status || 'posted',
      }).eq('id', orderId)
    }

    return NextResponse.json(trackingInfo)
  } catch (error: any) {
    console.error('ME tracking error:', error)
    return NextResponse.json({ error: error.message || 'Error getting tracking' }, { status: 500 })
  }
}
