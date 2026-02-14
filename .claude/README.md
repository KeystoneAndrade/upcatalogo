# 🛍️ UP Catálogo v2

Plataforma SaaS multi-tenant para criação de catálogos digitais e lojas online com checkout via WhatsApp.

## 🚀 Stack

- **Frontend/Backend**: Next.js 14+ (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + shadcn/ui
- **Hosting**: Vercel
- **Language**: TypeScript

## 📋 Pré-requisitos

- Node.js 18+ 
- npm 9+
- Conta no Supabase
- Conta na Vercel (para deploy)

## 🔧 Setup do Projeto

### 1. Clone o repositório

```bash
git clone <repo-url>
cd upcatalogo-v2
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o Supabase

#### 3.1. Crie um projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote o `Project URL` e `anon public key`

#### 3.2. Execute o schema SQL

1. No Dashboard do Supabase, vá em **SQL Editor**
2. Cole o conteúdo do arquivo `supabase-schema.sql`
3. Execute o script (Run)

#### 3.3. Configure o Storage

No Dashboard do Supabase, vá em **Storage** e crie os buckets:

- `tenant-logos` (public)
- `product-images` (public)

Políticas de acesso:
```sql
-- tenant-logos: permitir leitura pública
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'tenant-logos');

-- tenant-logos: lojistas podem fazer upload
CREATE POLICY "Authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'tenant-logos' AND
    auth.role() = 'authenticated'
  );

-- product-images: permitir leitura pública
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- product-images: lojistas podem fazer upload
CREATE POLICY "Authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
  );
```

### 4. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
SUPABASE_PROJECT_ID=seu-project-id

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_DOMAIN=upcatalogo.com.br
```

### 5. Gere os types do Supabase

```bash
npm run supabase:types
```

### 6. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Rotas Next.js (App Router)
│   ├── (auth)/            # Grupo de rotas de autenticação
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/       # Grupo de rotas do dashboard (protegido)
│   │   └── dashboard/
│   │       ├── products/
│   │       ├── orders/
│   │       └── settings/
│   ├── (storefront)/      # Grupo de rotas da loja (público)
│   │   ├── page.tsx       # Página inicial da loja
│   │   ├── produtos/
│   │   └── checkout/
│   ├── api/               # API routes
│   ├── globals.css
│   └── layout.tsx
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── dashboard/        # Componentes do dashboard
│   └── storefront/       # Componentes da loja
├── lib/                  # Bibliotecas e utilitários
│   ├── supabase/        # Clientes Supabase
│   └── utils.ts         # Funções auxiliares
├── types/               # TypeScript types
│   └── supabase.ts     # Types gerados do Supabase
├── hooks/              # React hooks customizados
├── store/              # Zustand stores
└── middleware.ts       # Middleware do Next.js
```

## 🎯 Funcionalidades

### MVP (Fase 1)

- [x] Autenticação de lojistas (Supabase Auth)
- [x] Multi-tenancy (subdomínio + domínio customizado)
- [x] CRUD de produtos
- [x] Sistema de categorias
- [x] Gestão de zonas de entrega
- [x] Gestão de formas de pagamento
- [x] Checkout com redirecionamento para WhatsApp
- [x] Painel de pedidos
- [x] Configurações da loja (logo, cores, contatos)

### Fase 2 (Futuro)

- [ ] Gateway de pagamento (Mercado Pago/Stripe)
- [ ] Sistema de cupons
- [ ] Relatórios e analytics
- [ ] Notificações por email
- [ ] Multi-usuário por loja

## 🔐 Autenticação

### Lojistas

Autenticação via Supabase Auth:
- Cadastro com email/senha
- Login
- Reset de senha
- JWT token automático

### Clientes

Checkout anônimo (sem necessidade de cadastro):
- Dados salvos apenas no pedido
- Opcional: sistema de rastreamento por token

## 🌐 Multi-Tenancy

### Subdomínios

```
lojista1.upcatalogo.com.br → Busca tenant pelo subdomain
lojista2.upcatalogo.com.br → Busca tenant pelo subdomain
```

### Domínios Customizados

```
minhaloja.com.br → Busca tenant pelo custom_domain
```

O middleware (`src/middleware.ts`) identifica automaticamente o tenant e injeta o `tenant_id` nos headers.

## 📱 WhatsApp Checkout

Ao finalizar o pedido, o cliente é redirecionado para o WhatsApp do lojista com uma mensagem pré-formatada:

```
Olá! Gostaria de fazer um pedido:

🛍️ *Pedido #12345678*

📦 *Produtos:*
- 2x Produto A (R$ 100,00)
- 1x Produto B (R$ 50,00)

💰 *Total:* R$ 250,00

📍 *Entrega:*
Rua X, 123 - Bairro Y
Cidade Z - SP

💳 *Pagamento:* PIX

_Gerado via upcatalogo.com.br_
```

## 🚀 Deploy na Vercel

### 1. Conecte seu repositório

1. Acesse [vercel.com](https://vercel.com)
2. Importe o repositório
3. Configure as variáveis de ambiente

### 2. Configuração de domínio

Para wildcard subdomain (*.upcatalogo.com.br):

1. Adicione o domínio no projeto Vercel
2. Configure DNS:
   - `A` record: `@ → 76.76.21.21`
   - `CNAME` record: `* → cname.vercel-dns.com`

### 3. SSL Automático

A Vercel gera certificados SSL automaticamente para:
- Domínio principal
- Wildcard subdomains
- Domínios customizados (quando configurados)

## 🧪 Testing

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format
```

## 📊 Monitoramento

- **Vercel Analytics**: Performance automático
- **Supabase Dashboard**: Queries, auth, storage
- **Logs**: Vercel Function Logs

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Start (produção local)
npm start

# Gerar types do Supabase
npm run supabase:types

# Lint
npm run lint

# Format
npm run format
```

## 📚 Documentação

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT.

## 👥 Equipe

- **Desenvolvimento**: [Seu Nome]
- **Design**: [Nome do Designer]

## 📞 Suporte

- Email: suporte@upcatalogo.com.br
- WhatsApp: (11) 99999-9999

---

Feito com ❤️ por UP Catálogo
