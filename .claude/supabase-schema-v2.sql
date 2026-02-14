-- =====================================================
-- UP CATÁLOGO - DATABASE SCHEMA v2
-- =====================================================
-- Com suporte completo a:
-- - Variações de produtos (tipo WooCommerce)
-- - Sistema de frete preparado para APIs externas
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
  
  -- Configurações de frete
  shipping_origin_zipcode VARCHAR(9), -- CEP de origem para cálculo
  shipping_origin_address JSONB, -- Endereço completo de origem
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT subdomain_format CHECK (subdomain ~* '^[a-z0-9-]+$'),
  CONSTRAINT slug_format CHECK (slug ~* '^[a-z0-9-]+$')
);

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
-- TABELA: products (produtos principais)
-- =====================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  
  -- Informações básicas
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Tipo de produto
  product_type VARCHAR(20) DEFAULT 'simple' CHECK (product_type IN ('simple', 'variable')),
  -- simple = produto simples (sem variações)
  -- variable = produto com variações (tamanho, cor, etc)
  
  -- Pricing (para produtos simples ou preço base para variáveis)
  price DECIMAL(10,2),
  compare_at_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  
  -- Estoque (para produtos simples)
  sku VARCHAR(100),
  stock_quantity INTEGER DEFAULT 0,
  manage_stock BOOLEAN DEFAULT false,
  low_stock_alert INTEGER DEFAULT 5,
  
  -- Media
  image_url TEXT,
  images JSONB DEFAULT '[]',
  
  -- Organização
  tags TEXT[],
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  
  -- Atributos de variação (para produtos variáveis)
  -- Exemplo: [{"name": "Tamanho", "slug": "tamanho", "options": ["P", "M", "G"]}, {"name": "Cor", "slug": "cor", "options": ["Azul", "Vermelho"]}]
  attributes JSONB DEFAULT '[]',
  
  -- Dimensões e peso (para cálculo de frete)
  weight DECIMAL(10,2), -- em kg
  length DECIMAL(10,2), -- em cm
  width DECIMAL(10,2), -- em cm
  height DECIMAL(10,2), -- em cm
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, slug),
  CONSTRAINT price_positive CHECK (price IS NULL OR price >= 0),
  CONSTRAINT compare_at_price_valid CHECK (compare_at_price IS NULL OR compare_at_price > price)
);

CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_slug ON products(tenant_id, slug);
CREATE INDEX idx_products_active ON products(tenant_id, is_active);
CREATE INDEX idx_products_category ON products(tenant_id, category_id);
CREATE INDEX idx_products_featured ON products(tenant_id, featured) WHERE featured = true;
CREATE INDEX idx_products_type ON products(tenant_id, product_type);

-- =====================================================
-- TABELA: product_variants (variações de produtos)
-- =====================================================
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Atributos desta variação
  -- Exemplo: {"tamanho": "M", "cor": "Azul"}
  attributes JSONB NOT NULL,
  
  -- Identificação
  sku VARCHAR(100),
  
  -- Pricing específico da variação
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  
  -- Estoque específico da variação
  stock_quantity INTEGER DEFAULT 0,
  manage_stock BOOLEAN DEFAULT true,
  
  -- Imagem específica da variação (opcional)
  image_url TEXT,
  
  -- Dimensões específicas (opcional, senão usa do produto pai)
  weight DECIMAL(10,2),
  length DECIMAL(10,2),
  width DECIMAL(10,2),
  height DECIMAL(10,2),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Para ordenação de variações
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT price_positive CHECK (price >= 0),
  UNIQUE(product_id, attributes) -- Evita variações duplicadas
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_tenant ON product_variants(tenant_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);
CREATE INDEX idx_variants_active ON product_variants(is_active);
CREATE INDEX idx_variants_attributes ON product_variants USING GIN (attributes);

