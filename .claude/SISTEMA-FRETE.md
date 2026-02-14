# 🚚 Sistema de Frete Completo

## 📋 Visão Geral

O sistema suporta 4 tipos de métodos de frete:

1. **Fixed** - Valor fixo para toda a loja
2. **Free** - Frete grátis (com valor mínimo opcional)
3. **Table** - Tabela de preços por zona (cidade/CEP)
4. **API** - Integração com APIs externas (Melhor Envio, Correios, etc)

## 🏗️ Estrutura no Banco

### Tabelas

1. **shipping_methods** - Métodos de frete
2. **shipping_zones** - Zonas de entrega (para tipo 'table')
3. **shipping_api_cache** - Cache de cotações de APIs

### Exemplos de Dados

#### Método 1: Frete Fixo

```sql
INSERT INTO shipping_methods (
  tenant_id,
  name,
  description,
  type,
  fixed_price,
  is_active
) VALUES (
  'tenant-uuid',
  'Entrega Padrão',
  'Entrega em até 5 dias úteis',
  'fixed',
  15.00,
  true
);
```

#### Método 2: Frete Grátis

```sql
INSERT INTO shipping_methods (
  tenant_id,
  name,
  type,
  free_shipping_threshold,
  is_active
) VALUES (
  'tenant-uuid',
  'Frete Grátis',
  'free',
  100.00, -- Grátis acima de R$ 100
  true
);
```

#### Método 3: Tabela por Zona

```sql
-- 1. Criar método
INSERT INTO shipping_methods (
  tenant_id,
  name,
  type,
  is_active
) VALUES (
  'tenant-uuid',
  'Entrega por Região',
  'table',
  true
) RETURNING id;

-- 2. Criar zonas
INSERT INTO shipping_zones (
  tenant_id,
  shipping_method_id,
  name,
  cities,
  price,
  delivery_time_min,
  delivery_time_max
) VALUES
  ('tenant-uuid', 'method-uuid', 'Centro', ARRAY['São Paulo'], 10.00, 1, 2),
  ('tenant-uuid', 'method-uuid', 'Zona Sul', ARRAY['São Paulo'], 15.00, 2, 3),
  ('tenant-uuid', 'method-uuid', 'Grande SP', ARRAY['Guarulhos', 'Osasco', 'Barueri'], 20.00, 3, 5);
```

#### Método 4: API (Melhor Envio)

```sql
INSERT INTO shipping_methods (
  tenant_id,
  name,
  description,
  type,
  api_provider,
  api_config,
  is_active
) VALUES (
  'tenant-uuid',
  'Correios via Melhor Envio',
  'PAC e SEDEX',
  'api',
  'melhor_envio',
  '{
    "token": "seu-token-aqui",
    "services": ["PAC", "SEDEX"],
    "from": {
      "postal_code": "01310-100"
    }
  }',
  true
);
```

## 💻 Implementação

### 1. Configurar Métodos de Frete (Dashboard)

```typescript
// src/app/(dashboard)/dashboard/settings/shipping/page.tsx

export default function ShippingSettings() {
  const [methods, setMethods] = useState([]);
  const [methodType, setMethodType] = useState<'fixed' | 'free' | 'table' | 'api'>('fixed');

  return (
    <div>
      <h1>Métodos de Frete</h1>

      {/* Lista de métodos existentes */}
      <div>
        {methods.map(method => (
          <Card key={method.id}>
            <h3>{method.name}</h3>
            <Badge>{method.type}</Badge>
            <Switch 
              checked={method.is_active}
              onChange={(active) => toggleMethod(method.id, active)}
            />
          </Card>
        ))}
      </div>

      {/* Adicionar novo método */}
      <Dialog>
        <DialogTrigger>
          <Button>Adicionar Método</Button>
        </DialogTrigger>
        <DialogContent>
          <h2>Novo Método de Frete</h2>
          
          <Select value={methodType} onChange={setMethodType}>
            <option value="fixed">Valor Fixo</option>
            <option value="free">Frete Grátis</option>
            <option value="table">Tabela de Preços</option>
            <option value="api">API Externa</option>
          </Select>

          {methodType === 'fixed' && <FixedShippingForm />}
          {methodType === 'free' && <FreeShippingForm />}
          {methodType === 'table' && <TableShippingForm />}
          {methodType === 'api' && <ApiShippingForm />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Formulário para API
function ApiShippingForm() {
  return (
    <>
      <Input name="name" label="Nome" />
      <Select name="provider">
        <option value="melhor_envio">Melhor Envio</option>
        <option value="correios">Correios</option>
        <option value="jadlog">Jadlog</option>
      </Select>
      
      <Input name="api_token" label="Token da API" type="password" />
      
      <div>
        <label>Serviços</label>
        <Checkbox name="services" value="PAC">PAC</Checkbox>
        <Checkbox name="services" value="SEDEX">SEDEX</Checkbox>
        <Checkbox name="services" value="SEDEX 10">SEDEX 10</Checkbox>
      </div>

      <Input name="from_zipcode" label="CEP de Origem" />
    </>
  );
}
```

