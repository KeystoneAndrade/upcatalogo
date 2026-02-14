# ✅ Checklist de Implementação - UP Catálogo v2

Use este checklist para acompanhar o progresso do desenvolvimento.

## 🎯 Setup Inicial

- [ ] Criar projeto no Supabase
- [ ] Executar `supabase-schema.sql` no SQL Editor
- [ ] Configurar Storage buckets (tenant-logos, product-images)
- [ ] Configurar políticas de Storage
- [ ] Copiar credenciais para `.env.local`
- [ ] Instalar dependências (`npm install`)
- [ ] Gerar types do Supabase (`npm run supabase:types`)
- [ ] Testar `npm run dev`

---

## 🔐 Autenticação

### Páginas
- [ ] Criar `src/app/(auth)/layout.tsx`
- [ ] Criar `src/app/(auth)/login/page.tsx`
- [ ] Criar `src/app/(auth)/signup/page.tsx`

### Funcionalidades
- [ ] Formulário de login
- [ ] Formulário de cadastro
- [ ] Validação com Zod
- [ ] Criar usuário no Supabase Auth
- [ ] Criar tenant automaticamente no signup
- [ ] Redirecionamento após login
- [ ] Mensagens de erro/sucesso (toast)
- [ ] Link "Esqueci minha senha"
- [ ] Página de reset de senha

### Testes
- [ ] Cadastrar novo lojista
- [ ] Fazer login
- [ ] Verificar criação do tenant no banco
- [ ] Logout

---

## 📊 Dashboard - Base

### Layout
- [ ] Criar `src/app/(dashboard)/layout.tsx`
- [ ] Criar componente `Sidebar.tsx`
- [ ] Criar componente `Header.tsx`
- [ ] Implementar navegação
- [ ] Botão de logout
- [ ] User menu com avatar

### Dashboard Home
- [ ] Criar `src/app/(dashboard)/dashboard/page.tsx`
- [ ] Card com total de produtos
- [ ] Card com total de pedidos
- [ ] Card com pedidos pendentes
- [ ] Lista de pedidos recentes
- [ ] Gráfico de vendas (opcional)

### Testes
- [ ] Navegar entre páginas do dashboard
- [ ] Verificar dados estatísticos
- [ ] Logout funciona

---

## 🛍️ Gestão de Produtos

### Listar Produtos
- [ ] Criar `src/app/(dashboard)/dashboard/products/page.tsx`
- [ ] Buscar produtos do tenant logado
- [ ] Exibir grid/lista de produtos
- [ ] Campo de busca
- [ ] Filtro por categoria
- [ ] Botão "Novo Produto"
- [ ] Ações: editar, excluir, ativar/desativar
- [ ] Paginação (se necessário)

### Novo Produto
- [ ] Criar `src/app/(dashboard)/dashboard/products/new/page.tsx`
- [ ] Criar componente `ProductForm.tsx`
- [ ] Campos: nome, descrição, preço, SKU
- [ ] Upload de imagens (Supabase Storage)
- [ ] Seleção de categoria
- [ ] Tags
- [ ] Gestão de estoque
- [ ] Preço "de" (compare_at_price)
- [ ] Produto ativo/inativo
- [ ] Produto em destaque
- [ ] Variações (opcional MVP)
- [ ] Preview do produto
- [ ] Salvar produto

### Editar Produto
- [ ] Criar `src/app/(dashboard)/dashboard/products/[id]/edit/page.tsx`
- [ ] Carregar dados do produto
- [ ] Reutilizar `ProductForm.tsx`
- [ ] Atualizar produto
- [ ] Excluir produto

### Componentes
- [ ] `src/components/dashboard/products/ProductForm.tsx`
- [ ] `src/components/dashboard/products/ImageUpload.tsx`
- [ ] `src/components/dashboard/products/ProductCard.tsx`

### Testes
- [ ] Criar produto novo
- [ ] Upload de imagens
- [ ] Editar produto existente
- [ ] Excluir produto
- [ ] Buscar produtos
- [ ] Filtrar por categoria

---

## 📦 Gestão de Pedidos

### Listar Pedidos
- [ ] Criar `src/app/(dashboard)/dashboard/orders/page.tsx`
- [ ] Buscar pedidos do tenant
- [ ] Filtro por status
- [ ] Busca por número/cliente
- [ ] Badge de status (pending, confirmed, etc)
- [ ] Data do pedido
- [ ] Valor total
- [ ] Link para detalhes

### Detalhes do Pedido
- [ ] Criar `src/app/(dashboard)/dashboard/orders/[id]/page.tsx`
- [ ] Informações do cliente
- [ ] Endereço de entrega
- [ ] Itens do pedido
- [ ] Valores (subtotal, frete, total)
- [ ] Forma de pagamento
- [ ] Timeline de status
- [ ] Atualizar status
- [ ] Adicionar notas internas
- [ ] Botão "Abrir no WhatsApp"