-- =====================================================
-- TABELA: shipping_methods (métodos de frete)
-- =====================================================
CREATE TABLE shipping_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Tipo de método
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'fixed', -- Valor fixo
    'free', -- Grátis
    'table', -- Tabela de preços (por zona)
    'api' -- API externa (Melhor Envio, Correios, etc)
  )),
  
  -- Para tipo 'fixed'
  fixed_price DECIMAL(10,2),
  
  -- Para tipo 'free'
  free_shipping_threshold DECIMAL(10,2), -- Valor mínimo para frete grátis
  
  -- Para tipo 'api'
  api_provider VARCHAR(50), -- 'melhor_envio', 'correios', 'jadlog', etc
  api_config JSONB, -- Configurações específicas da API
  -- Exemplo para Melhor Envio: {"token": "xxx", "services": ["SEDEX", "PAC"]}
  
  -- Configurações gerais
  min_delivery_days INTEGER,
  max_delivery_days INTEGER,
  
  -- Restrições
  min_order_value DECIMAL(10,2), -- Valor mínimo do pedido
  max_order_value DECIMAL(10,2), -- Valor máximo do pedido
  max_weight DECIMAL(10,2), -- Peso máximo em kg
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shipping_methods_tenant ON shipping_methods(tenant_id);
CREATE INDEX idx_shipping_methods_type ON shipping_methods(tenant_id, type);
CREATE INDEX idx_shipping_methods_active ON shipping_methods(tenant_id, is_active);

-- =====================================================
-- TABELA: shipping_zones (zonas de entrega)
-- =====================================================
-- Usada para métodos tipo 'table'
CREATE TABLE shipping_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  shipping_method_id UUID REFERENCES shipping_methods(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Localização
  states TEXT[], -- Estados: ["SP", "RJ"]
  cities TEXT[], -- Cidades: ["São Paulo", "Guarulhos"]
  neighborhoods TEXT[], -- Bairros específicos
  zipcodes TEXT[], -- CEPs específicos
  zipcode_ranges JSONB, -- Ranges de CEP: [{"start": "01000-000", "end": "01999-999"}]
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  additional_price_per_kg DECIMAL(10,2) DEFAULT 0, -- Taxa adicional por kg
  free_shipping_threshold DECIMAL(10,2),
  
  -- Prazo
  delivery_time_min INTEGER,
  delivery_time_max INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT price_positive CHECK (price >= 0)
);

CREATE INDEX idx_shipping_zones_tenant ON shipping_zones(tenant_id);
CREATE INDEX idx_shipping_zones_method ON shipping_zones(shipping_method_id);
CREATE INDEX idx_shipping_zones_active ON shipping_zones(tenant_id, is_active);

-- =====================================================
-- TABELA: shipping_api_cache (cache de cotações)
-- =====================================================
-- Cache de cotações de APIs de frete para performance
CREATE TABLE shipping_api_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  -- Chave de cache (hash dos parâmetros)
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  
  -- Parâmetros da cotação
  api_provider VARCHAR(50) NOT NULL,
  origin_zipcode VARCHAR(9) NOT NULL,
  destination_zipcode VARCHAR(9) NOT NULL,
  weight DECIMAL(10,2) NOT NULL,
  dimensions JSONB, -- {length, width, height}
  
  -- Resultado da cotação
  services JSONB NOT NULL, -- Array de serviços disponíveis com preços
  -- Exemplo: [{"service": "SEDEX", "price": 25.00, "delivery_time": 2}, {"service": "PAC", "price": 15.00, "delivery_time": 5}]
  
  -- Metadata
  expires_at TIMESTAMPTZ NOT NULL, -- Cache expira em X horas
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shipping_cache_key ON shipping_api_cache(cache_key);
CREATE INDEX idx_shipping_cache_tenant ON shipping_api_cache(tenant_id);
CREATE INDEX idx_shipping_cache_expires ON shipping_api_cache(expires_at);

