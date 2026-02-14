# 🚀 Próximos Passos - Desenvolvimento

Este documento orienta a continuação do desenvolvimento da plataforma UP Catálogo.

## ✅ O que já foi criado

1. **Arquitetura completa** (`ARQUITETURA.md`)
   - Modelagem do banco de dados
   - Stack tecnológico definido
   - Fluxos principais mapeados

2. **Schema do banco** (`supabase-schema.sql`)
   - Todas as tabelas criadas
   - Row Level Security configurado
   - Triggers e funções auxiliares

3. **Estrutura base do Next.js**
   - Configurações (Next, TypeScript, Tailwind)
   - Middleware para multi-tenancy e auth
   - Clientes Supabase (client e server)
   - Utilities e helpers
   - Landing page inicial

## 📝 Próximos Passos Recomendados

### Fase 1: Setup Inicial (1-2 dias)

#### 1.1. Configurar Supabase
```bash
# 1. Criar projeto no Supabase
# 2. Executar supabase-schema.sql no SQL Editor
# 3. Configurar Storage (tenant-logos e product-images)
# 4. Copiar credenciais para .env.local
```

#### 1.2. Gerar Types do Supabase
```bash
npm install
npm run supabase:types
```

#### 1.3. Testar ambiente local
```bash
npm run dev
# Acessar http://localhost:3000
```

---

### Fase 2: Autenticação (2-3 dias)

#### 2.1. Criar páginas de autenticação

**Arquivos a criar:**

```
src/app/(auth)/
├── layout.tsx           # Layout para páginas de auth
├── login/
│   └── page.tsx        # Página de login
└── signup/
    └── page.tsx        # Página de cadastro
```

**Features:**
- Formulário de login (email + senha)
- Formulário de cadastro (nome, email, senha, nome da loja)
- Validação com Zod
- Integração com Supabase Auth
- Redirecionamento após login
- Mensagens de erro/sucesso

**Código exemplo (signup):**
```typescript
// src/app/(auth)/signup/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  async function handleSignup(formData: FormData) {
    setLoading(true)
    
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const storeName = formData.get('storeName') as string
    
    // 1. Criar usuário
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (authError) {
      alert(authError.message)
      setLoading(false)
      return
    }
    
    // 2. Criar tenant
    const subdomain = slugify(storeName)
    const { error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: storeName,
        subdomain,
        slug: subdomain,
        owner_id: authData.user!.id,
      })
    
    if (tenantError) {
      alert('Erro ao criar loja')
      setLoading(false)
      return
    }
    
    // 3. Redirecionar
    router.push('/dashboard')
  }

  return (
    <form action={handleSignup}>
      {/* Campos do formulário */}
    </form>
  )
}
```

---

### Fase 3: Dashboard - Estrutura Base (2-3 dias)

#### 3.1. Criar layout do dashboard

**Arquivos a criar:**

```
src/app/(dashboard)/
├── layout.tsx           # Layout com sidebar + header
└── dashboard/
    └── page.tsx        # Dashboard home (overview)
```

**Componentes necessários:**
```
src/components/dashboard/
├── Sidebar.tsx         # Menu lateral
├── Header.tsx          # Cabeçalho com user menu
├── StatsCard.tsx       # Cards de estatísticas
└── RecentOrders.tsx    # Lista de pedidos recentes
```

**Features:**
- Sidebar com navegação
- Header com nome do lojista e logout
- Dashboard home com estatísticas básicas
- Verificação de autenticação

---

### Fase 4: Gestão de Produtos (3-5 dias)

#### 4.1. Listar produtos

**Arquivo:**
```
src/app/(dashboard)/dashboard/products/page.tsx
```

**Features:**
- Listar todos os produtos
- Busca e filtros
- Paginação
- Botão para adicionar novo produto
- Ações: editar, excluir, ativar/desativar

#### 4.2. Criar/Editar produto

**Arquivos:**
```
src/app/(dashboard)/dashboard/products/
├── new/
│   └── page.tsx        # Novo produto
└── [id]/
    └── edit/
        └── page.tsx    # Editar produto
```

**Features:**
- Formulário completo de produto
- Upload de imagens (Supabase Storage)
- Editor de variações
- Gestão de estoque
- Preview do produto

