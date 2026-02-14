# 🏗️ Arquitetura - Plataforma de Catálogo Digital

## 📋 Visão Geral

Sistema multi-tenant SaaS para criação de lojas/catálogos digitais com checkout via WhatsApp.

## 🎯 Stack Tecnológico

### Frontend/Backend
- **Next.js 14+** (App Router) - Framework React full-stack
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Componentes UI
- **React Hook Form + Zod** - Formulários e validação

### Backend/Database
- **Supabase**
  - PostgreSQL (database)
  - Row Level Security (RLS) para isolamento de dados
  - Auth (autenticação de lojistas)
  - Storage (imagens/logos)
  - Realtime (opcional para pedidos)

### Infraestrutura
- **Vercel**
  - Hospedagem Next.js
  - Domínios customizados
  - SSL automático (wildcard + custom)
  - Edge Functions
  - Analytics

### Integrações
- **WhatsApp Business API** (wa.me)
- **Vercel API** (gerenciamento de domínios)
- **Let's Encrypt** (SSL via Vercel)

---

## 🗄️ Modelagem do Banco de Dados

### Tabelas Principais

#### 1. `tenants` (lojas)
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subdomain VARCHAR(63) UNIQUE NOT NULL,
  custom_domain VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(63) UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Configurações
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#000000',
  secondary_color VARCHAR(7) DEFAULT '#ffffff',
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, suspended, cancelled
  plan VARCHAR(20) DEFAULT 'free', -- free, basic, pro
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT subdomain_format CHECK (subdomain ~* '^[a-z0-9-]+$'),
  CONSTRAINT slug_format CHECK (slug ~* '^[a-z0-9-]+$')
);

CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain);
CREATE INDEX idx_tenants_owner ON tenants(owner_id);
```

#### 2. `products` (produtos)
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Informações básicas
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2), -- preço "de"
  
  -- Estoque
  sku VARCHAR(100),
  stock_quantity INTEGER DEFAULT 0,
  manage_stock BOOLEAN DEFAULT false,
  
  -- Media
  image_url TEXT,
  images JSONB DEFAULT '[]', -- array de URLs
  
  -- Organização
  category VARCHAR(100),
  tags TEXT[], -- array de tags
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  
  -- Variações (JSON para flexibilidade)
  variants JSONB DEFAULT '[]',
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(tenant_id, slug),
  CONSTRAINT price_positive CHECK (price >= 0)
);

CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_slug ON products(tenant_id, slug);
CREATE INDEX idx_products_active ON products(tenant_id, is_active);
CREATE INDEX idx_products_category ON products(tenant_id, category);
```

#### 3. `orders` (pedidos)
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  
  -- Cliente
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  
  -- Endereço
  address JSONB NOT NULL, -- {street, number, complement, neighborhood, city, state, zipcode}
  
  -- Valores
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  -- Itens (desnormalizado para performance)
  items JSONB NOT NULL, -- array de {product_id, name, quantity, price, image_url}
  
  -- Pagamento e Entrega
  payment_method VARCHAR(50) NOT NULL,
  shipping_method VARCHAR(50) NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, preparing, shipped, delivered, cancelled
  
  -- Notas
  customer_notes TEXT,
  internal_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(tenant_id, status);
CREATE INDEX idx_orders_customer_phone ON orders(tenant_id, customer_phone);
CREATE INDEX idx_orders_created ON orders(tenant_id, created_at DESC);
```

#### 4. `shipping_zones` (zonas de entrega)
```sql
CREATE TABLE shipping_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  name VARCHAR(100) NOT NULL,
  cities TEXT[] NOT NULL, -- array de cidades
  neighborhoods TEXT[], -- bairros específicos (opcional)
  
  -- Valores
  price DECIMAL(10,2) NOT NULL,
  free_shipping_threshold DECIMAL(10,2), -- valor mínimo para frete grátis
  
  -- Prazo
  delivery_time_min INTEGER, -- dias mínimos
  delivery_time_max INTEGER, -- dias máximos
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shipping_zones_tenant ON shipping_zones(tenant_id);
```

#### 5. `payment_methods` (formas de pagamento)
```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- pix, money, card, transfer
  icon VARCHAR(50), -- nome do ícone
  instructions TEXT, -- instruções para o cliente
  
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_tenant ON payment_methods(tenant_id);
```

#### 6. `categories` (categorias)
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,
  
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_categories_tenant ON categories(tenant_id);
CREATE INDEX idx_categories_parent ON categories(parent_id);
```

---

## 🔒 Row Level Security (RLS)

### Políticas de Segurança

