import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { printLabel, extractMeConfig } from '@/lib/melhor-envio'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { order_id } = body

    if (!order_id) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
    }

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, settings')
      .eq('owner_id', session.user.id)
      .single()

    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const meConfig = extractMeConfig(tenant.settings as any)
    if (!meConfig) return NextResponse.json({ error: 'Melhor Envio not configured' }, { status: 400 })

    const { data: order } = await supabase
      .from('orders')
      .select('melhor_envio_shipment_id')
      .eq('id', order_id)
      .eq('tenant_id', tenant.id)
      .single()

    if (!order?.melhor_envio_shipment_id) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 400 })
    }

    const result = await printLabel(meConfig, [order.melhor_envio_shipment_id])

    // Save label URL if returned
    if (result?.url) {
      await supabase.from('orders').update({
        melhor_envio_label_url: result.url,
      }).eq('id', order_id)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('ME print error:', error)
    return NextResponse.json({ error: error.message || 'Error printing label' }, { status: 500 })
  }
}
