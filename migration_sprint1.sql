-- =====================================================
-- MIGRATION SPRINT 1 - NORMALIZAÇÃO DE TABELAS (Variantes e Itens do Pedido)
-- =====================================================

-- 1. Criação da tabela produtos_variacoes
CREATE TABLE produtos_variacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE NOT NULL,
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  compare_at_price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  manage_stock BOOLEAN DEFAULT false,
  image_url TEXT,
  attributes JSONB DEFAULT '[]', -- Armazena a cor, tamanho, etc, ex: [{"name": "Cor", "value": "Azul"}, {"name": "Tamanho", "value": "M"}]
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT price_positive CHECK (price >= 0)
);

CREATE INDEX idx_produtos_variacoes_produto ON produtos_variacoes(produto_id);
CREATE INDEX idx_produtos_variacoes_loja ON produtos_variacoes(loja_id);

-- 2. Criação da tabela pedido_itens
CREATE TABLE pedido_itens (
  id UUID PRIMARY KEY DEFAULT builtin.gen_random_uuid(),
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE NOT NULL,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE NOT NULL,
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL, -- SET NULL para preservar histórico da compra se produto for excluído
  variacao_id UUID REFERENCES produtos_variacoes(id) ON DELETE SET NULL, -- Idem
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  price_at_purchase DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  attributes JSONB DEFAULT '[]', -- Salvar os atributos escolhidos na hora da compra para relatórios
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT subtotal_positive CHECK (subtotal >= 0)
);

CREATE INDEX idx_pedido_itens_pedido ON pedido_itens(pedido_id);
CREATE INDEX idx_pedido_itens_loja ON pedido_itens(loja_id);
CREATE INDEX idx_pedido_itens_produto ON pedido_itens(produto_id);

-- 3. Triggers para updated_at atualizações
CREATE TRIGGER update_produtos_variacoes_updated_at BEFORE UPDATE ON produtos_variacoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedido_itens_updated_at BEFORE UPDATE ON pedido_itens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS e Políticas de Segurança
ALTER TABLE produtos_variacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;

-- Políticas para produtos_variacoes
CREATE POLICY "Lojistas podem gerenciar variacoes de produtos" ON produtos_variacoes FOR ALL
  USING (loja_id IN (SELECT id FROM lojas WHERE proprietario_id = auth.uid()));
CREATE POLICY "Publico pode ver variacoes ativas" ON produtos_variacoes FOR SELECT USING (is_active = true);

-- Políticas para pedido_itens
CREATE POLICY "Lojistas podem ver itens do pedido" ON pedido_itens FOR SELECT
  USING (loja_id IN (SELECT id FROM lojas WHERE proprietario_id = auth.uid()));
CREATE POLICY "Lojistas podem atualizar itens do pedido" ON pedido_itens FOR UPDATE
  USING (loja_id IN (SELECT id FROM lojas WHERE proprietario_id = auth.uid()));
CREATE POLICY "Clientes podem criar itens do pedido" ON pedido_itens FOR INSERT WITH CHECK (true);

-- 5. Data Migration (Opcional, mas útil. Convertendo JSONB em Linhas Existentes)
-- MIGRAR VARIANTES ANTIGAS (Isso quebra o JSON `variants` e gera rows)
INSERT INTO produtos_variacoes (id, loja_id, produto_id, name, sku, price, compare_at_price, stock_quantity, manage_stock, image_url, attributes, is_active, display_order)
SELECT
  -- Tenta usar uuid do json se existir, senao gera um UUID derivado (MD5 convert a uuid, trick de postgres) para nao quebrar em multiplas rodadas
  COALESCE(
    CAST(NULLIF((v.variant->>'id'), '') AS UUID),
    uuid_generate_v4()
  ), 
  p.loja_id,
  p.id,
  COALESCE(v.variant->>'name', p.name),
  v.variant->>'sku',
  CAST(COALESCE(v.variant->>'price', p.price::text) AS DECIMAL(10,2)),
  CAST(NULLIF(v.variant->>'compare_at_price', '') AS DECIMAL(10,2)),
  CAST(COALESCE(v.variant->>'stock_quantity', '0') AS INTEGER),
  CAST(COALESCE(v.variant->>'manage_stock', 'false') AS BOOLEAN),
  v.variant->>'image_url',
  -- Tratar options
  CASE 
    WHEN v.variant->>'options' IS NOT NULL THEN (v.variant->>'options')::jsonb 
    ELSE '[]'::jsonb 
  END,
  CAST(COALESCE(v.variant->>'is_active', 'true') AS BOOLEAN),
  (v.ordinality - 1)
FROM produtos p
CROSS JOIN LATERAL jsonb_array_elements(
  CASE 
    WHEN jsonb_typeof(p.variants->'items') = 'array' THEN p.variants->'items' 
    -- handle other variants schemas here if any ... (fallback)
    ELSE '[]'::jsonb
  END
) WITH ORDINALITY AS v(variant)
WHERE p.variants IS NOT NULL AND p.variants->'items' IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- MIGRAR ITENS DE PEDIDO
-- Essa conversão exige mapear a estrutura atual do orders.items. Sabemos geralmente que é um ARRAY de JSON.
INSERT INTO pedido_itens (loja_id, pedido_id, produto_id, variacao_id, name, sku, price_at_purchase, quantity, subtotal, image_url, attributes)
SELECT
  pe.loja_id,
  pe.id,
  CAST(NULLIF(i.item->>'product_id', '') AS UUID),
  CAST(NULLIF(i.item->>'variant_id', '') AS UUID),
  COALESCE(i.item->>'name', 'Produto'),
  i.item->>'sku',
  CAST(COALESCE(i.item->>'price', '0') AS DECIMAL(10,2)),
  CAST(COALESCE(i.item->>'quantity', '1') AS INTEGER),
  CAST(COALESCE(i.item->>'subtotal', COALESCE(i.item->>'price', '0')) AS DECIMAL(10,2)) * CAST(COALESCE(i.item->>'quantity', '1') AS INTEGER),
  i.item->>'image_url',
  -- Armazenar as options (atributos textuais escolhidos)
  CASE 
    WHEN i.item->>'options' IS NOT NULL THEN (i.item->>'options')::jsonb 
    ELSE '[]'::jsonb 
  END
FROM pedidos pe
CROSS JOIN LATERAL jsonb_array_elements(
  CASE 
    WHEN jsonb_typeof(pe.items) = 'array' THEN pe.items
    ELSE '[]'::jsonb
  END
) AS i(item);