### 2. Calcular Frete no Checkout

```typescript
// src/lib/shipping/calculator.ts

import { createClient } from '@/lib/supabase/client';

interface ShippingQuote {
  method_id: string;
  name: string;
  service?: string; // Para APIs (PAC, SEDEX)
  price: number;
  delivery_time_min?: number;
  delivery_time_max?: number;
  error?: string;
}

export async function calculateShipping(
  tenantId: string,
  destinationZipcode: string,
  cartTotal: number,
  cartWeight: number, // em kg
  cartDimensions?: { length: number; width: number; height: number }
): Promise<ShippingQuote[]> {
  const supabase = createClient();
  
  // Buscar métodos ativos
  const { data: methods } = await supabase
    .from('shipping_methods')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true);

  if (!methods) return [];

  const quotes: ShippingQuote[] = [];

  for (const method of methods) {
    try {
      let quote: ShippingQuote | null = null;

      switch (method.type) {
        case 'fixed':
          quote = calculateFixedShipping(method, cartTotal);
          break;
        
        case 'free':
          quote = calculateFreeShipping(method, cartTotal);
          break;
        
        case 'table':
          quote = await calculateTableShipping(method, destinationZipcode, cartTotal, cartWeight);
          break;
        
        case 'api':
          quote = await calculateApiShipping(
            method,
            destinationZipcode,
            cartWeight,
            cartDimensions
          );
          break;
      }

      if (quote) {
        quotes.push(quote);
      }
    } catch (error) {
      console.error(`Error calculating ${method.name}:`, error);
      quotes.push({
        method_id: method.id,
        name: method.name,
        price: 0,
        error: 'Erro ao calcular frete',
      });
    }
  }

  return quotes;
}

// Frete fixo
function calculateFixedShipping(method: any, cartTotal: number): ShippingQuote {
  // Verificar valor mínimo
  if (method.min_order_value && cartTotal < method.min_order_value) {
    return null;
  }

  return {
    method_id: method.id,
    name: method.name,
    price: method.fixed_price,
    delivery_time_min: method.min_delivery_days,
    delivery_time_max: method.max_delivery_days,
  };
}

// Frete grátis
function calculateFreeShipping(method: any, cartTotal: number): ShippingQuote | null {
  // Verifica se atinge o valor mínimo
  if (method.free_shipping_threshold && cartTotal < method.free_shipping_threshold) {
    return null;
  }

  return {
    method_id: method.id,
    name: method.name,
    price: 0,
    delivery_time_min: method.min_delivery_days,
    delivery_time_max: method.max_delivery_days,
  };
}

// Frete por tabela
async function calculateTableShipping(
  method: any,
  destinationZipcode: string,
  cartTotal: number,
  cartWeight: number
): Promise<ShippingQuote | null> {
  const supabase = createClient();

  // Buscar zona que atende o CEP
  const { data: zones } = await supabase
    .from('shipping_zones')
    .select('*')
    .eq('shipping_method_id', method.id)
    .eq('is_active', true);

  if (!zones) return null;

  // Encontrar zona por CEP
  const zone = zones.find(z => {
    // Verificar zipcode ranges
    if (z.zipcode_ranges?.length > 0) {
      return z.zipcode_ranges.some((range: any) => 
        destinationZipcode >= range.start && destinationZipcode <= range.end
      );
    }
    // Verificar CEPs específicos
    if (z.zipcodes?.includes(destinationZipcode)) {
      return true;
    }
    return false;
  });

  if (!zone) return null;

  // Calcular preço
  let price = zone.price;
  
  // Adicionar taxa por kg se configurado
  if (zone.additional_price_per_kg && cartWeight > 0) {
    price += zone.additional_price_per_kg * cartWeight;
  }

  // Frete grátis acima de X
  if (zone.free_shipping_threshold && cartTotal >= zone.free_shipping_threshold) {
    price = 0;
  }

  return {
    method_id: method.id,
    name: `${method.name} - ${zone.name}`,
    price,
    delivery_time_min: zone.delivery_time_min,
    delivery_time_max: zone.delivery_time_max,
  };
}

// Frete via API
async function calculateApiShipping(
  method: any,
  destinationZipcode: string,
  weight: number,
  dimensions?: { length: number; width: number; height: number }
): Promise<ShippingQuote[]> {
  const { api_provider, api_config } = method;

  switch (api_provider) {
    case 'melhor_envio':
      return calculateMelhorEnvio(method, destinationZipcode, weight, dimensions);
    
    case 'correios':
      return calculateCorreios(method, destinationZipcode, weight, dimensions);
    
    default:
      throw new Error(`Unknown API provider: ${api_provider}`);
  }
}
```