#### tenants
```sql
-- Lojistas podem ver e editar apenas sua própria loja
CREATE POLICY "Lojistas podem ver sua loja"
  ON tenants FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Lojistas podem atualizar sua loja"
  ON tenants FOR UPDATE
  USING (owner_id = auth.uid());

-- Público pode ver lojas ativas (para renderizar storefront)
CREATE POLICY "Público pode ver lojas ativas"
  ON tenants FOR SELECT
  USING (status = 'active');
```

#### products
```sql
-- Lojistas podem gerenciar produtos da sua loja
CREATE POLICY "Lojistas podem gerenciar produtos"
  ON products FOR ALL
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE owner_id = auth.uid()
  ));

-- Público pode ver produtos ativos
CREATE POLICY "Público pode ver produtos ativos"
  ON products FOR SELECT
  USING (is_active = true);
```

#### orders
```sql
-- Lojistas podem ver pedidos da sua loja
CREATE POLICY "Lojistas podem ver pedidos"
  ON orders FOR SELECT
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE owner_id = auth.uid()
  ));

-- Lojistas podem atualizar pedidos da sua loja
CREATE POLICY "Lojistas podem atualizar pedidos"
  ON orders FOR UPDATE
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE owner_id = auth.uid()
  ));

-- Clientes podem criar pedidos (sem auth)
CREATE POLICY "Clientes podem criar pedidos"
  ON orders FOR INSERT
  WITH CHECK (true);
```

---

## 🏛️ Arquitetura do Sistema

### Multi-Tenancy

**Estratégia: Subdomínio + Domínio Customizado**

```
lojista1.upcatalogo.com.br → Tenant ID via subdomain
minhalojaprópria.com.br → Tenant ID via custom_domain
```

**Middleware Next.js** identifica o tenant:
1. Extrai hostname da request
2. Busca tenant no banco (cache Redis)
3. Injeta tenant_id no contexto da aplicação
4. RLS do Supabase filtra automaticamente os dados

### Estrutura de Rotas

```
/                          → Landing page da plataforma
/auth/signup              → Cadastro de lojista
/auth/login               → Login de lojista

/dashboard                → Painel do lojista (autenticado)
  /dashboard/products     → Gerenciar produtos
  /dashboard/orders       → Gerenciar pedidos
  /dashboard/settings     → Configurações da loja
  /dashboard/shipping     → Zonas de entrega
  /dashboard/payments     → Formas de pagamento

/* (storefront)           → Loja pública do cliente
  /produtos               → Catálogo de produtos
  /produtos/[slug]        → Detalhe do produto
  /checkout               → Checkout
  /pedido/[id]            → Confirmação do pedido
```

### Fluxo de Criação de Loja

1. **Lojista se cadastra** (Supabase Auth)
2. **Sistema cria tenant** automaticamente
   - Gera subdomain único (slug baseado no nome)
   - Cria estrutura inicial (categorias, métodos padrão)
3. **Vercel provisiona SSL** para subdomain wildcard
4. **Lojista acessa dashboard** e configura loja
5. **Loja fica disponível** em `{subdomain}.upcatalogo.com.br`

### Fluxo de Pedido (Cliente)

1. **Cliente acessa loja** → vê catálogo
2. **Adiciona produtos ao carrinho** (localStorage)
3. **Vai para checkout** → preenche dados
4. **Seleciona forma de pagamento e entrega**
5. **Finaliza pedido** → salvo no banco
6. **Redirecionado para WhatsApp** com mensagem pré-formatada
7. **Lojista recebe pedido** no dashboard e no WhatsApp

---

## 🔐 Autenticação e Autorização

### Lojistas (Auth Supabase)
- Login com email/senha
- JWT Token
- RLS automático baseado em `auth.uid()`

### Clientes (Sem Auth)
- Checkout anônimo
- Dados salvos apenas no pedido
- Sem necessidade de cadastro

---

## 📦 Storage (Supabase)

### Buckets

1. **`tenant-logos`** - Logos das lojas
   - Path: `{tenant_id}/logo.{ext}`
   - Public read
   - Size limit: 2MB

2. **`product-images`** - Imagens de produtos
   - Path: `{tenant_id}/{product_id}/{filename}`
   - Public read
   - Size limit: 5MB por imagem

---

## 🌐 Domínios Customizados

### Via Vercel API

1. **Lojista adiciona domínio** no dashboard
2. **Sistema valida domínio** (DNS TXT record)
3. **Vercel API adiciona domínio** ao projeto
4. **SSL automático** via Let's Encrypt
5. **Middleware resolve** tenant via custom_domain

