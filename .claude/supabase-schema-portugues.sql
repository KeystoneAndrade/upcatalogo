-- =====================================================
-- UP CATÁLOGO - SCHEMA DO BANCO DE DADOS
-- =====================================================
-- Versão em Português Brasileiro
-- Todas as tabelas, colunas e comentários em PT-BR
-- =====================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: lojas (tenants)
-- =====================================================
CREATE TABLE lojas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subdominio VARCHAR(63) UNIQUE NOT NULL,
  dominio_proprio VARCHAR(255) UNIQUE,
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(63) UNIQUE NOT NULL,
  proprietario_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Configurações de aparência
  logo_url TEXT,
  cor_primaria VARCHAR(7) DEFAULT '#000000',
  cor_secundaria VARCHAR(7) DEFAULT '#ffffff',
  
  -- Informações de contato
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  instagram VARCHAR(100),
  
  -- Status e plano
  status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'suspensa', 'cancelada')),
  plano VARCHAR(20) DEFAULT 'gratuito' CHECK (plano IN ('gratuito', 'basico', 'pro', 'enterprise')),
  
  -- Configurações de frete
  cep_origem VARCHAR(9), -- CEP de origem para cálculo
  endereco_origem JSONB, -- Endereço completo de origem
  
  -- SEO
  titulo_seo VARCHAR(255),
  descricao_seo TEXT,
  
  -- Timestamps
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT subdominio_formato CHECK (subdominio ~* '^[a-z0-9-]+$'),
  CONSTRAINT slug_formato CHECK (slug ~* '^[a-z0-9-]+$')
);

-- Comentários da tabela
COMMENT ON TABLE lojas IS 'Lojas cadastradas na plataforma (multi-tenancy)';
COMMENT ON COLUMN lojas.subdominio IS 'Subdomínio da loja (ex: minhaloja.upcatalogo.com.br)';
COMMENT ON COLUMN lojas.dominio_proprio IS 'Domínio personalizado (ex: minhaloja.com.br)';
COMMENT ON COLUMN lojas.cep_origem IS 'CEP de origem para cálculo de frete';

-- Índices para performance
CREATE INDEX idx_lojas_subdominio ON lojas(subdominio);
CREATE INDEX idx_lojas_dominio_proprio ON lojas(dominio_proprio);
CREATE INDEX idx_lojas_proprietario ON lojas(proprietario_id);
CREATE INDEX idx_lojas_status ON lojas(status);

-- =====================================================
-- TABELA: categorias
-- =====================================================
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE NOT NULL,
  
  nome VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  descricao TEXT,
  imagem_url TEXT,
  
  categoria_pai_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  ordem_exibicao INTEGER DEFAULT 0,
  ativa BOOLEAN DEFAULT true,
  
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(loja_id, slug)
);

COMMENT ON TABLE categorias IS 'Categorias de produtos';
COMMENT ON COLUMN categorias.categoria_pai_id IS 'Categoria pai (para subcategorias)';

CREATE INDEX idx_categorias_loja ON categorias(loja_id);
CREATE INDEX idx_categorias_pai ON categorias(categoria_pai_id);
CREATE INDEX idx_categorias_ativa ON categorias(loja_id, ativa);

