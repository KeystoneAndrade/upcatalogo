# 🌍 Guia de Tradução - Inglês → Português

## 📋 Tabelas

| Inglês | Português | Descrição |
|--------|-----------|-----------|
| `tenants` | `lojas` | Lojas cadastradas |
| `categories` | `categorias` | Categorias de produtos |
| `products` | `produtos` | Produtos |
| `product_variants` | `variacoes_produto` | Variações de produtos |
| `shipping_methods` | `metodos_frete` | Métodos de frete |
| `shipping_zones` | `zonas_entrega` | Zonas de entrega |
| `shipping_api_cache` | `cache_cotacoes_frete` | Cache de cotações |
| `payment_methods` | `formas_pagamento` | Formas de pagamento |
| `orders` | `pedidos` | Pedidos |

---

## 📊 Colunas - lojas (tenants)

| Inglês | Português | Tipo |
|--------|-----------|------|
| `subdomain` | `subdominio` | VARCHAR |
| `custom_domain` | `dominio_proprio` | VARCHAR |
| `name` | `nome` | VARCHAR |
| `slug` | `slug` | VARCHAR |
| `owner_id` | `proprietario_id` | UUID |
| `logo_url` | `logo_url` | TEXT |
| `primary_color` | `cor_primaria` | VARCHAR |
| `secondary_color` | `cor_secundaria` | VARCHAR |
| `whatsapp` | `whatsapp` | VARCHAR |
| `email` | `email` | VARCHAR |
| `instagram` | `instagram` | VARCHAR |
| `status` | `status` | VARCHAR |
| `plan` | `plano` | VARCHAR |
| `shipping_origin_zipcode` | `cep_origem` | VARCHAR |
| `shipping_origin_address` | `endereco_origem` | JSONB |
| `meta_title` | `titulo_seo` | VARCHAR |
| `meta_description` | `descricao_seo` | TEXT |
| `created_at` | `criado_em` | TIMESTAMPTZ |
| `updated_at` | `atualizado_em` | TIMESTAMPTZ |

**Valores de status:**
- `active` → `ativa`
- `suspended` → `suspensa`
- `cancelled` → `cancelada`

**Valores de plano:**
- `free` → `gratuito`
- `basic` → `basico`
- `pro` → `pro`
- `enterprise` → `enterprise`

---

## 📦 Colunas - produtos (products)

| Inglês | Português | Tipo |
|--------|-----------|------|
| `tenant_id` | `loja_id` | UUID |
| `category_id` | `categoria_id` | UUID |
| `name` | `nome` | VARCHAR |
| `slug` | `slug` | VARCHAR |
| `description` | `descricao` | TEXT |
| `product_type` | `tipo_produto` | VARCHAR |
| `price` | `preco` | DECIMAL |
| `compare_at_price` | `preco_promocional` | DECIMAL |
| `cost_price` | `preco_custo` | DECIMAL |
| `sku` | `codigo_sku` | VARCHAR |
| `stock_quantity` | `quantidade_estoque` | INTEGER |
| `manage_stock` | `controlar_estoque` | BOOLEAN |
| `low_stock_alert` | `alerta_estoque_baixo` | INTEGER |
| `image_url` | `imagem_url` | TEXT |
| `images` | `imagens` | JSONB |
| `tags` | `tags` | TEXT[] |
| `is_active` | `ativo` | BOOLEAN |
| `featured` | `destaque` | BOOLEAN |
| `attributes` | `atributos` | JSONB |
| `weight` | `peso` | DECIMAL |
| `length` | `comprimento` | DECIMAL |
| `width` | `largura` | DECIMAL |
| `height` | `altura` | DECIMAL |
| `meta_title` | `titulo_seo` | VARCHAR |
| `meta_description` | `descricao_seo` | TEXT |
| `display_order` | `ordem_exibicao` | INTEGER |
| `created_at` | `criado_em` | TIMESTAMPTZ |
| `updated_at` | `atualizado_em` | TIMESTAMPTZ |

**Valores de tipo_produto:**
- `simple` → `simples`
- `variable` → `variavel`

---

## 🎨 Colunas - variacoes_produto (product_variants)