### 3. Integração com Melhor Envio

```typescript
// src/lib/shipping/melhor-envio.ts

interface MelhorEnvioQuote {
  id: string;
  name: string;
  price: string;
  delivery_time: number;
  company: {
    name: string;
    picture: string;
  };
}

export async function calculateMelhorEnvio(
  method: any,
  destinationZipcode: string,
  weight: number,
  dimensions?: { length: number; width: number; height: number }
): Promise<ShippingQuote[]> {
  const { token, from, services } = method.api_config;

  // Verificar cache primeiro
  const cacheKey = `melhor_envio_${from.postal_code}_${destinationZipcode}_${weight}`;
  const cached = await getCachedQuote(cacheKey);
  
  if (cached) {
    return cached;
  }

  // Fazer requisição para API
  const response = await fetch('https://melhorenvio.com.br/api/v2/me/shipment/calculate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: {
        postal_code: from.postal_code,
      },
      to: {
        postal_code: destinationZipcode,
      },
      package: {
        weight: weight,
        width: dimensions?.width || 20,
        height: dimensions?.height || 20,
        length: dimensions?.length || 20,
      },
      services: services.join(','), // "1,2" (1=PAC, 2=SEDEX)
    }),
  });

  if (!response.ok) {
    throw new Error('Erro ao calcular frete via Melhor Envio');
  }

  const data: MelhorEnvioQuote[] = await response.json();

  // Transformar para nosso formato
  const quotes: ShippingQuote[] = data.map(quote => ({
    method_id: method.id,
    name: method.name,
    service: quote.name,
    price: parseFloat(quote.price),
    delivery_time_min: quote.delivery_time,
    delivery_time_max: quote.delivery_time,
  }));

  // Salvar no cache (expira em 4 horas)
  await cacheQuote(cacheKey, quotes, 4);

  return quotes;
}

// Cache de cotações
async function getCachedQuote(cacheKey: string): Promise<ShippingQuote[] | null> {
  const supabase = createClient();
  
  const { data } = await supabase
    .from('shipping_api_cache')
    .select('services, expires_at')
    .eq('cache_key', cacheKey)
    .single();

  if (!data) return null;

  // Verificar se expirou
  if (new Date(data.expires_at) < new Date()) {
    return null;
  }

  return data.services as ShippingQuote[];
}

async function cacheQuote(
  cacheKey: string,
  quotes: ShippingQuote[],
  hoursToExpire: number
) {
  const supabase = createClient();
  
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + hoursToExpire);

  await supabase
    .from('shipping_api_cache')
    .upsert({
      cache_key: cacheKey,
      services: quotes,
      expires_at: expiresAt.toISOString(),
    });
}
```

### 4. Integração com Correios (API REST)

