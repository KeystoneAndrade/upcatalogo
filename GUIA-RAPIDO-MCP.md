# 🚀 Guia Rápido - MCP Supabase (5 minutos)

## ✅ Ja Configurado

O arquivo `.mcp.json` ja esta na raiz do projeto. Pronto para usar!

---

## 3 Passos para Ativar

### 1️⃣ Reiniciar Claude Code
```
Saia completamente e abra novamente em C:\upcatalogo
```

### 2️⃣ Autenticar
```
/mcp
```
Vai abrir navegador → Faça login no Supabase → Autorize

### 3️⃣ Testar
```
Quantos produtos estao cadastrados?
```

**Pronto!** Claude vai responder consultando o banco em tempo real.

---

## 📝 Comandos Mais Usados

| Acao | Comando |
|------|---------|
| Ver produtos | "Mostre os ultimos 10 produtos" |
| Ver pedidos | "Quantos pedidos pendentes existem?" |
| Criar categoria | "Crie categoria 'Moda' com slug 'moda'" |
| Atualizar pedido | "Mude pedido #12345 para status 'shipped'" |
| Listar clientes | "Quem sao os top 5 clientes?" |
| Analytics | "Qual foi a receita total?" |

---

## 🎯 Casos de Uso

### Monitorar Loja
```
Quantos pedidos chegaram hoje?
Qual foi a receita?
Que produtos estao com baixo estoque?
```

### Gerenciar Dados
```
Desative os produtos inativos
Atualize a zona de entrega "Centro"
Crie novo metodo de pagamento
```

### Gerar Relatorios
```
Quais foram os 10 produtos mais vendidos?
Qual e o tempo medio de entrega?
Qual categoria vende mais?
```

### Debug
```
Verifique se a categoria foi criada
Mostre o ultimo pedido
Liste todos os pedidos do cliente X
```

---

## 🔒 Seguranca (Opcional)

Para **apenas LEITURA**, edite `.mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?read_only=true"
    }
  }
}
```

Reinicie Claude Code apos editar.

---

## 📚 Docs Completas

- `MCP-SUPABASE-SETUP.md` - Setup detalhado
- `SUPABASE-MCP-EXEMPLOS.md` - 50+ exemplos prontos
- `ARQUITETURA.md` - Schema do banco
- `PROXIMOS-PASSOS.md` - Desenvolvimento

---

## ⚡ Primeiro Comando

Copie e cole no chat:

```
Mostre um resumo do banco Supabase:
- Quantos produtos?
- Quantos pedidos?
- Quantas categorias?
- Quais metodos de pagamento estao ativos?
```

Claude vai responder em **segundos** consultando o banco via MCP!

---

**Tudo pronto!** 🎉 Reinicie e comece a usar.
