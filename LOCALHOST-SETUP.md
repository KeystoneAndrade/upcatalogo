# 🚀 Setup Localhost - UP Catalogo v2

## 3 Passos Simples

### 1️⃣ Criar Projeto Supabase Gratis

1. Acesse: https://supabase.com
2. Clique em **"Start your project"**
3. Crie uma conta (email/senha ou GitHub)
4. Crie um novo projeto:
   - **Project name**: `upcatalogo-dev` (ou qualquer nome)
   - **Password**: Crie uma senha
   - **Region**: São Paulo (ou sua regiao)
5. Aguarde 1-2 minutos enquanto o projeto e criado

---

### 2️⃣ Copiar Credenciais

Apos o projeto ser criado:

1. Va em **Settings** (engrenagem) → **API**
2. Em **Project URL**, copie a URL completa
   - Parecido com: `https://xyzabc.supabase.co`
3. Em **Project API Keys**, copie a **anon public** key
   - Parecido com: `eyJhbGciOi...`

---

### 3️⃣ Preencher `.env.local`

Abra o arquivo `C:\upcatalogo\.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-aqui.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_DOMAIN=localhost
```

**Exemplo real:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://wxyzzkhcnwmlpqqsxyzz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_DOMAIN=localhost
```

---

## 🗄️ Executar Schema do Banco

Apos preencher `.env.local`:

1. No **Supabase Dashboard**, va em **SQL Editor**
2. Clique em **"New Query"**
3. Copie todo o conteudo de `C:\upcatalogo\supabase-schema.sql`
4. Cole no editor SQL
5. Clique em **"Run"**
6. Espere terminar (deve dizer "Success")

---

## ▶️ Rodar Localhost

Terminal no diretorio `C:\upcatalogo`:

```bash
npm run dev
```

Ou com yarn/pnpm:
```bash
yarn dev
pnpm dev
```

**Saida esperada:**
```
▲ Next.js 14.2.35
- Local:        http://localhost:3000
- Environments: .env.local
```

---

## 🌐 Acessar a Aplicacao

Abra no navegador:

### Landing Page
- http://localhost:3000

### Criar Loja (Signup)
- http://localhost:3000/auth/signup
- Preencha:
  - **Nome da Loja**: Minha Loja
  - **Email**: seu@email.com
  - **Senha**: 123456
  - **WhatsApp**: 5511999999999

### Dashboard (Apos Signup)
- http://localhost:3000/dashboard

### Acessar Loja Publica
- http://localhost:3000

---

## 🎯 Fluxo Completo

1. **Signup** → Cria usuário + tenant automaticamente
2. **Dashboard** → Gerenciar produtos, pedidos, configuracoes
3. **Adicionar Produto** → Nome, preco, imagem
4. **Acessar Loja Publica** → Ver produtos no catálogo
5. **Fazer Pedido** → Preencher dados + checkout
6. **WhatsApp** → Redirect para wa.me com pedido formatado

---

## 📱 Testar em Mobile

Se quiser testar em celular da mesma rede:

1. Descubra o IP local:
   ```bash
   ipconfig
   ```
   Procure por **IPv4 Address** (ex: 192.168.1.100)

2. Acesse do celular:
   ```
   http://192.168.1.100:3000
   ```

---

## 🐛 Troubleshooting

### "Cannot find module @supabase/ssr"
```bash
npm install
```

### "NEXT_PUBLIC_SUPABASE_URL is required"
- Verifique se `.env.local` foi preenchido corretamente
- Salve o arquivo
- Reinicie o servidor (`npm run dev`)

### "Forbidden" ao fazer signup
- Verifique se o schema SQL foi executado no Supabase
- Verifique as tabelas em **SQL Editor** → **Tables**

### Banco vazio
- Copie novamente todo o conteudo de `supabase-schema.sql`
- Execute no **SQL Editor** do Supabase
- Verifique se as tabelas foram criadas

### Middleware error
- Certifique-se de que `NEXT_PUBLIC_APP_DOMAIN=localhost` (sem porta)

---

## 🚀 Dicas

### Limpar dados
Para resetar o banco:
```sql
-- No SQL Editor do Supabase
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS shipping_zones CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
```
Depois execute `supabase-schema.sql` novamente.

### Ver logs
```bash
# Terminal onde rodou npm run dev
# Pressione Ctrl+Shift+K para ver todos os logs
```

### Debugar banco
No **Supabase Dashboard** → **SQL Editor**:
```sql
SELECT * FROM tenants;
SELECT * FROM products;
SELECT * FROM orders;
```

---

## ✅ Checklist

- [ ] Criou projeto Supabase
- [ ] Copiou URL e Anon Key
- [ ] Preencheu `.env.local`
- [ ] Executou `supabase-schema.sql`
- [ ] Rodou `npm run dev`
- [ ] Acessou http://localhost:3000
- [ ] Fez signup com sucesso
- [ ] Acessou dashboard
- [ ] Adicionou um produto
- [ ] Visualizou no catálogo publico

---

## 🎉 Tudo Pronto!

Agora você tem a aplicação rodando localmente com banco de dados real no Supabase.

**Proximas etapas:**
1. Adicionar produtos
2. Configurar metodos de pagamento e entregas
3. Customizar cores e logo da loja
4. Fazer pedidos de teste
5. Deploy na Vercel (quando estiver pronto)

---

**Dúvidas?** Consulte:
- `README.md` - Setup geral
- `ARQUITETURA.md` - Design do sistema
- `PROXIMOS-PASSOS.md` - Roadmap completo
