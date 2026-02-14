# 🎨 Sistema de Variações de Produtos (tipo WooCommerce)

## 📋 Visão Geral

O sistema suporta dois tipos de produtos:
- **Simple** - Produto simples, sem variações
- **Variable** - Produto com variações (tamanho, cor, material, etc)

## 🏗️ Estrutura no Banco

### Tabelas

1. **products** - Produto principal
2. **product_variants** - Variações do produto

### Exemplo de Dados

#### Produto Variável: Camiseta

```sql
-- Produto principal
INSERT INTO products (
  tenant_id,
  name,
  slug,
  product_type,
  attributes,
  price, -- preço base (pode ser o mais barato)
  is_active
) VALUES (
  'tenant-uuid',
  'Camiseta Básica',
  'camiseta-basica',
  'variable',
  '[
    {
      "name": "Tamanho",
      "slug": "tamanho",
      "options": ["P", "M", "G", "GG"]
    },
    {
      "name": "Cor",
      "slug": "cor",
      "options": ["Branco", "Preto", "Azul", "Vermelho"]
    }
  ]',
  49.90,
  true
);

-- Variações
-- Variação 1: P/Branco
INSERT INTO product_variants (
  product_id,
  tenant_id,
  attributes,
  sku,
  price,
  stock_quantity
) VALUES (
  'product-uuid',
  'tenant-uuid',
  '{"tamanho": "P", "cor": "Branco"}',
  'CAM-P-BCO',
  49.90,
  10
);

-- Variação 2: M/Preto
INSERT INTO product_variants (
  product_id,
  tenant_id,
  attributes,
  sku,
  price,
  stock_quantity
) VALUES (
  'product-uuid',
  'tenant-uuid',
  '{"tamanho": "M", "cor": "Preto"}',
  'CAM-M-PTO',
  49.90,
  15
);

-- ... mais variações
```

## 💻 Implementação Frontend

### 1. Criar Produto Variável (Dashboard)

```typescript
// src/app/(dashboard)/dashboard/products/new/page.tsx

interface ProductAttribute {
  name: string;
  slug: string;
  options: string[];
}

interface ProductVariant {
  attributes: Record<string, string>;
  sku?: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
}

function CreateProductForm() {
  const [productType, setProductType] = useState<'simple' | 'variable'>('simple');
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Adicionar atributo
  const addAttribute = () => {
    setAttributes([...attributes, { name: '', slug: '', options: [] }]);
  };

  // Gerar combinações de variações automaticamente
  const generateVariants = () => {
    if (attributes.length === 0) return;

    // Gera todas as combinações possíveis
    const combinations = generateCombinations(attributes);
    
    const newVariants = combinations.map(combo => ({
      attributes: combo,
      price: 0,
      stock_quantity: 0,
      sku: '',
    }));

    setVariants(newVariants);
  };

  return (
    <form>
      {/* Campos básicos */}
      <Input name="name" label="Nome do Produto" />
      <Textarea name="description" label="Descrição" />
      
      {/* Tipo de produto */}
      <Select value={productType} onChange={setProductType}>
        <option value="simple">Produto Simples</option>
        <option value="variable">Produto com Variações</option>
      </Select>

      {productType === 'simple' && (
        <>
          <Input name="price" type="number" label="Preço" />
          <Input name="stock" type="number" label="Estoque" />
        </>
      )}

      {productType === 'variable' && (
        <>
          {/* Atributos */}
          <div>
            <h3>Atributos</h3>
            {attributes.map((attr, idx) => (
              <div key={idx}>
                <Input
                  value={attr.name}
                  onChange={(e) => {
                    const newAttrs = [...attributes];
                    newAttrs[idx].name = e.target.value;
                    newAttrs[idx].slug = slugify(e.target.value);
                    setAttributes(newAttrs);
                  }}
                  placeholder="Ex: Tamanho"
                />
                <Input
                  value={attr.options.join(', ')}
                  onChange={(e) => {
                    const newAttrs = [...attributes];
                    newAttrs[idx].options = e.target.value.split(',').map(s => s.trim());
                    setAttributes(newAttrs);
                  }}
                  placeholder="Ex: P, M, G, GG"
                />
              </div>
            ))}
            <Button onClick={addAttribute}>Adicionar Atributo</Button>
          </div>

          {/* Gerar variações */}
          <Button onClick={generateVariants}>
            Gerar Variações Automaticamente
          </Button>

          {/* Tabela de variações */}
          {variants.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Variação</th>
                  <th>SKU</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th>Imagem</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant, idx) => (
                  <tr key={idx}>
                    <td>
                      {Object.entries(variant.attributes)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(' / ')}
                    </td>
                    <td>
                      <Input
                        value={variant.sku}
                        onChange={(e) => {
                          const newVariants = [...variants];
                          newVariants[idx].sku = e.target.value;
                          setVariants(newVariants);
                        }}
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        value={variant.price}
                        onChange={(e) => {
                          const newVariants = [...variants];
                          newVariants[idx].price = parseFloat(e.target.value);
                          setVariants(newVariants);
                        }}
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        value={variant.stock_quantity}
                        onChange={(e) => {
                          const newVariants = [...variants];
                          newVariants[idx].stock_quantity = parseInt(e.target.value);
                          setVariants(newVariants);
                        }}
                      />
                    </td>
                    <td>
                      <ImageUpload
                        onChange={(url) => {
                          const newVariants = [...variants];
                          newVariants[idx].image_url = url;
                          setVariants(newVariants);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      <Button type="submit">Salvar Produto</Button>
    </form>
  );
}

// Helper: gerar todas as combinações
function generateCombinations(attributes: ProductAttribute[]) {
  if (attributes.length === 0) return [];
  
  const result: Record<string, string>[] = [];
  
  function combine(index: number, current: Record<string, string>) {
    if (index === attributes.length) {
      result.push({ ...current });
      return;
    }
    
    const attr = attributes[index];
    for (const option of attr.options) {
      current[attr.slug] = option;
      combine(index + 1, current);
    }
  }
  
  combine(0, {});
  return result;
}
```

