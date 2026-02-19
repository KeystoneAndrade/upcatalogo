import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { addToCart, extractMeConfig } from '@/lib/melhor-envio'

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

    // Fetch tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, name, settings')
      .eq('owner_id', session.user.id)
      .single()

    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    const settings = tenant.settings as any
    const meConfig = extractMeConfig(settings)
    if (!meConfig) return NextResponse.json({ error: 'Melhor Envio not configured' }, { status: 400 })

    // Fetch order
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('tenant_id', tenant.id)
      .single()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const address = order.address as any
    const items = (order.items as any[]) || []

    // Fetch product dimensions for weight/dimensions
    const productIds = items.map((i: any) => i.product_id).filter(Boolean)
    let productMap: Record<string, any> = {}

    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from('products')
        .select('id, weight, height, width, length')
        .in('id', productIds)

      if (products) {
        productMap = Object.fromEntries(products.map(p => [p.id, p]))
      }
    }

    // Build volumes
    const volumes = items.map((item: any) => {
      const prod = productMap[item.product_id] || {}
      return {
        height: prod.height ?? meConfig.default_height ?? 11,
        width: prod.width ?? meConfig.default_width ?? 11,
        length: prod.length ?? meConfig.default_length ?? 11,
        weight: (prod.weight ?? meConfig.default_weight ?? 0.3) * item.quantity,
      }
    })

    const meAddress = meConfig.address || {
      street: '', number: '', complement: '', neighborhood: '',
      city: '', state: '', postal_code: meConfig.cep_origem,
    }

    const cartPayload = {
      service: order.melhor_envio_service_id as number,
      from: {
        name: tenant.name,
        phone: settings.whatsapp || '',
        email: settings.email || session.user.email || '',
        address: meAddress.street,
        number: meAddress.number,
        complement: meAddress.complement || '',
        neighborhood: meAddress.neighborhood,
        city: meAddress.city,
        state_abbr: meAddress.state,
        postal_code: meConfig.cep_origem,
      },
      to: {
        name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email || '',
        address: address.street || '',
        number: address.number || '',
        complement: address.complement || '',
        neighborhood: address.neighborhood || '',
        city: address.city || '',
        state_abbr: address.state || '',
        postal_code: (address.zipcode || '').replace(/\D/g, ''),
      },
      products: items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        unitary_value: item.price,
      })),
      volumes,
      options: {
        insurance_value: Number(order.total),
        receipt: false,
        own_hand: false,
        non_commercial: true,
      },
    }

    const result = await addToCart(meConfig, cartPayload)

    // Update order with shipment ID
    const shipmentId = result.id || result.order_id
    if (shipmentId) {
      await supabase.from('orders').update({
        melhor_envio_shipment_id: shipmentId,
        melhor_envio_status: 'pending',
      }).eq('id', order_id)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('ME cart error:', error)
    return NextResponse.json({ error: error.message || 'Error adding to cart' }, { status: 500 })
  }
}
