# 🛠️ Comandos Úteis e Troubleshooting

## 📦 Instalação e Setup

### Primeiro setup
```bash
# Clonar repositório
git clone <repo-url>
cd upcatalogo-v2

# Instalar dependências
npm install

# Copiar .env
cp .env.example .env.local
# Editar .env.local com suas credenciais

# Gerar types do Supabase
npm run supabase:types

# Iniciar dev server
npm run dev
```

---

## 🚀 Comandos de Desenvolvimento

### Servidor de desenvolvimento
```bash
npm run dev                    # Inicia em http://localhost:3000
npm run dev -- -p 3001        # Inicia em porta customizada
```

### Build e produção
```bash
npm run build                 # Build do projeto
npm run start                 # Inicia servidor de produção
```

### Code quality
```bash
npm run lint                  # ESLint
npm run type-check           # TypeScript check
npm run format               # Prettier
```

### Supabase
```bash
# Gerar types do banco
npm run supabase:types

# Login no Supabase CLI
npx supabase login

# Link ao projeto
npx supabase link --project-ref <project-id>

# Ver logs
npx supabase functions logs

# Migrations (se usar migrations locais)
npx supabase db push
```

---

## 🗄️ Database - Comandos Úteis

### Ver todas as tabelas
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Ver estrutura de uma tabela
```sql
\d tenants
```

### Recriar schema (CUIDADO - apaga tudo)
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Então executar supabase-schema.sql novamente
```

### Backup do banco (via Supabase CLI)
```bash
npx supabase db dump -f backup.sql
```

### Ver políticas RLS de uma tabela
```sql
SELECT * FROM pg_policies WHERE tablename = 'tenants';
```

---

## 🐛 Troubleshooting Comum

### Erro: "Module not found"
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Erro: Types do Supabase não batem
```bash
# Regenerar types
npm run supabase:types
# Restart do dev server
```

### Erro: "Authentication required" no Supabase
```bash
# Verificar variáveis de ambiente
cat .env.local

# Verificar se RLS está ativo
# No Supabase Dashboard > SQL Editor:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

# Se rowsecurity = false, ativar:
ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;
```

### Erro: Next.js build falha
```bash
# Limpar cache do Next
rm -rf .next
npm run build

# Se persistir, verificar erros de TypeScript
npm run type-check
```

### Erro: Imagens não carregam (Supabase Storage)
```sql
-- Verificar políticas do bucket
SELECT * FROM storage.policies WHERE bucket_id = 'tenant-logos';

-- Se não existir, criar:
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'tenant-logos');
```

### Erro: Middleware não detecta tenant
```typescript
// Verificar hostname
console.log('Hostname:', request.nextUrl.hostname)
console.log('Pathname:', request.nextUrl.pathname)

// Testar no browser:
// http://lojateste.localhost:3000
// Ou adicionar no /etc/hosts:
// 127.0.0.1 lojateste.localhost
```

---

## 🔐 Auth - Debug

### Ver usuário logado (Client Component)
```typescript
'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugAuth() {
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      console.log('Session:', data.session)
      console.log('User:', data.session?.user)
    })
  }, [])
  
  return <div>Check console</div>
}
```

### Ver usuário logado (Server Component)
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function DebugAuth() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  return (
    <pre>{JSON.stringify(session, null, 2)}</pre>
  )
}
```

### Forçar logout
```typescript
const supabase = createClient()
await supabase.auth.signOut()
```

---

## 📊 Performance - Debug

### Ver tamanho do bundle
```bash
npm run build
# Verificar output: .next/static/chunks

# Analisar bundle
npm install -D @next/bundle-analyzer
# Adicionar em next.config.js e rodar:
ANALYZE=true npm run build
```

### Ver queries lentas no Supabase
```sql
-- No Supabase Dashboard > SQL Editor
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
```

### Lighthouse no Chrome DevTools
```
F12 > Lighthouse > Generate report
```

---

## 🌐 Domínios - Troubleshooting

### Subdomínio não resolve (localhost)

**Opção 1: Editar /etc/hosts**
```bash
sudo nano /etc/hosts
# Adicionar:
127.0.0.1 lojateste.localhost
127.0.0.1 outralore.localhost
```

**Opção 2: Usar serviço like localhost.run**
```bash
# Fazer tunnel
npx localtunnel --port 3000 --subdomain lojateste
```

### SSL não funciona (produção)