```typescript
// src/lib/shipping/correios.ts

export async function calculateCorreios(
  method: any,
  destinationZipcode: string,
  weight: number,
  dimensions?: { length: number; width: number; height: number }
): Promise<ShippingQuote[]> {
  const { from_zipcode, services } = method.api_config;

  // Verificar cache
  const cacheKey = `correios_${from_zipcode}_${destinationZipcode}_${weight}`;
  const cached = await getCachedQuote(cacheKey);
  if (cached) return cached;

  const quotes: ShippingQuote[] = [];

  // Calcular para cada serviço (PAC, SEDEX)
  for (const service of services) {
    const serviceCode = service === 'PAC' ? '04510' : '04014'; // Códigos dos Correios

    const url = new URL('https://ws.correios.com.br/calculador/CalcPrecoPrazo.asmx/CalcPrecoPrazo');
    url.searchParams.append('nCdEmpresa', '');
    url.searchParams.append('sDsSenha', '');
    url.searchParams.append('nCdServico', serviceCode);
    url.searchParams.append('sCepOrigem', from_zipcode);
    url.searchParams.append('sCepDestino', destinationZipcode);
    url.searchParams.append('nVlPeso', weight.toString());
    url.searchParams.append('nCdFormato', '1'); // Caixa/Pacote
    url.searchParams.append('nVlComprimento', (dimensions?.length || 20).toString());
    url.searchParams.append('nVlAltura', (dimensions?.height || 20).toString());
    url.searchParams.append('nVlLargura', (dimensions?.width || 20).toString());
    url.searchParams.append('nVlDiametro', '0');
    url.searchParams.append('sCdMaoPropria', 'N');
    url.searchParams.append('nVlValorDeclarado', '0');
    url.searchParams.append('sCdAvisoRecebimento', 'N');

    const response = await fetch(url.toString());
    const text = await response.text();
    
    // Parse XML
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    
    const valor = xml.querySelector('Valor')?.textContent;
    const prazo = xml.querySelector('PrazoEntrega')?.textContent;
    const erro = xml.querySelector('Erro')?.textContent;

    if (erro === '0' && valor) {
      quotes.push({
        method_id: method.id,
        name: method.name,
        service: service,
        price: parseFloat(valor.replace(',', '.')),
        delivery_time_min: parseInt(prazo || '0'),
        delivery_time_max: parseInt(prazo || '0'),
      });
    }
  }

  // Cache por 4 horas
  await cacheQuote(cacheKey, quotes, 4);

  return quotes;
}
```

### 5. Usar no Checkout

```typescript
// src/app/(storefront)/checkout/page.tsx

'use client'

export default function CheckoutPage() {
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cart = useCartStore();

  // Calcular frete quando CEP for preenchido
  async function handleZipcodeChange(zipcode: string) {
    if (zipcode.length !== 8) return;

    setLoading(true);
    
    try {
      // Calcular peso total
      const totalWeight = cart.items.reduce((sum, item) => {
        return sum + (item.weight || 0) * item.quantity;
      }, 0);

      // Calcular dimensões (maior produto)
      const dimensions = cart.items.reduce((max, item) => {
        const volume = (item.length || 0) * (item.width || 0) * (item.height || 0);
        const maxVolume = (max.length || 0) * (max.width || 0) * (max.height || 0);
        return volume > maxVolume ? item : max;
      }, {});

      // Buscar cotações
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zipcode,
          total: cart.total,
          weight: totalWeight,
          dimensions,
        }),
      });

      const quotes = await response.json();
      setShippingQuotes(quotes);
    } catch (error) {
      toast.error('Erro ao calcular frete');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form>
      {/* Dados do cliente */}
      <Input name="name" label="Nome" required />
      <Input name="phone" label="Telefone" required />

      {/* Endereço */}
      <Input
        name="zipcode"
        label="CEP"
        onChange={(e) => handleZipcodeChange(e.target.value)}
        required
      />

      {/* Opções de frete */}
      {loading ? (
        <div>Calculando frete...</div>
      ) : shippingQuotes.length > 0 ? (
        <div>
          <h3>Selecione o frete</h3>
          {shippingQuotes.map((quote, idx) => (
            <label key={idx} className="border p-4 rounded cursor-pointer">
              <input
                type="radio"
                name="shipping"
                value={quote.method_id}
                checked={selectedShipping === quote.method_id}
                onChange={() => setSelectedShipping(quote.method_id)}
              />
              <div className="ml-4">
                <div className="font-semibold">
                  {quote.name} {quote.service && `- ${quote.service}`}
                </div>
                <div className="text-sm text-gray-600">
                  {quote.delivery_time_min && `${quote.delivery_time_min} dias úteis`}
                </div>
                <div className="font-bold text-lg">
                  {quote.price === 0 ? 'GRÁTIS' : formatCurrency(quote.price)}
                </div>
              </div>
            </label>
          ))}
        </div>
      ) : (
        <div>Informe o CEP para calcular o frete</div>
      )}

      {/* Resumo do pedido */}
      <div>
        <div>Subtotal: {formatCurrency(cart.total)}</div>
        <div>Frete: {selectedShipping ? formatCurrency(getShippingPrice()) : '-'}</div>
        <div className="text-xl font-bold">
          Total: {formatCurrency(cart.total + getShippingPrice())}
        </div>
      </div>

      <Button type="submit">Finalizar Pedido</Button>
    </form>
  );
}
```

