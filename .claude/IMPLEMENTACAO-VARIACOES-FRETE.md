# 🚀 Guia de Implementação - Variações e Frete

## 📋 Novas Funcionalidades Adicionadas

Duas funcionalidades essenciais foram adicionadas ao projeto:

### 1. ✅ Sistema de Variações de Produtos (tipo WooCommerce)
- Produtos simples (sem variações)
- Produtos variáveis (com múltiplas opções)
- Atributos personalizáveis (Tamanho, Cor, Material, etc)
- Gestão individual de preço e estoque por variação
- Geração automática de combinações

### 2. ✅ Sistema Robusto de Frete
- 4 tipos de frete: Fixo, Grátis, Tabela, API
- Preparado para integrações: Melhor Envio, Correios, Jadlog, Loggi
- Cache inteligente de cotações
- Cálculo baseado em peso e dimensões
- Zonas de entrega personalizáveis

---

## 🗄️ Schema Atualizado

**Novo arquivo:** `supabase-schema-v2.sql`

### Novas Tabelas

1. **product_variants** - Variações de produtos
   - Atributos por variação
   - Preço e estoque individual
   - Imagem específica
   - Dimensões por variação

2. **shipping_methods** - Métodos de frete
   - Tipos: fixed, free, table, api
   - Configurações por tipo
   - Integração com APIs externas

3. **shipping_zones** - Zonas de entrega
   - CEPs, cidades, estados
   - Preços por zona
   - Prazo de entrega

4. **shipping_api_cache** - Cache de cotações
   - Reduz chamadas de API
   - Expira automaticamente

### Tabelas Modificadas

- **products**: Adicionado `product_type`, `attributes`, dimensões
- **tenants**: Adicionado `shipping_origin_zipcode` para origem do frete
- **orders**: Adicionado suporte a variações e dados de frete

---

## 📚 Documentação Criada

### 1. SISTEMA-VARIACOES.md
Guia completo sobre variações:
- Como criar produto variável
- Geração automática de combinações
- Seleção de variações no storefront
- Gestão de estoque por variação
- Exemplos de código completos

### 2. SISTEMA-FRETE.md
Guia completo sobre frete:
- 4 tipos de métodos
- Integração com Melhor Envio (código completo)
- Integração com Correios (código completo)
- Sistema de cache
- Cálculo no checkout
- Exemplos de configuração

---

## 🎯 Ordem de Implementação Atualizada

### Fase 1: Setup (30 min)
1. ✅ Substituir `supabase-schema.sql` por `supabase-schema-v2.sql`
2. ✅ Executar no Supabase SQL Editor
3. ✅ Gerar types: `npm run supabase:types`
4. ✅ Ler SISTEMA-VARIACOES.md
5. ✅ Ler SISTEMA-FRETE.md

### Fase 2: Produtos com Variações (5-7 dias)

#### 2.1. Backend - Criar produto variável
```typescript
// src/app/actions/products.ts
'use server'

export async function createProduct(data) {
  // 1. Criar produto principal
  const product = await supabase.from('products').insert({
    product_type: data.type, // 'simple' ou 'variable'
    attributes: data.attributes, // JSON com atributos
    // ... outros campos
  });

  // 2. Se variável, criar variações
  if (data.type === 'variable') {
    const variants = data.variants.map(v => ({
      product_id: product.id,
      attributes: v.attributes, // {"tamanho": "M", "cor": "Azul"}
      price: v.price,
      stock_quantity: v.stock_quantity,
      // ...
    }));
    
    await supabase.from('product_variants').insert(variants);
  }
}
```

#### 2.2. Dashboard - Formulário de produto
```
src/app/(dashboard)/dashboard/products/
├── new/
│   └── page.tsx
└── [id]/
    └── edit/
        └── page.tsx
```

**Componentes:**
```
src/components/dashboard/products/
├── ProductTypeSelector.tsx      # Simple vs Variable
├── AttributesEditor.tsx         # Adicionar Tamanho, Cor, etc
├── VariantsGenerator.tsx        # Gerar combinações
├── VariantsTable.tsx            # Tabela com todas variações
└── VariantRow.tsx               # Editar cada variação
```

**Features:**
- [ ] Selector de tipo (simple/variable)
- [ ] Editor de atributos dinâmico
- [ ] Botão "Gerar Variações" (cria todas combinações)
- [ ] Tabela editável de variações
- [ ] Upload de imagem por variação
- [ ] SKU automático sugerido
- [ ] Bulk edit (alterar múltiplas variações)
- [ ] Preview do produto

#### 2.3. Storefront - Seleção de variações
```
src/app/(storefront)/produtos/[slug]/page.tsx
```

**Features:**
- [ ] Detectar se produto é variável
- [ ] Buscar variações do banco
- [ ] Mostrar seletores (Tamanho, Cor, etc)
- [ ] Desabilitar opções sem estoque
- [ ] Atualizar preço ao selecionar
- [ ] Trocar imagem ao selecionar (se tiver)
- [ ] Adicionar variação específica ao carrinho