### Componentes
- [ ] `src/components/dashboard/orders/OrderCard.tsx`
- [ ] `src/components/dashboard/orders/OrderTimeline.tsx`
- [ ] `src/components/dashboard/orders/StatusBadge.tsx`

### Testes
- [ ] Ver lista de pedidos
- [ ] Filtrar por status
- [ ] Ver detalhes do pedido
- [ ] Atualizar status
- [ ] Adicionar notas

---

## ⚙️ Configurações da Loja

### Geral
- [ ] Criar `src/app/(dashboard)/dashboard/settings/page.tsx`
- [ ] Editar nome da loja
- [ ] Upload de logo
- [ ] Seleção de cor primária (color picker)
- [ ] Seleção de cor secundária
- [ ] WhatsApp
- [ ] Email
- [ ] Instagram
- [ ] Salvar alterações

### Formas de Pagamento
- [ ] Criar `src/app/(dashboard)/dashboard/settings/payment-methods/page.tsx`
- [ ] Listar formas de pagamento
- [ ] Adicionar nova forma
- [ ] Editar forma existente
- [ ] Instruções para o cliente
- [ ] Ativar/desativar
- [ ] Ordenar (drag and drop - opcional)

### Zonas de Entrega
- [ ] Criar `src/app/(dashboard)/dashboard/settings/shipping-zones/page.tsx`
- [ ] Listar zonas
- [ ] Adicionar nova zona
- [ ] Editar zona existente
- [ ] Cidades atendidas
- [ ] Preço do frete
- [ ] Frete grátis acima de X
- [ ] Prazo de entrega
- [ ] Ativar/desativar

### Testes
- [ ] Alterar logo
- [ ] Alterar cores
- [ ] Adicionar forma de pagamento
- [ ] Adicionar zona de entrega
- [ ] Verificar no storefront

---

## 🏪 Storefront (Loja Pública)

### Infraestrutura
- [ ] Criar hook `useTenant()`
- [ ] Criar store `useCartStore()` (Zustand)
- [ ] Criar `src/app/(storefront)/layout.tsx`

### Página Inicial
- [ ] Criar `src/app/(storefront)/page.tsx`
- [ ] Header com logo do tenant
- [ ] Menu de categorias
- [ ] Produtos em destaque
- [ ] Botão carrinho flutuante
- [ ] Footer com contatos
- [ ] Aplicar cores do tenant

### Catálogo de Produtos
- [ ] Criar `src/app/(storefront)/produtos/page.tsx`
- [ ] Grid de produtos
- [ ] Card do produto (imagem, nome, preço)
- [ ] Busca
- [ ] Filtro por categoria
- [ ] Ordenação
- [ ] Badge "Promoção" (se compare_at_price)

### Detalhe do Produto
- [ ] Criar `src/app/(storefront)/produtos/[slug]/page.tsx`
- [ ] Galeria de imagens
- [ ] Nome e descrição
- [ ] Preço
- [ ] Seleção de variações
- [ ] Quantidade
- [ ] Botão "Adicionar ao carrinho"
- [ ] Produtos relacionados

### Carrinho
- [ ] Criar `src/components/storefront/CartDrawer.tsx`
- [ ] Lista de itens no carrinho
- [ ] Atualizar quantidade
- [ ] Remover item
- [ ] Total
- [ ] Botão "Finalizar pedido"

### Checkout
- [ ] Criar `src/app/(storefront)/checkout/page.tsx`
- [ ] Formulário de dados do cliente (nome, telefone, email)
- [ ] Formulário de endereço
- [ ] Seleção de forma de pagamento
- [ ] Seleção de zona de entrega
- [ ] Cálculo de frete
- [ ] Resumo do pedido
- [ ] Campo de observações
- [ ] Botão "Finalizar pedido"

### Finalização
- [ ] Criar pedido no banco
- [ ] Gerar mensagem do WhatsApp
- [ ] Redirecionar para `wa.me`
- [ ] Limpar carrinho
- [ ] Página de confirmação (opcional)

### Componentes
- [ ] `src/components/storefront/ProductCard.tsx`
- [ ] `src/components/storefront/ProductGallery.tsx`
- [ ] `src/components/storefront/CartDrawer.tsx`
- [ ] `src/components/storefront/Header.tsx`
- [ ] `src/components/storefront/Footer.tsx`

### Testes
- [ ] Acessar loja via subdomínio
- [ ] Navegar no catálogo
- [ ] Ver produto
- [ ] Adicionar ao carrinho
- [ ] Atualizar quantidade
- [ ] Remover do carrinho
- [ ] Fazer checkout completo
- [ ] Verificar mensagem do WhatsApp
- [ ] Verificar pedido criado no dashboard

---