-- =====================================================
-- TABELA: produtos
-- =====================================================
CREATE TABLE produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE NOT NULL,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  
  -- Informações básicas
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  descricao TEXT,
  
  -- Tipo de produto
  tipo_produto VARCHAR(20) DEFAULT 'simples' CHECK (tipo_produto IN ('simples', 'variavel')),
  -- simples = produto sem variações
  -- variavel = produto com variações (tamanho, cor, etc)
  
  -- Preço (para produtos simples ou preço base para variáveis)
  preco DECIMAL(10,2),
  preco_promocional DECIMAL(10,2),
  preco_custo DECIMAL(10,2),
  
  -- Estoque (para produtos simples)
  codigo_sku VARCHAR(100),
  quantidade_estoque INTEGER DEFAULT 0,
  controlar_estoque BOOLEAN DEFAULT false,
  alerta_estoque_baixo INTEGER DEFAULT 5,
  
  -- Mídia
  imagem_url TEXT,
  imagens JSONB DEFAULT '[]',
  
  -- Organização
  tags TEXT[],
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  destaque BOOLEAN DEFAULT false,
  
  -- Atributos de variação (para produtos variáveis)
  -- Exemplo: [{"nome": "Tamanho", "slug": "tamanho", "opcoes": ["P", "M", "G"]}, {"nome": "Cor", "slug": "cor", "opcoes": ["Azul", "Vermelho"]}]
  atributos JSONB DEFAULT '[]',
  
  -- Dimensões e peso (para cálculo de frete)
  peso DECIMAL(10,2), -- em kg
  comprimento DECIMAL(10,2), -- em cm
  largura DECIMAL(10,2), -- em cm
  altura DECIMAL(10,2), -- em cm
  
  -- SEO
  titulo_seo VARCHAR(255),
  descricao_seo TEXT,
  
  ordem_exibicao INTEGER DEFAULT 0,
  
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(loja_id, slug),
  CONSTRAINT preco_positivo CHECK (preco IS NULL OR preco >= 0),
  CONSTRAINT preco_promocional_valido CHECK (preco_promocional IS NULL OR preco_promocional < preco)
);

COMMENT ON TABLE produtos IS 'Produtos cadastrados (simples ou variáveis)';
COMMENT ON COLUMN produtos.tipo_produto IS 'Tipo: simples (sem variações) ou variavel (com variações)';
COMMENT ON COLUMN produtos.atributos IS 'Atributos de variação em JSON (apenas para produtos variáveis)';

CREATE INDEX idx_produtos_loja ON produtos(loja_id);
CREATE INDEX idx_produtos_slug ON produtos(loja_id, slug);
CREATE INDEX idx_produtos_ativo ON produtos(loja_id, ativo);
CREATE INDEX idx_produtos_categoria ON produtos(loja_id, categoria_id);
CREATE INDEX idx_produtos_destaque ON produtos(loja_id, destaque) WHERE destaque = true;
CREATE INDEX idx_produtos_tipo ON produtos(loja_id, tipo_produto);

-- =====================================================
-- TABELA: variacoes_produto (product_variants)
-- =====================================================
CREATE TABLE variacoes_produto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE NOT NULL,
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE NOT NULL,
  
  -- Atributos desta variação
  -- Exemplo: {"tamanho": "M", "cor": "Azul"}
  atributos JSONB NOT NULL,
  
  -- Identificação
  codigo_sku VARCHAR(100),
  
  -- Preço específico da variação
  preco DECIMAL(10,2) NOT NULL,
  preco_promocional DECIMAL(10,2),
  preco_custo DECIMAL(10,2),
  
  -- Estoque específico da variação
  quantidade_estoque INTEGER DEFAULT 0,
  controlar_estoque BOOLEAN DEFAULT true,
  
  -- Imagem específica da variação (opcional)
  imagem_url TEXT,
  
  -- Dimensões específicas (opcional, senão usa do produto pai)
  peso DECIMAL(10,2),
  comprimento DECIMAL(10,2),
  largura DECIMAL(10,2),
  altura DECIMAL(10,2),
  
  -- Status
  ativa BOOLEAN DEFAULT true,
  
  -- Para ordenação de variações
  ordem_exibicao INTEGER DEFAULT 0,
  
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT preco_positivo CHECK (preco >= 0),
  UNIQUE(produto_id, atributos) -- Evita variações duplicadas
);

COMMENT ON TABLE variacoes_produto IS 'Variações de produtos variáveis (tamanho, cor, etc)';
COMMENT ON COLUMN variacoes_produto.atributos IS 'Combinação de atributos desta variação em JSON';

CREATE INDEX idx_variacoes_produto ON variacoes_produto(produto_id);
CREATE INDEX idx_variacoes_loja ON variacoes_produto(loja_id);
CREATE INDEX idx_variacoes_sku ON variacoes_produto(codigo_sku);
CREATE INDEX idx_variacoes_ativa ON variacoes_produto(ativa);
CREATE INDEX idx_variacoes_atributos ON variacoes_produto USING GIN (atributos);