**Componente:**
```typescript
// src/components/storefront/VariableProductOptions.tsx

function VariableProductOptions({ product, variants }) {
  const [selected, setSelected] = useState({});
  const [currentVariant, setCurrentVariant] = useState(null);

  useEffect(() => {
    // Encontrar variação com atributos selecionados
    const variant = variants.find(v =>
      JSON.stringify(v.attributes) === JSON.stringify(selected)
    );
    setCurrentVariant(variant);
  }, [selected]);

  return (
    <>
      {/* Seletores para cada atributo */}
      {product.attributes.map(attr => (
        <div key={attr.slug}>
          <label>{attr.name}</label>
          {attr.options.map(option => (
            <button
              onClick={() => setSelected({...selected, [attr.slug]: option})}
              disabled={!isOptionAvailable(attr.slug, option)}
            >
              {option}
            </button>
          ))}
        </div>
      ))}

      {/* Preço e estoque da variação */}
      {currentVariant && (
        <>
          <div>{formatCurrency(currentVariant.price)}</div>
          <div>{currentVariant.stock_quantity} em estoque</div>
          <Button onClick={() => addToCart(currentVariant)}>
            Adicionar ao Carrinho
          </Button>
        </>
      )}
    </>
  );
}
```

### Fase 3: Sistema de Frete (4-6 dias)

#### 3.1. Dashboard - Configurar métodos de frete
```
src/app/(dashboard)/dashboard/settings/shipping/
├── page.tsx                    # Lista de métodos
├── methods/
│   ├── fixed/page.tsx         # Configurar frete fixo
│   ├── free/page.tsx          # Configurar frete grátis
│   ├── table/page.tsx         # Configurar tabela
│   └── api/page.tsx           # Configurar APIs
└── zones/
    └── page.tsx               # Gerenciar zonas
```

**Features:**
- [ ] CRUD de métodos de frete
- [ ] Formulário para cada tipo
- [ ] Gerenciar zonas de entrega
- [ ] Configurar APIs (tokens, serviços)
- [ ] Ativar/desativar métodos
- [ ] Testar cálculo de frete

#### 3.2. Biblioteca de cálculo
```
src/lib/shipping/
├── calculator.ts              # Função principal
├── melhor-envio.ts           # Integração Melhor Envio
├── correios.ts               # Integração Correios
├── jadlog.ts                 # Integração Jadlog
└── cache.ts                  # Sistema de cache
```

**Implementar:**
```typescript
// src/lib/shipping/calculator.ts

export async function calculateShipping(
  tenantId: string,
  zipcode: string,
  cartTotal: number,
  cartWeight: number,
  cartDimensions: Dimensions
): Promise<ShippingQuote[]> {
  // 1. Buscar métodos ativos
  const methods = await getActiveMethods(tenantId);
  
  // 2. Calcular cada método
  const quotes = [];
  for (const method of methods) {
    switch (method.type) {
      case 'fixed':
        quotes.push(calculateFixed(method));
        break;
      case 'free':
        quotes.push(calculateFree(method, cartTotal));
        break;
      case 'table':
        quotes.push(await calculateTable(method, zipcode));
        break;
      case 'api':
        quotes.push(...await calculateApi(method, zipcode, cartWeight));
        break;
    }
  }
  
  return quotes.filter(q => q !== null);
}
```

#### 3.3. API Route para checkout
```typescript
// src/app/api/shipping/calculate/route.ts

export async function POST(request: Request) {
  const { zipcode, total, weight, dimensions } = await request.json();
  const tenantId = getTenantIdFromHeaders();

  const quotes = await calculateShipping(
    tenantId,
    zipcode,
    total,
    weight,
    dimensions
  );

  return Response.json(quotes);
}
```

#### 3.4. Checkout - Calcular e selecionar frete
```
src/app/(storefront)/checkout/page.tsx
```

**Features:**
- [ ] Input de CEP
- [ ] Calcular frete ao digitar CEP
- [ ] Loading state durante cálculo
- [ ] Listar opções de frete
- [ ] Radio buttons para selecionar
- [ ] Mostrar preço e prazo
- [ ] Atualizar total do pedido
- [ ] Salvar método escolhido no pedido

**Exemplo:**
```typescript
// Checkout component
const [quotes, setQuotes] = useState([]);
const [loading, setLoading] = useState(false);

async function handleZipcodeComplete(zipcode: string) {
  setLoading(true);
  
  const weight = calculateTotalWeight(cart.items);
  const dimensions = getLargestProductDimensions(cart.items);
  
  const response = await fetch('/api/shipping/calculate', {
    method: 'POST',
    body: JSON.stringify({
      zipcode,
      total: cart.total,
      weight,
      dimensions
    })
  });
  
  const data = await response.json();
  setQuotes(data);
  setLoading(false);
}
```

### Fase 4: Integrações de Frete (por demanda)