| Inglês | Português | Tipo |
|--------|-----------|------|
| `product_id` | `produto_id` | UUID |
| `tenant_id` | `loja_id` | UUID |
| `attributes` | `atributos` | JSONB |
| `sku` | `codigo_sku` | VARCHAR |
| `price` | `preco` | DECIMAL |
| `compare_at_price` | `preco_promocional` | DECIMAL |
| `cost_price` | `preco_custo` | DECIMAL |
| `stock_quantity` | `quantidade_estoque` | INTEGER |
| `manage_stock` | `controlar_estoque` | BOOLEAN |
| `image_url` | `imagem_url` | TEXT |
| `weight` | `peso` | DECIMAL |
| `length` | `comprimento` | DECIMAL |
| `width` | `largura` | DECIMAL |
| `height` | `altura` | DECIMAL |
| `is_active` | `ativa` | BOOLEAN |
| `display_order` | `ordem_exibicao` | INTEGER |
| `created_at` | `criado_em` | TIMESTAMPTZ |
| `updated_at` | `atualizado_em` | TIMESTAMPTZ |

---

## 🚚 Colunas - metodos_frete (shipping_methods)

| Inglês | Português | Tipo |
|--------|-----------|------|
| `tenant_id` | `loja_id` | UUID |
| `name` | `nome` | VARCHAR |
| `description` | `descricao` | TEXT |
| `type` | `tipo` | VARCHAR |
| `fixed_price` | `preco_fixo` | DECIMAL |
| `free_shipping_threshold` | `valor_minimo_frete_gratis` | DECIMAL |
| `api_provider` | `provedor_api` | VARCHAR |
| `api_config` | `configuracao_api` | JSONB |
| `min_delivery_days` | `prazo_minimo_dias` | INTEGER |
| `max_delivery_days` | `prazo_maximo_dias` | INTEGER |
| `min_order_value` | `valor_minimo_pedido` | DECIMAL |
| `max_order_value` | `valor_maximo_pedido` | DECIMAL |
| `max_weight` | `peso_maximo` | DECIMAL |
| `is_active` | `ativo` | BOOLEAN |
| `display_order` | `ordem_exibicao` | INTEGER |
| `created_at` | `criado_em` | TIMESTAMPTZ |
| `updated_at` | `atualizado_em` | TIMESTAMPTZ |

**Valores de tipo:**
- `fixed` → `fixo`
- `free` → `gratis`
- `table` → `tabela`
- `api` → `api`

---

## 📍 Colunas - zonas_entrega (shipping_zones)

| Inglês | Português | Tipo |
|--------|-----------|------|
| `tenant_id` | `loja_id` | UUID |
| `shipping_method_id` | `metodo_frete_id` | UUID |
| `name` | `nome` | VARCHAR |
| `description` | `descricao` | TEXT |
| `states` | `estados` | TEXT[] |
| `cities` | `cidades` | TEXT[] |
| `neighborhoods` | `bairros` | TEXT[] |
| `zipcodes` | `ceps` | TEXT[] |
| `zipcode_ranges` | `faixas_cep` | JSONB |
| `price` | `preco` | DECIMAL |
| `additional_price_per_kg` | `preco_adicional_por_kg` | DECIMAL |
| `free_shipping_threshold` | `valor_minimo_frete_gratis` | DECIMAL |
| `delivery_time_min` | `prazo_minimo_dias` | INTEGER |
| `delivery_time_max` | `prazo_maximo_dias` | INTEGER |
| `is_active` | `ativa` | BOOLEAN |
| `display_order` | `ordem_exibicao` | INTEGER |
| `created_at` | `criado_em` | TIMESTAMPTZ |
| `updated_at` | `atualizado_em` | TIMESTAMPTZ |

---

## 💳 Colunas - formas_pagamento (payment_methods)

| Inglês | Português | Tipo |
|--------|-----------|------|
| `tenant_id` | `loja_id` | UUID |
| `name` | `nome` | VARCHAR |
| `type` | `tipo` | VARCHAR |
| `icon` | `icone` | VARCHAR |
| `instructions` | `instrucoes` | TEXT |
| `is_active` | `ativa` | BOOLEAN |
| `display_order` | `ordem_exibicao` | INTEGER |
| `created_at` | `criado_em` | TIMESTAMPTZ |
| `updated_at` | `atualizado_em` | TIMESTAMPTZ |

**Valores de tipo:**
- `pix` → `pix`
- `money` → `dinheiro`
- `card` → `cartao`
- `transfer` → `transferencia`
- `other` → `outro`

---

## 📦 Colunas - pedidos (orders)