## 🔌 Integrações Disponíveis

### 1. Melhor Envio

**Cadastro:**
1. Criar conta em [melhorenvio.com.br](https://melhorenvio.com.br)
2. Gerar token de API em Configurações > Tokens
3. Adicionar saldo (opcional, para etiquetas)

**Configuração:**
```json
{
  "token": "seu-token-bearer",
  "services": ["PAC", "SEDEX", "SEDEX 10"],
  "from": {
    "postal_code": "01310-100"
  }
}
```

**Serviços disponíveis:**
- PAC
- SEDEX
- SEDEX 10
- Transportadoras parceiras (Azul, Jadlog, etc)

### 2. Correios Direto

**Configuração:**
```json
{
  "from_zipcode": "01310-100",
  "services": ["PAC", "SEDEX"],
  "contrato": "seu-contrato", // Opcional
  "senha": "sua-senha" // Opcional
}
```

**Nota:** API pública tem limite de requisições. Para alto volume, usar contrato.

### 3. Jadlog

**Configuração:**
```json
{
  "token": "seu-token",
  "cnpj": "seu-cnpj",
  "from_zipcode": "01310-100",
  "services": [".PACKAGE", ".COM"]
}
```

### 4. Loggi

**Configuração:**
```json
{
  "api_key": "sua-key",
  "from_address": {
    "lat": -23.5505,
    "lng": -46.6333
  }
}
```

## 📊 Relatórios de Frete

```sql
-- Frete médio por pedido
SELECT AVG(shipping_cost) as avg_shipping
FROM orders
WHERE tenant_id = 'xxx'
  AND created_at >= NOW() - INTERVAL '30 days';

-- Método de frete mais usado
SELECT 
  shipping_method,
  COUNT(*) as total_orders
FROM orders
WHERE tenant_id = 'xxx'
GROUP BY shipping_method
ORDER BY total_orders DESC;

-- Custo total de frete no mês
SELECT SUM(shipping_cost) as total_shipping_cost
FROM orders
WHERE tenant_id = 'xxx'
  AND created_at >= DATE_TRUNC('month', NOW());
```

## 🎯 Boas Práticas

### 1. Dimensões Padrão

Configure dimensões padrão para produtos sem medidas:
```typescript
const DEFAULT_DIMENSIONS = {
  length: 20,
  width: 20,
  height: 5,
};
```

### 2. Cache de Cotações

Sempre use cache para reduzir chamadas de API:
- Expira em 4-6 horas
- Chave: origem + destino + peso

### 3. Tratamento de Erros

```typescript
try {
  const quotes = await calculateShipping(...);
} catch (error) {
  // Fallback para frete fixo
  return [{ name: 'Frete Padrão', price: 15.00 }];
}
```

### 4. Peso Mínimo

APIs geralmente exigem peso mínimo (0.3kg):
```typescript
const weight = Math.max(calculatedWeight, 0.3);
```

## 🚀 Roadmap de Integrações

### Fase 1 (MVP) ✅
- Frete fixo
- Frete grátis
- Tabela de zonas

### Fase 2
- Melhor Envio
- Correios

### Fase 3
- Jadlog
- Loggi
- Azul Cargo

### Fase 4
- Rastreamento automático
- Geração de etiquetas
- Postagem reversa

## 🧪 Testes

```typescript
// Testar cálculo de frete
describe('Shipping Calculator', () => {
  it('should calculate fixed shipping', () => {
    const quote = calculateFixedShipping({
      fixed_price: 15.00
    }, 100);
    
    expect(quote.price).toBe(15.00);
  });

  it('should return free shipping above threshold', () => {
    const quote = calculateFreeShipping({
      free_shipping_threshold: 100.00
    }, 150);
    
    expect(quote.price).toBe(0);
  });
});
```

---

**Próximo:** Ver código completo nos arquivos do projeto!