**Componentes necessários:**
```
src/components/dashboard/products/
├── ProductForm.tsx         # Formulário principal
├── ImageUpload.tsx         # Upload de imagens
├── VariantsEditor.tsx      # Editor de variações
└── ProductPreview.tsx      # Preview do produto
```

---

### Fase 5: Gestão de Pedidos (2-3 dias)

#### 5.1. Listar pedidos

**Arquivo:**
```
src/app/(dashboard)/dashboard/orders/page.tsx
```

**Features:**
- Listar todos os pedidos
- Filtrar por status
- Buscar por número/cliente
- Visualizar detalhes do pedido
- Atualizar status

#### 5.2. Detalhes do pedido

**Arquivo:**
```
src/app/(dashboard)/dashboard/orders/[id]/page.tsx
```

**Features:**
- Informações completas do pedido
- Timeline de status
- Detalhes do cliente
- Itens do pedido
- Ações: confirmar, cancelar, marcar como enviado

---

### Fase 6: Configurações da Loja (2-3 dias)

#### 6.1. Configurações gerais

**Arquivo:**
```
src/app/(dashboard)/dashboard/settings/page.tsx
```

**Features:**
- Editar nome da loja
- Upload de logo
- Escolher cores (primary, secondary)
- Informações de contato (WhatsApp, email, Instagram)

#### 6.2. Formas de pagamento

**Arquivo:**
```
src/app/(dashboard)/dashboard/settings/payment-methods/page.tsx
```

**Features:**
- Listar formas de pagamento
- Adicionar nova forma
- Editar instruções
- Ativar/desativar

#### 6.3. Zonas de entrega

**Arquivo:**
```
src/app/(dashboard)/dashboard/settings/shipping-zones/page.tsx
```

**Features:**
- Listar zonas de entrega
- Adicionar nova zona
- Configurar cidades/bairros
- Definir preço e prazo
- Frete grátis acima de X

---

### Fase 7: Storefront (Loja Pública) (4-6 dias)

#### 7.1. Página inicial da loja

**Arquivo:**
```
src/app/(storefront)/page.tsx
```

**Features:**
- Listar produtos em destaque
- Listar todas as categorias
- Banner principal
- Informações de contato
- Cores personalizadas do tenant

**Hooks necessários:**
```typescript
// src/hooks/useTenant.ts
export function useTenant() {
  // Buscar tenant pelos headers ou hostname
  // Retornar dados do tenant (logo, cores, etc)
}
```

#### 7.2. Página de produtos

**Arquivo:**
```
src/app/(storefront)/produtos/page.tsx
```

**Features:**
- Grid de produtos
- Filtro por categoria
- Busca
- Ordenação (preço, nome, novos)

#### 7.3. Detalhe do produto

**Arquivo:**
```
src/app/(storefront)/produtos/[slug]/page.tsx
```

**Features:**
- Galeria de imagens
- Informações do produto
- Seleção de variações
- Botão "Adicionar ao carrinho"
- Produtos relacionados

#### 7.4. Carrinho (Estado global)

**Store Zustand:**
```typescript
// src/store/cartStore.ts
interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
  variant?: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  total: number
}
```

**Componente:**
```
src/components/storefront/CartDrawer.tsx
```

#### 7.5. Checkout

**Arquivo:**
```
src/app/(storefront)/checkout/page.tsx
```

**Features:**
- Formulário de dados do cliente
- Seleção de forma de pagamento
- Seleção de forma de entrega (com cálculo de frete)
- Resumo do pedido
- Finalizar pedido
- Gerar mensagem do WhatsApp
- Redirecionar para WhatsApp

**Fluxo:**
1. Cliente preenche dados
2. Seleciona pagamento e entrega
3. Clica em "Finalizar pedido"
4. Sistema cria pedido no banco
5. Gera mensagem formatada
6. Redireciona para `wa.me/{telefone}?text={mensagem}`

---

### Fase 8: Domínios Customizados (2-3 dias)

#### 8.1. Painel de domínios

**Arquivo:**
```
src/app/(dashboard)/dashboard/settings/domains/page.tsx
```

**Features:**
- Visualizar subdomínio atual
- Adicionar domínio customizado
- Verificar DNS
- Status do SSL

#### 8.2. API para Vercel

**Arquivo:**
```
src/app/api/domains/route.ts
```

