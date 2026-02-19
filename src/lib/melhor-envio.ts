// Melhor Envio API Helper
// Docs: https://docs.melhorenvio.com.br

export interface MelhorEnvioConfig {
  token: string
  sandbox: boolean
  cep_origem: string
  default_weight?: number
  default_height?: number
  default_width?: number
  default_length?: number
  address_id?: string  // ID do endereco selecionado no Melhor Envio
  services?: number[]  // IDs dos servicos habilitados (vazio = todos)
}

export interface MelhorEnvioAddress {
  id: string
  label: string
  postal_code: string
  address: string
  number: string
  complement: string
  district: string
  city: {
    city: string
    state: { state_abbr: string }
  }
}

export interface ProductDimensions {
  weight: number  // kg
  height: number  // cm
  width: number   // cm
  length: number  // cm
  quantity: number
  price: number
}

function getBaseUrl(sandbox: boolean) {
  return sandbox
    ? 'https://sandbox.melhorenvio.com.br'
    : 'https://melhorenvio.com.br'
}

function getHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'UPCatalogo (contato@upcatalogo.com.br)',
  }
}

async function meRequest(config: MelhorEnvioConfig, path: string, options: RequestInit = {}) {
  const baseUrl = getBaseUrl(config.sandbox)
  const url = `${baseUrl}${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(config.token),
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Melhor Envio API error ${response.status}: ${errorText}`)
  }

  return response.json()
}

// Calculate shipping options
export async function calculateShipping(
  config: MelhorEnvioConfig,
  toCep: string,
  products: ProductDimensions[]
) {
  // Aggregate products into a single package
  const totalWeight = products.reduce((sum, p) => sum + (p.weight * p.quantity), 0)
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0)

  // For dimensions, use the largest individual item dimensions
  const maxHeight = Math.max(...products.map(p => p.height))
  const maxWidth = Math.max(...products.map(p => p.width))
  const maxLength = Math.max(...products.map(p => p.length))

  const body = {
    from: { postal_code: config.cep_origem },
    to: { postal_code: toCep },
    products: products.map(p => ({
      id: 'product',
      width: p.width,
      height: p.height,
      length: p.length,
      weight: p.weight,
      insurance_value: p.price * p.quantity,
      quantity: p.quantity,
    })),
  }

  const data = await meRequest(config, '/api/v2/me/shipment/calculate', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  // Filter out services with errors
  if (Array.isArray(data)) {
    let valid = data.filter((service: any) => !service.error)

    // Filter by allowed service IDs if specified
    if (config.services && config.services.length > 0) {
      valid = valid.filter((s: any) => config.services!.includes(s.id))
    }

    return valid
  }

  return []
}

// Add shipment to Melhor Envio cart
export async function addToCart(
  config: MelhorEnvioConfig,
  orderData: {
    service: number
    from: {
      name: string
      phone: string
      email?: string
      address: string
      number: string
      complement?: string
      neighborhood: string
      city: string
      state_abbr: string
      postal_code: string
    }
    to: {
      name: string
      phone: string
      email?: string
      address: string
      number: string
      complement?: string
      neighborhood: string
      city: string
      state_abbr: string
      postal_code: string
    }
    products: Array<{
      name: string
      quantity: number
      unitary_value: number
    }>
    volumes: Array<{
      height: number
      width: number
      length: number
      weight: number
    }>
    options?: {
      insurance_value?: number
      receipt?: boolean
      own_hand?: boolean
      non_commercial?: boolean
    }
  }
) {
  return meRequest(config, '/api/v2/me/cart', {
    method: 'POST',
    body: JSON.stringify(orderData),
  })
}

// Checkout (purchase) shipments
export async function checkoutShipment(
  config: MelhorEnvioConfig,
  shipmentIds: string[]
) {
  return meRequest(config, '/api/v2/me/shipment/checkout', {
    method: 'POST',
    body: JSON.stringify({ orders: shipmentIds }),
  })
}

// Generate shipping label
export async function generateLabel(
  config: MelhorEnvioConfig,
  shipmentIds: string[]
) {
  return meRequest(config, '/api/v2/me/shipment/generate', {
    method: 'POST',
    body: JSON.stringify({ orders: shipmentIds }),
  })
}

// Print shipping label (returns PDF URL)
export async function printLabel(
  config: MelhorEnvioConfig,
  shipmentIds: string[]
) {
  return meRequest(config, '/api/v2/me/shipment/print', {
    method: 'POST',
    body: JSON.stringify({
      mode: 'public',
      orders: shipmentIds,
    }),
  })
}

// Get tracking info
export async function getTracking(
  config: MelhorEnvioConfig,
  shipmentIds: string[]
) {
  return meRequest(config, '/api/v2/me/shipment/tracking', {
    method: 'POST',
    body: JSON.stringify({ orders: shipmentIds }),
  })
}

// Get user addresses from Melhor Envio
export async function getAddresses(config: MelhorEnvioConfig): Promise<MelhorEnvioAddress[]> {
  const data = await meRequest(config, '/api/v2/me/addresses', { method: 'GET' })
  if (Array.isArray(data)) return data
  if (data?.data && Array.isArray(data.data)) return data.data
  return []
}

// Get a specific address by ID
export async function getAddressById(config: MelhorEnvioConfig, addressId: string): Promise<MelhorEnvioAddress | null> {
  try {
    const data = await meRequest(config, `/api/v2/me/addresses/${addressId}`, { method: 'GET' })
    return data || null
  } catch {
    return null
  }
}

// Get available shipping services
export async function getAvailableServices(config: MelhorEnvioConfig) {
  const data = await meRequest(config, '/api/v2/me/shipment/services', { method: 'GET' })
  if (Array.isArray(data)) {
    return data.map((s: any) => ({
      id: s.id,
      name: s.name || '',
      type: s.type || '',
      company_name: s.company?.name || '',
      company_picture: s.company?.picture || '',
    }))
  }
  return []
}

// Cancel a shipment
export async function cancelShipment(
  config: MelhorEnvioConfig,
  shipmentId: string,
  reason: string = 'Pedido cancelado'
) {
  return meRequest(config, '/api/v2/me/shipment/cancel', {
    method: 'POST',
    body: JSON.stringify({
      order: {
        id: shipmentId,
        reason_id: 2,
        description: reason,
      },
    }),
  })
}

// Helper: extract ME config from tenant settings
export function extractMeConfig(settings: any): MelhorEnvioConfig | null {
  if (!settings?.melhor_envio_enabled || !settings?.melhor_envio_token) {
    return null
  }

  return {
    token: settings.melhor_envio_token,
    sandbox: !!settings.melhor_envio_sandbox,
    cep_origem: settings.melhor_envio_cep_origem || '',
    default_weight: settings.melhor_envio_default_weight || 0.3,
    default_height: settings.melhor_envio_default_height || 11,
    default_width: settings.melhor_envio_default_width || 11,
    default_length: settings.melhor_envio_default_length || 11,
    address_id: settings.melhor_envio_address_id || undefined,
    services: Array.isArray(settings.melhor_envio_services) ? settings.melhor_envio_services : undefined,
  }
}