### 2. Salvar Produto e Variações

```typescript
// src/app/actions/products.ts
'use server'

export async function createVariableProduct(formData: FormData) {
  const supabase = createClient();
  
  // 1. Criar produto principal
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      tenant_id: getTenantId(),
      name: formData.get('name'),
      slug: slugify(formData.get('name')),
      description: formData.get('description'),
      product_type: 'variable',
      attributes: JSON.parse(formData.get('attributes')),
      price: Math.min(...variants.map(v => v.price)), // menor preço
      is_active: true,
    })
    .select()
    .single();

  if (productError) throw productError;

  // 2. Criar variações
  const variants = JSON.parse(formData.get('variants'));
  const { error: variantsError } = await supabase
    .from('product_variants')
    .insert(
      variants.map((v: any) => ({
        product_id: product.id,
        tenant_id: getTenantId(),
        attributes: v.attributes,
        sku: v.sku,
        price: v.price,
        stock_quantity: v.stock_quantity,
        image_url: v.image_url,
      }))
    );

  if (variantsError) throw variantsError;

  revalidatePath('/dashboard/products');
  return { success: true, productId: product.id };
}
```

### 3. Exibir Produto Variável (Storefront)

```typescript
// src/app/(storefront)/produtos/[slug]/page.tsx

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  
  // Buscar produto
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('slug', params.slug)
    .single();

  // Se for produto variável, buscar variações
  let variants = [];
  if (product.product_type === 'variable') {
    const { data } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', product.id)
      .eq('is_active', true);
    
    variants = data || [];
  }

  return (
    <div>
      <ProductGallery images={product.images} />
      <h1>{product.name}</h1>
      <p>{product.description}</p>

      {product.product_type === 'simple' ? (
        <SimpleProductOptions product={product} />
      ) : (
        <VariableProductOptions 
          product={product} 
          variants={variants} 
        />
      )}
    </div>
  );
}

// Componente para produto variável
function VariableProductOptions({ product, variants }) {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  // Atualiza variação selecionada quando atributos mudam
  useEffect(() => {
    const variant = variants.find(v => 
      JSON.stringify(v.attributes) === JSON.stringify(selectedAttributes)
    );
    setSelectedVariant(variant);
  }, [selectedAttributes, variants]);

  return (
    <div>
      {/* Selecionar atributos */}
      {product.attributes.map((attr: any) => (
        <div key={attr.slug}>
          <label>{attr.name}</label>
          <div className="flex gap-2">
            {attr.options.map((option: string) => {
              const isAvailable = variants.some(v => 
                v.attributes[attr.slug] === option && v.stock_quantity > 0
              );
              
              return (
                <button
                  key={option}
                  onClick={() => setSelectedAttributes({
                    ...selectedAttributes,
                    [attr.slug]: option
                  })}
                  disabled={!isAvailable}
                  className={cn(
                    'px-4 py-2 border rounded',
                    selectedAttributes[attr.slug] === option && 'bg-black text-white',
                    !isAvailable && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Preço e estoque da variação selecionada */}
      {selectedVariant ? (
        <>
          <div className="text-2xl font-bold">
            {formatCurrency(selectedVariant.price)}
          </div>
          <div className="text-sm text-gray-600">
            {selectedVariant.stock_quantity > 0 
              ? `${selectedVariant.stock_quantity} em estoque`
              : 'Fora de estoque'
            }
          </div>
          <Button
            onClick={() => addToCart(selectedVariant)}
            disabled={selectedVariant.stock_quantity === 0}
          >
            Adicionar ao Carrinho
          </Button>
        </>
      ) : (
        <div className="text-gray-500">
          Selecione as opções acima
        </div>
      )}
    </div>
  );
}
```