#### 4.1. Melhor Envio (prioritário)
```typescript
// src/lib/shipping/melhor-envio.ts

export async function quoteMelhorEnvio(config, params) {
  const response = await fetch(
    'https://melhorenvio.com.br/api/v2/me/shipment/calculate',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: { postal_code: config.from.postal_code },
        to: { postal_code: params.zipcode },
        package: {
          weight: params.weight,
          width: params.dimensions.width,
          height: params.dimensions.height,
          length: params.dimensions.length
        }
      })
    }
  );
  
  return await response.json();
}
```

**Setup:**
1. Criar conta no Melhor Envio
2. Gerar token de API
3. Configurar no dashboard
4. Testar cotação

#### 4.2. Correios
Implementação similar ao Melhor Envio.

Ver código completo em **SISTEMA-FRETE.md**

---

## 🔄 Fluxos Atualizados

### Fluxo: Cliente compra produto variável

1. **Cliente** acessa produto variável
2. **Storefront** mostra seletores de atributos
3. **Cliente** seleciona Tamanho M, Cor Azul
4. **Sistema** encontra variação correspondente
5. **Sistema** mostra preço e estoque da variação
6. **Cliente** adiciona ao carrinho (salva `variant_id`)
7. **Cliente** preenche CEP no checkout
8. **Sistema** calcula peso da variação
9. **Sistema** consulta APIs de frete
10. **Cliente** escolhe frete
11. **Sistema** cria pedido com `variant_id` e dados de frete
12. **Sistema** decrementa estoque da variação específica

### Fluxo: Lojista cria produto variável

1. **Lojista** acessa "Novo Produto"
2. **Dashboard** mostra selector de tipo
3. **Lojista** escolhe "Produto com Variações"
4. **Lojista** adiciona atributo "Tamanho" com opções P, M, G
5. **Lojista** adiciona atributo "Cor" com opções Azul, Vermelho
6. **Lojista** clica "Gerar Variações"
7. **Sistema** cria 6 variações (3 tamanhos × 2 cores)
8. **Lojista** preenche preço e estoque de cada variação
9. **Lojista** salva produto
10. **Sistema** cria registro `products` + 6 registros `product_variants`

---

## 📝 Checklist Atualizado

### Produtos com Variações
- [ ] Atualizar schema do banco (usar v2)
- [ ] Criar ProductTypeSelector component
- [ ] Criar AttributesEditor component
- [ ] Implementar geração de variações
- [ ] Criar VariantsTable component
- [ ] Implementar bulk edit
- [ ] Server action: criar produto variável
- [ ] Server action: editar variações
- [ ] Storefront: detectar tipo de produto
- [ ] Storefront: mostrar seletores de atributos
- [ ] Storefront: adicionar variação ao carrinho
- [ ] Checkout: salvar variant_id no pedido
- [ ] Dashboard: mostrar pedidos com variações

### Sistema de Frete
- [ ] Criar shipping_methods CRUD
- [ ] Criar shipping_zones CRUD
- [ ] Implementar calculateShipping()
- [ ] Implementar frete fixo
- [ ] Implementar frete grátis
- [ ] Implementar frete por tabela
- [ ] Criar sistema de cache
- [ ] API route /api/shipping/calculate
- [ ] Integrar Melhor Envio
- [ ] Integrar Correios
- [ ] Checkout: input de CEP
- [ ] Checkout: calcular frete
- [ ] Checkout: selecionar frete
- [ ] Checkout: atualizar total
- [ ] Salvar dados de frete no pedido

---

## 🎯 Prioridades

**Alta (MVP):**
1. ✅ Produtos simples
2. ✅ Produtos variáveis (Tamanho, Cor)
3. ✅ Frete fixo
4. ✅ Frete por tabela
5. Checkout com frete

**Média:**
6. Integração Melhor Envio
7. Frete grátis
8. Cache de cotações

**Baixa (pós-MVP):**
9. Integração Correios
10. Outras transportadoras
11. Rastreamento
12. Etiquetas

---

## 📚 Referências

**Documentação completa:**
- **SISTEMA-VARIACOES.md** - Como implementar variações
- **SISTEMA-FRETE.md** - Como implementar frete
- **supabase-schema-v2.sql** - Schema atualizado

**Exemplos de código:**
- Todos os arquivos .md contêm código completo e funcional
- Copie e adapte conforme sua necessidade

---

## 💡 Dicas Importantes

### Variações
1. Sempre gere SKUs únicos por variação
2. Controle estoque por variação, não por produto
3. Use dimensões específicas quando possível
4. Desative variações sem estoque (não exclua)

### Frete
1. Configure CEP de origem do lojista
2. Use cache para reduzir custos de API
3. Sempre tenha um fallback (frete fixo)
4. Peso mínimo: 0.3kg para APIs
5. Dimensões padrão: 20x20x5cm quando não informado

---

**Boa sorte na implementação! 🚀**