| Inglês | Português | Tipo |
|--------|-----------|------|
| `tenant_id` | `loja_id` | UUID |
| `order_number` | `numero_pedido` | VARCHAR |
| `customer_name` | `nome_cliente` | VARCHAR |
| `customer_phone` | `telefone_cliente` | VARCHAR |
| `customer_email` | `email_cliente` | VARCHAR |
| `customer_document` | `documento_cliente` | VARCHAR |
| `address` | `endereco` | JSONB |
| `subtotal` | `subtotal` | DECIMAL |
| `shipping_cost` | `valor_frete` | DECIMAL |
| `discount` | `desconto` | DECIMAL |
| `total` | `total` | DECIMAL |
| `items` | `itens` | JSONB |
| `payment_method` | `forma_pagamento` | VARCHAR |
| `payment_method_type` | `tipo_pagamento` | VARCHAR |
| `shipping_method` | `metodo_entrega` | VARCHAR |
| `shipping_method_id` | `metodo_frete_id` | UUID |
| `shipping_service` | `servico_entrega` | VARCHAR |
| `shipping_tracking_code` | `codigo_rastreamento` | VARCHAR |
| `shipping_api_provider` | `provedor_frete_api` | VARCHAR |
| `shipping_api_data` | `dados_frete_api` | JSONB |
| `status` | `status` | VARCHAR |
| `customer_notes` | `observacoes_cliente` | TEXT |
| `internal_notes` | `notas_internas` | TEXT |
| `created_at` | `criado_em` | TIMESTAMPTZ |
| `updated_at` | `atualizado_em` | TIMESTAMPTZ |
| `confirmed_at` | `confirmado_em` | TIMESTAMPTZ |
| `shipped_at` | `enviado_em` | TIMESTAMPTZ |
| `delivered_at` | `entregue_em` | TIMESTAMPTZ |
| `cancelled_at` | `cancelado_em` | TIMESTAMPTZ |

**Valores de status:**
- `pending` → `pendente`
- `confirmed` → `confirmado`
- `preparing` → `preparando`
- `shipped` → `enviado`
- `delivered` → `entregue`
- `cancelled` → `cancelado`

---

## 🔧 Funções

| Inglês | Português |
|--------|-----------|
| `generate_order_number()` | `gerar_numero_pedido()` |
| `set_order_number()` | `definir_numero_pedido()` |
| `update_updated_at_column()` | `atualizar_timestamp()` |
| `clean_expired_shipping_cache()` | `limpar_cache_frete_expirado()` |

---

## 💻 Código TypeScript - Antes e Depois

### Antes (Inglês)
```typescript
const { data: product } = await supabase
  .from('products')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('is_active', true)
```

### Depois (Português)
```typescript
const { data: produto } = await supabase
  .from('produtos')
  .select('*')
  .eq('loja_id', lojaId)
  .eq('ativo', true)
```

---

### Antes (Inglês)
```typescript
interface Product {
  id: string
  tenant_id: string
  name: string
  price: number
  stock_quantity: number
  is_active: boolean
}
```

### Depois (Português)
```typescript
interface Produto {
  id: string
  loja_id: string
  nome: string
  preco: number
  quantidade_estoque: number
  ativo: boolean
}
```

---

### Antes (Inglês)
```typescript
await supabase
  .from('product_variants')
  .insert({
    product_id: productId,
    attributes: { size: 'M', color: 'Blue' },
    price: 49.90,
    stock_quantity: 10,
  })
```

### Depois (Português)
```typescript
await supabase
  .from('variacoes_produto')
  .insert({
    produto_id: produtoId,
    atributos: { tamanho: 'M', cor: 'Azul' },
    preco: 49.90,
    quantidade_estoque: 10,
  })
```

---

## 📝 Exemplos de Queries em Português

### Buscar produtos ativos
```sql
SELECT * FROM produtos 
WHERE loja_id = 'xxx' 
  AND ativo = true
ORDER BY ordem_exibicao;
```

### Buscar variações de um produto
```sql
SELECT * FROM variacoes_produto 
WHERE produto_id = 'xxx' 
  AND ativa = true;
```

### Criar pedido
```sql
INSERT INTO pedidos (
  loja_id,
  nome_cliente,
  telefone_cliente,
  endereco,
  subtotal,
  valor_frete,
  total,
  itens,
  forma_pagamento,
  metodo_entrega,
  status
) VALUES (
  'loja-uuid',
  'João Silva',
  '(11) 99999-9999',
  '{"rua": "X", "numero": "123"}'::jsonb,
  100.00,
  10.00,
  110.00,
  '[{"produto_id": "xxx", "quantidade": 1}]'::jsonb,
  'PIX',
  'Entrega',
  'pendente'
);
```