-- =====================================================
-- TABELA: metodos_frete (shipping_methods)
-- =====================================================
CREATE TABLE metodos_frete (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE NOT NULL,
  
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  
  -- Tipo de método
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
    'fixo',      -- Valor fixo
    'gratis',    -- Grátis
    'tabela',    -- Tabela de preços (por zona)
    'api'        -- API externa (Melhor Envio, Correios, etc)
  )),
  
  -- Para tipo 'fixo'
  preco_fixo DECIMAL(10,2),
  
  -- Para tipo 'gratis'
  valor_minimo_frete_gratis DECIMAL(10,2), -- Valor mínimo para frete grátis
  
  -- Para tipo 'api'
  provedor_api VARCHAR(50), -- 'melhor_envio', 'correios', 'jadlog', etc
  configuracao_api JSONB, -- Configurações específicas da API
  -- Exemplo para Melhor Envio: {"token": "xxx", "servicos": ["SEDEX", "PAC"]}
  
  -- Configurações gerais
  prazo_minimo_dias INTEGER,
  prazo_maximo_dias INTEGER,
  
  -- Restrições
  valor_minimo_pedido DECIMAL(10,2), -- Valor mínimo do pedido
  valor_maximo_pedido DECIMAL(10,2), -- Valor máximo do pedido
  peso_maximo DECIMAL(10,2), -- Peso máximo em kg
  
  -- Status
  ativo BOOLEAN DEFAULT true,
  ordem_exibicao INTEGER DEFAULT 0,
  
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE metodos_frete IS 'Métodos de frete configurados (fixo, grátis, tabela, API)';
COMMENT ON COLUMN metodos_frete.tipo IS 'Tipo: fixo, gratis, tabela ou api';
COMMENT ON COLUMN metodos_frete.provedor_api IS 'Provedor da API (melhor_envio, correios, etc)';

CREATE INDEX idx_metodos_frete_loja ON metodos_frete(loja_id);
CREATE INDEX idx_metodos_frete_tipo ON metodos_frete(loja_id, tipo);
CREATE INDEX idx_metodos_frete_ativo ON metodos_frete(loja_id, ativo);

-- =====================================================
-- TABELA: zonas_entrega (shipping_zones)
-- =====================================================
CREATE TABLE zonas_entrega (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE NOT NULL,
  metodo_frete_id UUID REFERENCES metodos_frete(id) ON DELETE CASCADE,
  
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  
  -- Localização
  estados TEXT[], -- Estados: ["SP", "RJ"]
  cidades TEXT[], -- Cidades: ["São Paulo", "Guarulhos"]
  bairros TEXT[], -- Bairros específicos
  ceps TEXT[], -- CEPs específicos
  faixas_cep JSONB, -- Ranges de CEP: [{"inicio": "01000-000", "fim": "01999-999"}]
  
  -- Preço
  preco DECIMAL(10,2) NOT NULL,
  preco_adicional_por_kg DECIMAL(10,2) DEFAULT 0, -- Taxa adicional por kg
  valor_minimo_frete_gratis DECIMAL(10,2),
  
  -- Prazo
  prazo_minimo_dias INTEGER,
  prazo_maximo_dias INTEGER,
  
  -- Status
  ativa BOOLEAN DEFAULT true,
  ordem_exibicao INTEGER DEFAULT 0,
  
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT preco_positivo CHECK (preco >= 0)
);

COMMENT ON TABLE zonas_entrega IS 'Zonas de entrega para método tipo tabela';
COMMENT ON COLUMN zonas_entrega.faixas_cep IS 'Ranges de CEP em JSON';

CREATE INDEX idx_zonas_entrega_loja ON zonas_entrega(loja_id);
CREATE INDEX idx_zonas_entrega_metodo ON zonas_entrega(metodo_frete_id);
CREATE INDEX idx_zonas_entrega_ativa ON zonas_entrega(loja_id, ativa);