**Features:**
- Adicionar domínio na Vercel
- Verificar DNS
- Remover domínio

**Código exemplo:**
```typescript
// Usar Vercel API
const response = await fetch(
  `https://api.vercel.com/v9/projects/${projectId}/domains`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
    },
    body: JSON.stringify({ name: domain }),
  }
)
```

---

### Fase 9: Testes e Refinamentos (3-5 dias)

- Testar todos os fluxos
- Responsividade mobile
- Performance (Next.js Image, lazy loading)
- SEO (metadata dinâmica por tenant)
- Acessibilidade
- Tratamento de erros
- Loading states
- Validações de formulário

---

## 🎯 Ordem de Prioridade

**Prioridade Alta (MVP):**
1. Autenticação ✅
2. Dashboard base ✅
3. CRUD de produtos ✅
4. Storefront (catálogo público) ✅
5. Checkout + WhatsApp ✅
6. Gestão de pedidos ✅

**Prioridade Média:**
7. Configurações da loja
8. Formas de pagamento
9. Zonas de entrega
10. Upload de logo

**Prioridade Baixa (pós-MVP):**
11. Domínios customizados
12. Categorias
13. Relatórios
14. Analytics

---

## 📦 Componentes Reutilizáveis

Criar pasta `src/components/ui/` com componentes base:

```
src/components/ui/
├── Button.tsx
├── Input.tsx
├── Select.tsx
├── Textarea.tsx
├── Card.tsx
├── Badge.tsx
├── Dialog.tsx
├── Dropdown.tsx
├── Tabs.tsx
├── Table.tsx
└── Modal.tsx
```

Usar shadcn/ui para accelerar:
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card dialog
```

---

## 🔧 Dicas de Desenvolvimento

### Server Components vs Client Components

**Use Server Components quando:**
- Buscar dados do banco
- Renderizar páginas estáticas
- SEO é importante

**Use Client Components quando:**
- Precisa de interatividade (onClick, onChange)
- Usar hooks (useState, useEffect)
- Acessar APIs do browser

### Caching e Revalidação

```typescript
// Revalidar dados a cada 60 segundos
export const revalidate = 60

// Forçar revalidação após mutation
import { revalidatePath } from 'next/cache'
revalidatePath('/dashboard/products')
```

### Server Actions

```typescript
// src/app/actions/products.ts
'use server'

export async function createProduct(formData: FormData) {
  const supabase = createClient()
  
  // Validação
  // Inserção no banco
  // Revalidação
  
  revalidatePath('/dashboard/products')
}
```

---

## 📚 Recursos Úteis

**Next.js 14:**
- [App Router](https://nextjs.org/docs/app)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)

**Supabase:**
- [Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage](https://supabase.com/docs/guides/storage)

**shadcn/ui:**
- [Components](https://ui.shadcn.com/docs/components)
- [Themes](https://ui.shadcn.com/themes)

---

## 🚨 Atenção

**Segurança:**
- Sempre valide dados no servidor
- Use RLS do Supabase corretamente
- Sanitize inputs
- Proteja API routes

**Performance:**
- Use Next.js Image
- Lazy load componentes pesados
- Implemente paginação
- Use indexes no banco

**UX:**
- Loading states em todas as ações
- Mensagens de erro claras
- Feedback de sucesso
- Responsividade mobile-first

---

## 💡 Sugestões de Melhorias Futuras

1. **Analytics Dashboard**
   - Vendas do mês
   - Produtos mais vendidos
   - Gráficos de crescimento

2. **Sistema de Cupons**
   - Criar cupons de desconto
   - Aplicar no checkout
   - Rastrear uso

3. **Gateway de Pagamento**
   - Integração com Mercado Pago
   - Pagamento online
   - Confirmação automática

4. **Notificações**
   - Email para novo pedido
   - Push notifications
   - WhatsApp API oficial

5. **App Mobile**
   - React Native
   - Expo
   - Push notifications

6. **Multi-usuário**
   - Adicionar funcionários
   - Permissões granulares
   - Logs de atividade

---

## ✉️ Contato para Dúvidas

Se tiver dúvidas durante o desenvolvimento, consulte:
- Documentação oficial (Next.js, Supabase)
- Arquivo ARQUITETURA.md
- README.md

---

**Boa sorte no desenvolvimento! 🚀**