## 🌐 Multi-Tenancy

### Subdomínios
- [ ] Middleware detecta subdomínio
- [ ] Busca tenant no banco
- [ ] Injeta tenant_id nos headers
- [ ] RLS filtra dados automaticamente

### Testes
- [ ] Criar 2 lojas diferentes
- [ ] Acessar cada uma pelo subdomínio
- [ ] Verificar isolamento de dados
- [ ] Logar em cada dashboard separadamente

---

## 🚀 Deploy e Produção

### Vercel
- [ ] Criar projeto na Vercel
- [ ] Conectar repositório GitHub
- [ ] Configurar variáveis de ambiente
- [ ] Deploy inicial
- [ ] Configurar domínio principal
- [ ] Configurar wildcard subdomain (*.upcatalogo.com.br)
- [ ] Verificar SSL

### DNS
- [ ] Configurar registros DNS
- [ ] A record para domínio principal
- [ ] CNAME para wildcard
- [ ] Aguardar propagação

### Testes em Produção
- [ ] Acessar domínio principal
- [ ] Criar loja de teste
- [ ] Acessar pelo subdomínio
- [ ] Verificar SSL
- [ ] Testar checkout completo
- [ ] Verificar WhatsApp redirect

---

## 🎨 Polish e Refinamentos

### UX/UI
- [ ] Loading states em todas as ações
- [ ] Skeleton loaders
- [ ] Animações suaves
- [ ] Toast notifications
- [ ] Confirmações de ações críticas (delete)
- [ ] Empty states (sem produtos, sem pedidos)
- [ ] Error states
- [ ] Validação de formulários
- [ ] Máscaras de input (telefone, CEP)

### Responsividade
- [ ] Mobile - Landing page
- [ ] Mobile - Auth
- [ ] Mobile - Dashboard
- [ ] Mobile - Storefront
- [ ] Mobile - Checkout
- [ ] Tablet - Todas as páginas
- [ ] Desktop - Todas as páginas

### Performance
- [ ] Next.js Image em todas as imagens
- [ ] Lazy loading de componentes pesados
- [ ] Paginação onde necessário
- [ ] Debounce em campos de busca
- [ ] Otimizar queries do Supabase

### SEO
- [ ] Metadata dinâmica por tenant
- [ ] Open Graph tags
- [ ] Sitemap.xml
- [ ] Robots.txt
- [ ] Schema.org markup (produtos)

### Acessibilidade
- [ ] Alt text em imagens
- [ ] Labels em inputs
- [ ] Navegação por teclado
- [ ] Contraste de cores adequado
- [ ] ARIA labels

---

## 📊 Pós-MVP

### Analytics
- [ ] Dashboard de vendas
- [ ] Gráfico de crescimento
- [ ] Produtos mais vendidos
- [ ] Origem dos pedidos

### Cupons
- [ ] CRUD de cupons
- [ ] Tipos: percentual, valor fixo
- [ ] Aplicar no checkout
- [ ] Validações

### Notificações
- [ ] Email ao lojista (novo pedido)
- [ ] Email ao cliente (confirmação)
- [ ] Push notifications

### Domínios Customizados
- [ ] Painel de domínios
- [ ] Adicionar domínio customizado
- [ ] Verificação de DNS
- [ ] Integração com Vercel API
- [ ] Status do SSL

---

## 📝 Documentação

- [ ] README.md completo
- [ ] Guia de instalação
- [ ] Guia de uso (lojista)
- [ ] Troubleshooting
- [ ] Changelog
- [ ] API documentation (se expor API)

---

## 🧪 Testes

### Manual
- [ ] Criar loja
- [ ] Adicionar produtos
- [ ] Receber pedido
- [ ] Processar pedido
- [ ] Fluxo completo end-to-end

### Automatizado (futuro)
- [ ] Testes unitários (Jest)
- [ ] Testes de integração
- [ ] Testes E2E (Cypress/Playwright)

---

## 🎉 Launch

- [ ] Testar com lojistas beta
- [ ] Coletar feedback
- [ ] Ajustes finais
- [ ] Deploy final
- [ ] Anúncio oficial
- [ ] Onboarding de lojistas
- [ ] Suporte ativo

---

**Última atualização:** 2026-02-13

---

## 📊 Progresso Geral

Calcule seu progresso:
- **Setup Inicial:** 0/8
- **Autenticação:** 0/13
- **Dashboard Base:** 0/10
- **Produtos:** 0/23
- **Pedidos:** 0/14
- **Configurações:** 0/18
- **Storefront:** 0/32
- **Multi-tenancy:** 0/4
- **Deploy:** 0/10
- **Polish:** 0/25

**Total:** 0/157 ✅

---

**Dica:** Use este checklist no seu projeto management tool (Notion, Linear, Jira) ou simplesmente marque no próprio arquivo!