-- =====================================================
-- TABELA: cache_cotacoes_frete (shipping_api_cache)
-- =====================================================
CREATE TABLE cache_cotacoes_frete (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE NOT NULL,
  
  -- Chave de cache (hash dos parâmetros)
  chave_cache VARCHAR(255) UNIQUE NOT NULL,
  
  -- Parâmetros da cotação
  provedor_api VARCHAR(50) NOT NULL,
  cep_origem VARCHAR(9) NOT NULL,
  cep_destino VARCHAR(9) NOT NULL,
  peso DECIMAL(10,2) NOT NULL,
  dimensoes JSONB, -- {comprimento, largura, altura}
  
  -- Resultado da cotação
  servicos JSONB NOT NULL, -- Array de serviços disponíveis com preços
  -- Exemplo: [{"servico": "SEDEX", "preco": 25.00, "prazo_dias": 2}, {"servico": "PAC", "preco": 15.00, "prazo_dias": 5}]
  
  -- Metadata
  expira_em TIMESTAMPTZ NOT NULL, -- Cache expira em X horas
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE cache_cotacoes_frete IS 'Cache de cotações de frete de APIs externas';

CREATE INDEX idx_cache_frete_chave ON cache_cotacoes_frete(chave_cache);
CREATE INDEX idx_cache_frete_loja ON cache_cotacoes_frete(loja_id);
CREATE INDEX idx_cache_frete_expira ON cache_cotacoes_frete(expira_em);

-- Função para limpar cache expirado
CREATE OR REPLACE FUNCTION limpar_cache_frete_expirado()
RETURNS void AS $$
BEGIN
  DELETE FROM cache_cotacoes_frete WHERE expira_em < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABELA: formas_pagamento (payment_methods)
-- =====================================================
CREATE TABLE formas_pagamento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE NOT NULL,
  
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('pix', 'dinheiro', 'cartao', 'transferencia', 'outro')),
  icone VARCHAR(50),
  instrucoes TEXT,
  
  ativa BOOLEAN DEFAULT true,
  ordem_exibicao INTEGER DEFAULT 0,
  
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE formas_pagamento IS 'Formas de pagamento aceitas pela loja';

CREATE INDEX idx_formas_pagamento_loja ON formas_pagamento(loja_id);
CREATE INDEX idx_formas_pagamento_ativa ON formas_pagamento(loja_id, ativa);

-- =====================================================
-- TABELA: pedidos (orders)
-- =====================================================
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE NOT NULL,
  numero_pedido VARCHAR(20) UNIQUE NOT NULL,
  
  -- Cliente
  nome_cliente VARCHAR(255) NOT NULL,
  telefone_cliente VARCHAR(20) NOT NULL,
  email_cliente VARCHAR(255),
  documento_cliente VARCHAR(20), -- CPF/CNPJ
  
  -- Endereço
  endereco JSONB NOT NULL,
  
  -- Valores
  subtotal DECIMAL(10,2) NOT NULL,
  valor_frete DECIMAL(10,2) DEFAULT 0,
  desconto DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  -- Itens do pedido
  itens JSONB NOT NULL,
  -- Exemplo: [{"produto_id": "uuid", "variacao_id": "uuid", "nome": "Produto X", "nome_variacao": "M/Azul", "quantidade": 2, "preco": 100.00, "imagem_url": "url"}]
  
  -- Pagamento
  forma_pagamento VARCHAR(100) NOT NULL,
  tipo_pagamento VARCHAR(50),
  
  -- Entrega
  metodo_entrega VARCHAR(100) NOT NULL,
  metodo_frete_id UUID REFERENCES metodos_frete(id) ON DELETE SET NULL,
  servico_entrega VARCHAR(100), -- Nome do serviço (SEDEX, PAC, etc)
  codigo_rastreamento VARCHAR(100),
  
  -- Frete calculado por API
  provedor_frete_api VARCHAR(50), -- Se veio de API
  dados_frete_api JSONB, -- Dados da cotação da API
  
  -- Status
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN (
    'pendente',      -- aguardando confirmação
    'confirmado',    -- confirmado pelo lojista
    'preparando',    -- em preparação
    'enviado',       -- enviado
    'entregue',      -- entregue
    'cancelado'      -- cancelado
  )),
  
  -- Notas
  observacoes_cliente TEXT, -- observações do cliente
  notas_internas TEXT, -- notas internas do lojista
  
  -- Timestamps
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  confirmado_em TIMESTAMPTZ,
  enviado_em TIMESTAMPTZ,
  entregue_em TIMESTAMPTZ,
  cancelado_em TIMESTAMPTZ,
  
  CONSTRAINT total_positivo CHECK (total >= 0),
  CONSTRAINT subtotal_positivo CHECK (subtotal >= 0)
);

