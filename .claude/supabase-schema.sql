-- =====================================================
-- UP CATÁLOGO - DATABASE SCHEMA
-- =====================================================
-- Supabase PostgreSQL Setup
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: tenants (lojas)
-- =====================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subdomain VARCHAR(63) UNIQUE NOT NULL,
  custom_domain VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(63) UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Configurações de aparência
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#000000',
  secondary_color VARCHAR(7) DEFAULT '#ffffff',
  
  -- Informações de contato
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  instagram VARCHAR(100),
  
  -- Status e plano
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT subdomain_format CHECK (subdomain ~* '^[a-z0-9-]+$'),
  CONSTRAINT slug_format CHECK (slug ~* '^[a-z0-9-]+$')
);

-- Índices para performance
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain);
CREATE INDEX idx_tenants_owner ON tenants(owner_id);
CREATE INDEX idx_tenants_status ON tenants(status);

-- =====================================================
-- TABELA: categories (categorias)
-- =====================================================
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
CREATE INDEX idx_categories_active ON categories(tenant_id, is_active);

-- =====================================================
-- TABELA: products (produtos)
-- =====================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  
  -- Informações básicas
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2), -- preço "de"
  cost_price DECIMAL(10,2), -- custo (opcional)
  
  -- Estoque
  sku VARCHAR(100),
  stock_quantity INTEGER DEFAULT 0,
  manage_stock BOOLEAN DEFAULT false,
  low_stock_alert INTEGER DEFAULT 5,
  
  -- Media
  image_url TEXT,
  images JSONB DEFAULT '[]', -- array de URLs: ["url1", "url2"]
  
  -- Organização
  tags TEXT[], -- array de tags: ["novo", "promoção"]
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  
  -- Variações (JSON para flexibilidade)
  -- Exemplo: [{"name": "Tamanho", "options": ["P", "M", "G"]}, {"name": "Cor", "options": ["Azul", "Vermelho"]}]
  variants JSONB DEFAULT '[]',
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  
  -- Display order
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(tenant_id, slug),
  CONSTRAINT price_positive CHECK (price >= 0),
  CONSTRAINT compare_at_price_valid CHECK (compare_at_price IS NULL OR compare_at_price > price)
);

CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_slug ON products(tenant_id, slug);
CREATE INDEX idx_products_active ON products(tenant_id, is_active);
CREATE INDEX idx_products_category ON products(tenant_id, category_id);
CREATE INDEX idx_products_featured ON products(tenant_id, featured) WHERE featured = true;
CREATE INDEX idx_products_price ON products(tenant_id, price);

-- =====================================================
-- TABELA: shipping_zones (zonas de entrega)
-- =====================================================
CREATE TABLE shipping_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Localização
  cities TEXT[] NOT NULL, -- array de cidades: ["São Paulo", "Guarulhos"]
  neighborhoods TEXT[], -- bairros específicos (opcional): ["Centro", "Jardins"]
  zipcodes TEXT[], -- CEPs específicos (opcional): ["01000-000", "02000-000"]
  
  -- Valores
  price DECIMAL(10,2) NOT NULL,
  free_shipping_threshold DECIMAL(10,2), -- valor mínimo para frete grátis
  
  -- Prazo de entrega
  delivery_time_min INTEGER, -- dias mínimos
  delivery_time_max INTEGER, -- dias máximos
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT price_positive CHECK (price >= 0),
  CONSTRAINT delivery_time_valid CHECK (
    (delivery_time_min IS NULL AND delivery_time_max IS NULL) OR
    (delivery_time_min <= delivery_time_max)
  )
);

CREATE INDEX idx_shipping_zones_tenant ON shipping_zones(tenant_id);
CREATE INDEX idx_shipping_zones_active ON shipping_zones(tenant_id, is_active);

-- =====================================================
-- TABELA: payment_methods (formas de pagamento)
-- =====================================================
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('pix', 'money', 'card', 'transfer', 'other')),
  icon VARCHAR(50), -- nome do ícone para o frontend
  instructions TEXT, -- instruções para o cliente (ex: chave PIX)
  
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_tenant ON payment_methods(tenant_id);
CREATE INDEX idx_payment_methods_active ON payment_methods(tenant_id, is_active);

-- =====================================================
-- TABELA: orders (pedidos)
-- =====================================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  
  -- Cliente
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  
  -- Endereço (JSON para flexibilidade)
  -- Exemplo: {"street": "Rua X", "number": "123", "complement": "Apto 1", "neighborhood": "Centro", "city": "São Paulo", "state": "SP", "zipcode": "01000-000"}
  address JSONB NOT NULL,
  
  -- Valores
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  -- Itens do pedido (desnormalizado para performance e histórico)
  -- Exemplo: [{"product_id": "uuid", "name": "Produto X", "quantity": 2, "price": 100.00, "image_url": "url", "variant": "P/Azul"}]
  items JSONB NOT NULL,
  
  -- Pagamento e Entrega
  payment_method VARCHAR(100) NOT NULL,
  payment_method_type VARCHAR(50),
  shipping_method VARCHAR(100) NOT NULL,
  shipping_zone_id UUID REFERENCES shipping_zones(id) ON DELETE SET NULL,
  
  -- Status do pedido
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending',      -- aguardando confirmação
    'confirmed',    -- confirmado pelo lojista
    'preparing',    -- em preparação
    'shipped',      -- enviado
    'delivered',    -- entregue
    'cancelled'     -- cancelado
  )),
  
  -- Notas
  customer_notes TEXT, -- observações do cliente
  internal_notes TEXT, -- notas internas do lojista
  
  -- Tracking
  tracking_code VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  CONSTRAINT total_positive CHECK (total >= 0),
  CONSTRAINT subtotal_positive CHECK (subtotal >= 0)
);

CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(tenant_id, status);
CREATE INDEX idx_orders_customer_phone ON orders(tenant_id, customer_phone);
CREATE INDEX idx_orders_created ON orders(tenant_id, created_at DESC);
CREATE INDEX idx_orders_date_range ON orders(tenant_id, created_at);

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para gerar order_number único
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Gera número aleatório de 8 dígitos
    new_number := LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
    
    -- Verifica se já existe
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = new_number) INTO exists_check;
    
    -- Se não existe, retorna
    IF NOT exists_check THEN
      RETURN new_number;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-gerar order_number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de updated_at em todas as tabelas
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipping_zones_updated_at BEFORE UPDATE ON shipping_zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS: tenants
-- =====================================================

-- Lojistas podem ver e editar apenas sua própria loja
CREATE POLICY "Lojistas podem ver sua loja"
  ON tenants FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Lojistas podem atualizar sua loja"
  ON tenants FOR UPDATE
  USING (owner_id = auth.uid());

-- Lojistas podem criar sua própria loja no signup
CREATE POLICY "Lojistas podem criar loja"
  ON tenants FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Público pode ver lojas ativas (para renderizar storefront)
CREATE POLICY "Público pode ver lojas ativas"
  ON tenants FOR SELECT
  USING (status = 'active');

-- =====================================================
-- POLÍTICAS RLS: categories
-- =====================================================

-- Lojistas podem gerenciar categorias da sua loja
CREATE POLICY "Lojistas podem gerenciar categorias"
  ON categories FOR ALL
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE owner_id = auth.uid()
  ));

-- Público pode ver categorias ativas
CREATE POLICY "Público pode ver categorias ativas"
  ON categories FOR SELECT
  USING (is_active = true);

-- =====================================================
-- POLÍTICAS RLS: products
-- =====================================================

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

-- =====================================================
-- POLÍTICAS RLS: shipping_zones
-- =====================================================

-- Lojistas podem gerenciar zonas de entrega da sua loja
CREATE POLICY "Lojistas podem gerenciar zonas de entrega"
  ON shipping_zones FOR ALL
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE owner_id = auth.uid()
  ));

-- Público pode ver zonas ativas (para calcular frete)
CREATE POLICY "Público pode ver zonas ativas"
  ON shipping_zones FOR SELECT
  USING (is_active = true);

-- =====================================================
-- POLÍTICAS RLS: payment_methods
-- =====================================================

-- Lojistas podem gerenciar formas de pagamento da sua loja
CREATE POLICY "Lojistas podem gerenciar formas de pagamento"
  ON payment_methods FOR ALL
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE owner_id = auth.uid()
  ));

-- Público pode ver formas de pagamento ativas
CREATE POLICY "Público pode ver formas de pagamento ativas"
  ON payment_methods FOR SELECT
  USING (is_active = true);

-- =====================================================
-- POLÍTICAS RLS: orders
-- =====================================================

-- Lojistas podem ver e editar pedidos da sua loja
CREATE POLICY "Lojistas podem ver pedidos"
  ON orders FOR SELECT
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE owner_id = auth.uid()
  ));

CREATE POLICY "Lojistas podem atualizar pedidos"
  ON orders FOR UPDATE
  USING (tenant_id IN (
    SELECT id FROM tenants WHERE owner_id = auth.uid()
  ));

-- Clientes podem criar pedidos (sem autenticação)
CREATE POLICY "Clientes podem criar pedidos"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Público pode ver seus próprios pedidos (opcional, para página de rastreamento)
-- Descomentear se quiser permitir que clientes vejam pedidos sem auth
-- CREATE POLICY "Público pode ver pedido específico"
--   ON orders FOR SELECT
--   USING (true); -- Implementar lógica de token único por pedido

-- =====================================================
-- DADOS INICIAIS (SEED)
-- =====================================================

-- Criar dados de exemplo para desenvolvimento
-- Descomentar apenas em ambiente de desenvolvimento

-- INSERT INTO tenants (subdomain, name, slug, owner_id, whatsapp, primary_color) VALUES
-- ('demo', 'Loja Demo', 'demo', (SELECT id FROM auth.users LIMIT 1), '5511999999999', '#FF6B6B');

-- INSERT INTO payment_methods (tenant_id, name, type, display_order) VALUES
-- ((SELECT id FROM tenants WHERE subdomain = 'demo'), 'PIX', 'pix', 1),
-- ((SELECT id FROM tenants WHERE subdomain = 'demo'), 'Dinheiro', 'money', 2),
-- ((SELECT id FROM tenants WHERE subdomain = 'demo'), 'Cartão na entrega', 'card', 3);

-- INSERT INTO shipping_zones (tenant_id, name, cities, price, delivery_time_min, delivery_time_max) VALUES
-- ((SELECT id FROM tenants WHERE subdomain = 'demo'), 'Centro', ARRAY['São Paulo'], 10.00, 1, 2),
-- ((SELECT id FROM tenants WHERE subdomain = 'demo'), 'Zona Sul', ARRAY['São Paulo'], 15.00, 2, 3);

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- Depois configure o Storage para os buckets:
-- - tenant-logos (public)
-- - product-images (public)
-- =====================================================