-- Limpar cache expirado automaticamente
CREATE OR REPLACE FUNCTION clean_expired_shipping_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM shipping_api_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABELA: payment_methods (formas de pagamento)
-- =====================================================
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('pix', 'money', 'card', 'transfer', 'other')),
  icon VARCHAR(50),
  instructions TEXT,
  
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
  customer_document VARCHAR(20), -- CPF/CNPJ
  
  -- Endereço
  address JSONB NOT NULL,
  
  -- Valores
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  -- Itens do pedido
  items JSONB NOT NULL,
  -- Exemplo: [{"product_id": "uuid", "variant_id": "uuid", "name": "Produto X", "variant_name": "M/Azul", "quantity": 2, "price": 100.00, "image_url": "url"}]
  
  -- Pagamento
  payment_method VARCHAR(100) NOT NULL,
  payment_method_type VARCHAR(50),
  
  -- Entrega
  shipping_method VARCHAR(100) NOT NULL,
  shipping_method_id UUID REFERENCES shipping_methods(id) ON DELETE SET NULL,
  shipping_service VARCHAR(100), -- Nome do serviço (SEDEX, PAC, etc)
  shipping_tracking_code VARCHAR(100),
  
  -- Frete calculado por API
  shipping_api_provider VARCHAR(50), -- Se veio de API
  shipping_api_data JSONB, -- Dados da cotação da API
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending',
    'confirmed',
    'preparing',
    'shipped',
    'delivered',
    'cancelled'
  )),
  
  -- Notas
  customer_notes TEXT,
  internal_notes TEXT,
  
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
    new_number := LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = new_number) INTO exists_check;
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

-- Aplicar trigger de updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variants_updated_at BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipping_methods_updated_at BEFORE UPDATE ON shipping_methods
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

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_api_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: tenants
CREATE POLICY "Lojistas podem ver sua loja" ON tenants FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Lojistas podem atualizar sua loja" ON tenants FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Lojistas podem criar loja" ON tenants FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Público pode ver lojas ativas" ON tenants FOR SELECT USING (status = 'active');

-- Políticas RLS: categories
CREATE POLICY "Lojistas podem gerenciar categorias" ON categories FOR ALL
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Público pode ver categorias ativas" ON categories FOR SELECT USING (is_active = true);

-- Políticas RLS: products
CREATE POLICY "Lojistas podem gerenciar produtos" ON products FOR ALL
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Público pode ver produtos ativos" ON products FOR SELECT USING (is_active = true);

-- Políticas RLS: product_variants
CREATE POLICY "Lojistas podem gerenciar variações" ON product_variants FOR ALL
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Público pode ver variações ativas" ON product_variants FOR SELECT USING (is_active = true);

-- Políticas RLS: shipping_methods
CREATE POLICY "Lojistas podem gerenciar métodos de frete" ON shipping_methods FOR ALL
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Público pode ver métodos ativos" ON shipping_methods FOR SELECT USING (is_active = true);

-- Políticas RLS: shipping_zones
CREATE POLICY "Lojistas podem gerenciar zonas" ON shipping_zones FOR ALL
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Público pode ver zonas ativas" ON shipping_zones FOR SELECT USING (is_active = true);

-- Políticas RLS: shipping_api_cache
CREATE POLICY "Lojistas podem gerenciar cache" ON shipping_api_cache FOR ALL
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Público pode ler cache" ON shipping_api_cache FOR SELECT USING (true);

-- Políticas RLS: payment_methods
CREATE POLICY "Lojistas podem gerenciar formas de pagamento" ON payment_methods FOR ALL
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Público pode ver formas ativas" ON payment_methods FOR SELECT USING (is_active = true);

-- Políticas RLS: orders
CREATE POLICY "Lojistas podem ver pedidos" ON orders FOR SELECT
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Lojistas podem atualizar pedidos" ON orders FOR UPDATE
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Clientes podem criar pedidos" ON orders FOR INSERT WITH CHECK (true);

-- =====================================================
-- FIM DO SCHEMA v2
-- =====================================================
