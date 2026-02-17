-- =====================================================
-- UP CATALOGO - DATABASE SCHEMA
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABELA: tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subdomain VARCHAR(63) UNIQUE NOT NULL,
  custom_domain VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(63) UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#000000',
  secondary_color VARCHAR(7) DEFAULT '#ffffff',
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  instagram VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
  meta_title VARCHAR(255),
  meta_description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT subdomain_format CHECK (subdomain ~* '^[a-z0-9-]+$'),
  CONSTRAINT slug_format CHECK (slug ~* '^[a-z0-9-]+$')
);

CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain);
CREATE INDEX idx_tenants_owner ON tenants(owner_id);
CREATE INDEX idx_tenants_status ON tenants(status);

-- TABELA: categories
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

-- TABELA: products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  sku VARCHAR(100),
  stock_quantity INTEGER DEFAULT 0,
  manage_stock BOOLEAN DEFAULT false,
  low_stock_alert INTEGER DEFAULT 5,
  image_url TEXT,
  images JSONB DEFAULT '[]',
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  variants JSONB DEFAULT '[]',
  meta_title VARCHAR(255),
  meta_description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
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

-- TABELA: shipping_zones
CREATE TABLE shipping_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  cities TEXT[] NOT NULL,
  neighborhoods TEXT[],
  zipcodes TEXT[],
  price DECIMAL(10,2) NOT NULL,
  free_shipping_threshold DECIMAL(10,2),
  delivery_time_min INTEGER,
  delivery_time_max INTEGER,
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

-- TABELA: payment_methods
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

-- TABELA: orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  address JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  items JSONB NOT NULL,
  payment_method VARCHAR(100) NOT NULL,
  payment_method_type VARCHAR(50),
  shipping_method VARCHAR(100) NOT NULL,
  shipping_zone_id UUID REFERENCES shipping_zones(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'
  )),
  customer_notes TEXT,
  internal_notes TEXT,
  tracking_code VARCHAR(100),
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

-- TABELA: banners
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_banners_tenant ON banners(tenant_id);
CREATE INDEX idx_banners_active ON banners(tenant_id, is_active);

-- FUNCOES AUXILIARES

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

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ROW LEVEL SECURITY
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- POLITICAS: tenants
CREATE POLICY "Lojistas podem ver sua loja" ON tenants FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Lojistas podem atualizar sua loja" ON tenants FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Lojistas podem criar loja" ON tenants FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Publico pode ver lojas ativas" ON tenants FOR SELECT USING (status = 'active');

-- POLITICAS: categories
CREATE POLICY "Lojistas podem gerenciar categorias" ON categories FOR ALL
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Publico pode ver categorias ativas" ON categories FOR SELECT USING (is_active = true);

-- POLITICAS: products
CREATE POLICY "Lojistas podem gerenciar produtos" ON products FOR ALL
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Publico pode ver produtos ativos" ON products FOR SELECT USING (is_active = true);

-- POLITICAS: shipping_zones
CREATE POLICY "Lojistas podem gerenciar zonas" ON shipping_zones FOR ALL
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Publico pode ver zonas ativas" ON shipping_zones FOR SELECT USING (is_active = true);

-- POLITICAS: payment_methods
CREATE POLICY "Lojistas podem gerenciar pagamentos" ON payment_methods FOR ALL
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Publico pode ver pagamentos ativos" ON payment_methods FOR SELECT USING (is_active = true);

-- POLITICAS: orders
CREATE POLICY "Lojistas podem ver pedidos" ON orders FOR SELECT
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Lojistas podem atualizar pedidos" ON orders FOR UPDATE
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Clientes podem criar pedidos" ON orders FOR INSERT WITH CHECK (true);

-- POLITICAS: banners
CREATE POLICY "Lojistas podem gerenciar banners" ON banners FOR ALL
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
CREATE POLICY "Publico pode ver banners ativos" ON banners FOR SELECT USING (is_active = true);