**Verificar DNS:**
```bash
dig seu-dominio.com
nslookup seu-dominio.com
```

**Deve apontar para Vercel:**
```
CNAME: cname.vercel-dns.com
ou
A: 76.76.21.21
```

---

## 🔄 Migrations

### Criar nova migration (se usar)
```bash
npx supabase migration new nome_da_migration
# Editar arquivo em supabase/migrations/
npx supabase db push
```

### Reverter migration
```bash
npx supabase db reset
```

---

## 📱 Testar em Mobile (Local)

### Usando ngrok
```bash
npm install -g ngrok
npm run dev
# Em outro terminal:
ngrok http 3000
# Usar URL do ngrok no celular
```

### Usando Vercel Preview
```bash
vercel
# Usar URL de preview no celular
```

---

## 🧪 Testes (quando implementar)

### Jest
```bash
npm install -D jest @testing-library/react
npm run test
```

### Cypress
```bash
npm install -D cypress
npx cypress open
```

---

## 📦 Deploy

### Deploy na Vercel (primeira vez)
```bash
npm install -g vercel
vercel login
vercel
# Seguir instruções
```

### Deploy automático (GitHub)
```bash
git push origin main
# Vercel faz deploy automaticamente
```

### Deploy preview (PR)
```bash
# Criar PR no GitHub
# Vercel gera preview automaticamente
```

---

## 🔍 Logs e Monitoring

### Ver logs do Supabase
```bash
# No Dashboard > Logs
# Ou via CLI:
npx supabase functions logs
```

### Ver logs da Vercel
```bash
vercel logs
# Ou no Dashboard > Functions > Logs
```

### Console.log no servidor Next.js
```typescript
// Server Component
console.log('Isso aparece no terminal do servidor')

// Client Component
console.log('Isso aparece no browser console')
```

---

## 💾 Backup e Restore

### Backup do banco (Supabase)
```bash
# Via CLI
npx supabase db dump > backup-$(date +%Y%m%d).sql

# Via Dashboard
# Database > Backups > Download
```

### Restore
```bash
# Via psql (se tiver acesso direto)
psql postgresql://... < backup.sql

# Ou no SQL Editor do Supabase (para pequenos backups)
```

---

## 🎨 Customização de Cores (Lojista)

### Aplicar cor do tenant dinamicamente
```typescript
// Server Component que busca tenant
import { createClient } from '@/lib/supabase/server'

export default async function StorefrontLayout({ children }) {
  const supabase = createClient()
  
  // Buscar tenant pelos headers
  const tenantId = headers().get('x-tenant-id')
  const { data: tenant } = await supabase
    .from('tenants')
    .select('primary_color, secondary_color')
    .eq('id', tenantId)
    .single()

  return (
    <div style={{
      '--primary': tenant.primary_color,
      '--secondary': tenant.secondary_color,
    }}>
      {children}
    </div>
  )
}
```

---

## 🚨 Emergências

### Site fora do ar (Vercel)
```bash
# Ver status
vercel inspect <deployment-url>

# Ver logs
vercel logs

# Rollback (deploy anterior)
vercel rollback <deployment-id>
```

### Banco corrompido (raro)
```bash
# Restaurar backup
# Via Supabase Dashboard > Database > Backups

# Ou Point-in-Time Recovery (planos pagos)
```

### RLS bloqueando tudo
```sql
-- TEMPORÁRIO: desabilitar RLS (apenas dev)
ALTER TABLE nome_da_tabela DISABLE ROW LEVEL SECURITY;

-- Depois de debugar, reabilitar:
ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;
```

---

## 🔧 Ferramentas Recomendadas

### VS Code Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- GitLens
- Error Lens
- Supabase (unofficial)

### Chrome Extensions
- React Developer Tools
- Redux DevTools (se usar)
- Lighthouse

### Terminal
- Oh My Zsh
- Fig (autocomplete)
- tldr (comandos simplificados)

---

## 📞 Onde Pedir Ajuda

1. **Documentação oficial**
   - [Next.js Docs](https://nextjs.org/docs)
   - [Supabase Docs](https://supabase.com/docs)
   - [Vercel Docs](https://vercel.com/docs)

2. **Comunidades**
   - Discord do Next.js
   - Discord do Supabase
   - Stack Overflow
   - GitHub Issues

3. **Suporte pago**
   - Vercel Enterprise Support
   - Supabase Pro Support

---

**Última atualização:** 2026-02-13