### DNS Setup (Lojista)
```
Tipo: CNAME
Nome: @
Valor: cname.vercel-dns.com
```

---

## 🚀 Deployment

### Ambientes

**Production**
- Vercel (auto-deploy main branch)
- Supabase Production Project
- Domínio: upcatalogo.com.br

**Staging**
- Vercel Preview
- Supabase Staging Project
- Domínio: staging.upcatalogo.com.br

### CI/CD
- Push to `main` → Deploy production (Vercel)
- Pull Request → Preview deploy (Vercel)
- Database migrations → Supabase CLI

---

## 📊 Monitoramento

- **Vercel Analytics** - Performance, Web Vitals
- **Supabase Dashboard** - Database queries, API usage
- **Sentry** (opcional) - Error tracking
- **Posthog** (opcional) - Product analytics

---

## 🎨 Design System

### Cores Base
- Primary: Configurável por lojista
- Secondary: Configurável por lojista
- Neutral: Tailwind gray scale
- Success: green-500
- Error: red-500
- Warning: yellow-500

### Componentes (shadcn/ui)
- Button, Input, Select, Textarea
- Card, Badge, Avatar
- Dialog, Sheet, Popover
- Table, Tabs, Accordion
- Toast, Alert

---

## 📱 Responsividade

- **Mobile First** - Design otimizado para mobile
- **Breakpoints Tailwind**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **PWA Ready** - Possibilidade de instalar como app

---

## ⚡ Performance

### Otimizações
- **Next.js Image** - Otimização automática de imagens
- **Server Components** - Reduz JavaScript no cliente
- **Streaming SSR** - Carregamento progressivo
- **Edge Functions** - Baixa latência
- **Database Indexes** - Queries otimizadas
- **Redis Cache** (futuro) - Cache de tenants

### Metas
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Lighthouse Score > 90

---

## 🔄 Migração WordPress → Nova Plataforma

### Estratégia

1. **Script de exportação** do WordPress
   - Exportar: produtos, pedidos, configurações
   - Formato: JSON

2. **Script de importação** para Supabase
   - Criar tenants
   - Importar produtos
   - Importar pedidos históricos
   - Preservar IDs se possível

3. **Período de convivência**
   - WordPress read-only
   - Nova plataforma em staging
   - Teste com lojistas piloto

4. **Cutover**
   - DNS switch
   - Redirects 301
   - Monitoramento intensivo

---

## 📈 Roadmap Futuro

### Fase 1 (MVP) - 6-8 semanas
- ✅ Autenticação lojistas
- ✅ CRUD produtos
- ✅ Checkout + WhatsApp
- ✅ Painel de pedidos
- ✅ Configurações básicas
- ✅ Domínios customizados

### Fase 2 - 4-6 semanas
- 🔄 Gateway de pagamento (Mercado Pago/Stripe)
- 🔄 Cupons de desconto
- 🔄 Relatórios e analytics
- 🔄 Notificações (email/push)
- 🔄 Multi-usuário por loja

### Fase 3 - 6-8 semanas
- 🔄 App mobile (React Native)
- 🔄 Integração delivery (iFood, Rappi)
- 🔄 Programa de afiliados
- 🔄 Marketplace de temas
- 🔄 API pública

---

## 💰 Estimativa de Custos (< 50 lojas)

### Infraestrutura
- **Vercel Pro**: ~$20/mês (domínios ilimitados, SSL, edge)
- **Supabase Pro**: ~$25/mês (8GB database, 100GB bandwidth, auth)
- **Domínio**: ~$15/ano (.com.br)

**Total**: ~$45-50/mês (~R$ 225-250)

### Escala (200+ lojas)
- Supabase Team: ~$599/mês
- Vercel Enterprise: ~$250/mês
- Redis Cache: ~$20/mês
- Observability: ~$50/mês

---

## 🛠️ Ferramentas de Desenvolvimento

- **VS Code** + Extensions (Prettier, ESLint, Tailwind IntelliSense)
- **Supabase CLI** - Migrations, local dev
- **Vercel CLI** - Deploy, logs
- **Postman/Insomnia** - API testing
- **GitHub** - Version control
- **Linear/Jira** - Project management

---

## 📚 Documentação Adicional

- `/docs/setup.md` - Setup do ambiente dev
- `/docs/deployment.md` - Guia de deploy
- `/docs/api.md` - Documentação da API
- `/docs/database.md` - Schemas e queries
- `/docs/components.md` - Guia de componentes UI

---

**Última atualização**: 2026-02-13
**Versão**: 1.0.0
