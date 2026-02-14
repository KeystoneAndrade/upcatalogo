# ⚡ QUICKSTART - 10 Minutos

## 1. Criar Supabase (2 min)
```
https://supabase.com
→ Sign up
→ New Project (São Paulo)
→ Aguarde criação
```

## 2. Copiar Credenciais (1 min)
- Settings → API
- Copiar **Project URL**
- Copiar **Anon Public Key**

## 3. Preencher `.env.local` (1 min)
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_DOMAIN=localhost
```

## 4. Executar SQL (2 min)
- Supabase Dashboard → SQL Editor
- New Query
- Copiar conteudo de `supabase-schema.sql`
- Colar e Run

## 5. Rodar Servidor (4 min)
```bash
npm run dev
```

## 6. Testar
- http://localhost:3000
- Clique em "Criar minha loja"
- Preencha dados
- Pronto! ✅

---

**Docs Completas:** `LOCALHOST-SETUP.md`