COMMENT ON TABLE pedidos IS 'Pedidos realizados pelos clientes';
COMMENT ON COLUMN pedidos.itens IS 'Itens do pedido em JSON (desnormalizado para performance)';

CREATE INDEX idx_pedidos_loja ON pedidos(loja_id);
CREATE INDEX idx_pedidos_numero ON pedidos(numero_pedido);
CREATE INDEX idx_pedidos_status ON pedidos(loja_id, status);
CREATE INDEX idx_pedidos_telefone_cliente ON pedidos(loja_id, telefone_cliente);
CREATE INDEX idx_pedidos_criado ON pedidos(loja_id, criado_em DESC);
CREATE INDEX idx_pedidos_data_range ON pedidos(loja_id, criado_em);

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para gerar número de pedido único
CREATE OR REPLACE FUNCTION gerar_numero_pedido()
RETURNS TEXT AS $$
DECLARE
  novo_numero TEXT;
  existe BOOLEAN;
BEGIN
  LOOP
    -- Gera número aleatório de 8 dígitos
    novo_numero := LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
    
    -- Verifica se já existe
    SELECT EXISTS(SELECT 1 FROM pedidos WHERE numero_pedido = novo_numero) INTO existe;
    
    -- Se não existe, retorna
    IF NOT existe THEN
      RETURN novo_numero;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION gerar_numero_pedido() IS 'Gera número único de 8 dígitos para pedido';

-- Trigger para auto-gerar número de pedido
CREATE OR REPLACE FUNCTION definir_numero_pedido()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_pedido IS NULL OR NEW.numero_pedido = '' THEN
    NEW.numero_pedido := gerar_numero_pedido();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_definir_numero_pedido
  BEFORE INSERT ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION definir_numero_pedido();

-- Função para atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION atualizar_timestamp() IS 'Atualiza automaticamente o campo atualizado_em';

-- Aplicar trigger de atualizado_em em todas as tabelas
CREATE TRIGGER atualizar_lojas_timestamp BEFORE UPDATE ON lojas
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER atualizar_categorias_timestamp BEFORE UPDATE ON categorias
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER atualizar_produtos_timestamp BEFORE UPDATE ON produtos
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER atualizar_variacoes_timestamp BEFORE UPDATE ON variacoes_produto
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER atualizar_metodos_frete_timestamp BEFORE UPDATE ON metodos_frete
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER atualizar_zonas_entrega_timestamp BEFORE UPDATE ON zonas_entrega
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER atualizar_formas_pagamento_timestamp BEFORE UPDATE ON formas_pagamento
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER atualizar_pedidos_timestamp BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE variacoes_produto ENABLE ROW LEVEL SECURITY;
ALTER TABLE metodos_frete ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonas_entrega ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_cotacoes_frete ENABLE ROW LEVEL SECURITY;
ALTER TABLE formas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS: lojas
-- =====================================================

-- Lojistas podem ver e editar apenas sua própria loja
CREATE POLICY "Lojistas podem ver sua loja" ON lojas 
  FOR SELECT 
  USING (proprietario_id = auth.uid());

CREATE POLICY "Lojistas podem atualizar sua loja" ON lojas 
  FOR UPDATE 
  USING (proprietario_id = auth.uid());

-- Lojistas podem criar sua própria loja no cadastro
CREATE POLICY "Lojistas podem criar loja" ON lojas 
  FOR INSERT 
  WITH CHECK (proprietario_id = auth.uid());

-- Público pode ver lojas ativas (para renderizar loja pública)
CREATE POLICY "Público pode ver lojas ativas" ON lojas 
  FOR SELECT 
  USING (status = 'ativa');