## 📊 Queries Úteis

### Buscar produto com variações

```typescript
// Server Component
const { data: product } = await supabase
  .from('products')
  .select(`
    *,
    variants:product_variants(*)
  `)
  .eq('slug', slug)
  .single();
```

### Buscar variações disponíveis de um atributo

```sql
-- Exemplo: buscar todos os tamanhos disponíveis
SELECT DISTINCT attributes->>'tamanho' as tamanho
FROM product_variants
WHERE product_id = 'xxx'
  AND is_active = true
  AND stock_quantity > 0;
```

### Atualizar estoque de variação

```typescript
await supabase
  .from('product_variants')
  .update({ 
    stock_quantity: supabase.rpc('decrement_stock', { 
      variant_id: variantId,
      quantity: 1 
    })
  })
  .eq('id', variantId);
```

## 🎯 Boas Práticas

### 1. Nomenclatura de Atributos

✅ **Bom:**
- Tamanho, Cor, Material, Voltagem

❌ **Evite:**
- tam, clr (abreviações)
- TAMANHO (tudo maiúsculo)

### 2. Ordem dos Atributos

Mantenha ordem consistente:
1. Tamanho
2. Cor
3. Outros atributos

### 3. SKU de Variações

Use padrão consistente:
```
PRODUTO-ATRIBUTO1-ATRIBUTO2
Exemplo: CAM-M-AZUL
```

### 4. Imagens de Variações

- Use imagem específica quando a variação muda visualmente (ex: cor)
- Reutilize imagem do produto pai quando não muda (ex: tamanho)

### 5. Gestão de Estoque

- Sempre controle estoque por variação
- Desative variações sem estoque (mas não exclua)
- Alerte o lojista quando estoque baixo

## 🚀 Features Avançadas (Futuro)

### 1. Variações Dependentes

Algumas opções só aparecem com base em outras:
```typescript
// Exemplo: Tamanho P não tem opção Vermelho
const availableColors = getAvailableColors(selectedSize);
```

### 2. Precificação Dinâmica

Preço varia por atributo:
```typescript
// Exemplo: Tamanho GG custa +R$5
basePrice + attributePricing[attribute];
```

### 3. Bulk Edit

Editar múltiplas variações de uma vez:
```typescript
// Atualizar preço de todas as variações
updateAllVariantsPrices(productId, newPrice);
```

### 4. Importação de Planilha

```typescript
// Importar variações via CSV/Excel
importVariantsFromCSV(file);
```

## 📱 UI/UX Recomendada

### Dashboard
- **Lista de produtos**: Mostrar "(X variações)" ao lado do nome
- **Edição**: Abrir modal com tabela de variações
- **Bulk actions**: Ativar/desativar múltiplas variações

### Storefront
- **Seleção visual**: Botões coloridos para cores, badges para tamanhos
- **Preview**: Trocar imagem ao selecionar variação
- **Disponibilidade**: Mostrar claramente variações indisponíveis
- **Mobile**: Dropdowns funcionam melhor que botões

## 🧪 Testes Importantes

1. Criar produto com 2 atributos (4 combinações)
2. Verificar todas as variações foram criadas
3. Selecionar variação no storefront
4. Adicionar ao carrinho
5. Verificar item correto no carrinho
6. Finalizar pedido
7. Verificar pedido tem variant_id correto
8. Verificar estoque foi decrementado

---

**Próximo:** Ver SISTEMA-FRETE.md para entender o cálculo de frete com variações