### Buscar pedidos por status
```sql
SELECT * FROM pedidos 
WHERE loja_id = 'xxx' 
  AND status = 'pendente'
ORDER BY criado_em DESC;
```

### Atualizar estoque após venda
```sql
UPDATE variacoes_produto 
SET quantidade_estoque = quantidade_estoque - 1
WHERE id = 'variacao-uuid'
  AND quantidade_estoque > 0;
```

---

## 🎨 Exemplo Completo - Componente React

### Antes (Inglês)
```typescript
interface CheckoutFormProps {
  customerName: string
  customerPhone: string
  paymentMethod: string
  shippingMethod: string
  onSubmit: () => void
}

export function CheckoutForm({
  customerName,
  customerPhone,
  paymentMethod,
  shippingMethod,
  onSubmit
}: CheckoutFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <Input
        label="Full Name"
        value={customerName}
        placeholder="Enter your name"
      />
      <Input
        label="Phone"
        value={customerPhone}
        placeholder="(00) 00000-0000"
      />
      <Select
        label="Payment Method"
        value={paymentMethod}
        options={paymentMethods}
      />
      <Button type="submit">
        Complete Order
      </Button>
    </form>
  )
}
```

### Depois (Português)
```typescript
interface FormularioCheckoutProps {
  nomeCliente: string
  telefoneCliente: string
  formaPagamento: string
  metodoEntrega: string
  aoEnviar: () => void
}

export function FormularioCheckout({
  nomeCliente,
  telefoneCliente,
  formaPagamento,
  metodoEntrega,
  aoEnviar
}: FormularioCheckoutProps) {
  return (
    <form onSubmit={aoEnviar}>
      <Input
        label="Nome Completo"
        value={nomeCliente}
        placeholder="Digite seu nome"
      />
      <Input
        label="Telefone"
        value={telefoneCliente}
        placeholder="(00) 00000-0000"
      />
      <Select
        label="Forma de Pagamento"
        value={formaPagamento}
        options={formasPagamento}
      />
      <Button type="submit">
        Finalizar Pedido
      </Button>
    </form>
  )
}
```

---

## 🔄 Migração do Código Existente

Se você já tem código em inglês, use este script de busca e substituição:

### Buscar e Substituir (VSCode)
```
tenants → lojas
products → produtos
categories → categorias
orders → pedidos
is_active → ativo
created_at → criado_em
updated_at → atualizado_em
customer_name → nome_cliente
customer_phone → telefone_cliente
stock_quantity → quantidade_estoque
```

### Regex para camelCase → snake_case PT
```javascript
// Exemplo de conversão
const conversoes = {
  'customerName': 'nome_cliente',
  'customerPhone': 'telefone_cliente',
  'paymentMethod': 'forma_pagamento',
  'shippingMethod': 'metodo_entrega',
  'isActive': 'ativo',
  'createdAt': 'criado_em',
}
```

---

## ✅ Checklist de Tradução

Ao traduzir seu código:

- [ ] Nomes de tabelas
- [ ] Nomes de colunas
- [ ] Valores de enum (status, tipo, etc)
- [ ] Nomes de funções SQL
- [ ] Comentários SQL
- [ ] Interfaces TypeScript
- [ ] Props de componentes
- [ ] Variáveis JavaScript/TypeScript
- [ ] Nomes de funções
- [ ] Mensagens de erro
- [ ] Labels de formulários
- [ ] Textos de UI

---

## 📚 Glossário Adicional

### Termos Comuns

| Inglês | Português |
|--------|-----------|
| Store | Loja |
| Product | Produto |
| Variant | Variação |
| Order | Pedido |
| Customer | Cliente |
| Checkout | Finalização |
| Cart | Carrinho |
| Shipping | Frete/Entrega |
| Payment | Pagamento |
| Active | Ativo/Ativa |
| Featured | Destaque |
| Price | Preço |
| Stock | Estoque |
| Quantity | Quantidade |
| Description | Descrição |
| Category | Categoria |
| Tag | Tag/Etiqueta |
| Status | Status/Estado |
| Created | Criado |
| Updated | Atualizado |

---

**Use este guia como referência ao desenvolver! 🇧🇷**