-- =====================================================
-- POLÍTICAS RLS: categorias
-- =====================================================

CREATE POLICY "Lojistas podem gerenciar categorias" ON categorias 
  FOR ALL
  USING (loja_id IN (SELECT id FROM lojas WHERE proprietario_id = auth.uid()));

CREATE POLICY "Público pode ver categorias ativas" ON categorias 
  FOR SELECT 
  USING (ativa = true);

-- =====================================================
-- POLÍTICAS RLS: produtos
-- =====================================================

CREATE POLICY "Lojistas podem gerenciar produtos" ON produtos 
  FOR ALL
  USING (loja_id IN (SELECT id FROM lojas WHERE proprietario_id = auth.uid()));

CREATE POLICY "Público pode ver produtos ativos" ON produtos 
  FOR SELECT 
  USING (ativo = true);

-- =====================================================
-- POLÍTICAS RLS: variacoes_produto
-- =====================================================

CREATE POLICY "Lojistas podem gerenciar variações" ON variacoes_produto 
  FOR ALL
  USING (loja_id IN (SELECT id FROM lojas WHERE proprietario_id = auth.uid()));

CREATE POLICY "Público pode ver variações ativas" ON variacoes_produto 
  FOR SELECT 
  USING (ativa = true);

-- =====================================================
-- POLÍTICAS RLS: metodos_frete
-- =====================================================

CREATE POLICY "Lojistas podem gerenciar métodos de frete" ON metodos_frete 
  FOR ALL
  USING (loja_id IN (SELECT id FROM lojas WHERE proprietario_id = auth.uid()));

CREATE POLICY "Público pode ver métodos ativos" ON metodos_frete 
  FOR SELECT 
  USING (ativo = true);

-- =====================================================
-- POLÍTICAS RLS: zonas_entrega
-- =====================================================

CREATE POLICY "Lojistas podem gerenciar zonas" ON zonas_entrega 
  FOR ALL
  USING (loja_id IN (SELECT id FROM lojas WHERE proprietario_id = auth.uid()));

CREATE POLICY "Público pode ver zonas ativas" ON zonas_entrega 
  FOR SELECT 
  USING (ativa = true);

-- =====================================================
-- POLÍTICAS RLS: cache_cotacoes_frete
-- =====================================================

CREATE POLICY "Lojistas podem gerenciar cache" ON cache_cotacoes_frete 
  FOR ALL
  USING (loja_id IN (SELECT id FROM lojas WHERE proprietario_id = auth.uid()));

CREATE POLICY "Público pode ler cache" ON cache_cotacoes_frete 
  FOR SELECT 
  USING (true);

-- =====================================================
-- POLÍTICAS RLS: formas_pagamento
-- =====================================================

CREATE POLICY "Lojistas podem gerenciar formas de pagamento" ON formas_pagamento 
  FOR ALL
  USING (loja_id IN (SELECT id FROM lojas WHERE proprietario_id = auth.uid()));

CREATE POLICY "Público pode ver formas ativas" ON formas_pagamento 
  FOR SELECT 
  USING (ativa = true);

-- =====================================================
-- POLÍTICAS RLS: pedidos
-- =====================================================

-- Lojistas podem ver e editar pedidos da sua loja
CREATE POLICY "Lojistas podem ver pedidos" ON pedidos 
  FOR SELECT
  USING (loja_id IN (SELECT id FROM lojas WHERE proprietario_id = auth.uid()));

CREATE POLICY "Lojistas podem atualizar pedidos" ON pedidos 
  FOR UPDATE
  USING (loja_id IN (SELECT id FROM lojas WHERE proprietario_id = auth.uid()));

-- Clientes podem criar pedidos (sem autenticação)
CREATE POLICY "Clientes podem criar pedidos" ON pedidos 
  FOR INSERT 
  WITH CHECK (true);

-- =====================================================
-- FIM DO SCHEMA EM PORTUGUÊS
-- =====================================================
-- Execute este script no Supabase SQL Editor
-- Depois configure o Storage para os buckets:
-- - logos-lojas (público)
-- - imagens-produtos (público)
-- =====================================================
