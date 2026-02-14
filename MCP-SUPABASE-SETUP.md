# Setup MCP Supabase - UP Catalogo

## O que é MCP?
MCP (Model Context Protocol) permite que Claude interaja diretamente com ferramentas externas como Supabase, sem precisar usar a API manual.

## ✅ Configuracao Realizada

O arquivo `.mcp.json` já foi criado na raiz do projeto com:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
```

---

## 🚀 Proximos Passos

### 1. Reiniciar Claude Code
- Saia do Claude Code completamente
- Abra novamente o diretorio `C:\upcatalogo`
- O Claude Code vai detectar o `.mcp.json`

### 2. Verificar Status do MCP
Execute no chat:
```
/mcp
```

Ou rode no terminal:
```bash
claude mcp list
```

### 3. Autenticar com Supabase (Primeira Vez)
- Claude vai abrir uma aba do navegador automaticamente
- Faça login com sua **conta Supabase**
- Autorize o acesso
- O token sera armazenado localmente de forma segura

### 4. Confirmar Conexao
Apos autenticar, teste:
```
Quais sao as tabelas do meu banco Supabase?
```

Claude vai listar: `tenants`, `categories`, `products`, `orders`, `payment_methods`, `shipping_zones`

---

## 📋 O que Voce Pode Fazer com o MCP

### Queries (SELECT)
```
Quantos pedidos foram criados hoje?
Mostre os 5 ultimos produtos cadastrados
Liste os pagamentos que estao ativos
```

### Insercoes (INSERT)
```
Crie uma categoria chamada "Eletronicos"
Adicione uma zona de entrega para Sao Paulo com frete de R$ 15
```

### Atualizacoes (UPDATE)
```
Mude o status do pedido #12345 para "shipped"
Ative todos os metodos de pagamento
```

### Delecoes (DELETE)
```
Remova a categoria "Teste"
Exclua a zona de entrega "Inativa"
```

### Schemas
```
Mostre a estrutura da tabela produtos
Qual e o tipo de dado da coluna price?
```

---

## 🔒 Opcoes de Seguranca (Opcional)

Se quiser modo **read-only** (apenas consultas):

Edite `.mcp.json`:
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

Se quiser limitar a um **projeto especifico**:
```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=SEU_PROJECT_ID"
    }
  }
}
```

---

## 📚 Exemplos Praticos

### Ver estatisticas da loja
```
Quantos produtos tem cadastrados?
Qual foi o valor total de vendas?
Quantos pedidos estao pendentes?
```

### Gerenciar dados
```
Desative todos os produtos que estao sem estoque
Atualize o telefone WhatsApp do tenant para 5511999999999
Mostre todos os clientes que compraram mais de 2 vezes
```

### Gerar relatorios
```
Quais foram os 10 produtos mais vendidos?
Qual e o tempo medio entre pedido e confirmacao?
Quantos pedidos foram entregues este mes?
```

---

## 🐛 Troubleshooting

### MCP nao aparece
- Reinicie Claude Code completamente
- Verifique se `.mcp.json` esta na raiz do projeto
- Execute `claude mcp list`

### Erro de autenticacao
- Limpe o cache: remova `~/.claude/mcp` se existir
- Faca login novamente com `/mcp`

### Permissao negada
- Verifique se sua conta Supabase tem acesso ao projeto
- Se usar `read_only=true`, nao pode fazer writes

---

## 📖 Documentacao Oficial

- [Supabase MCP Docs](https://supabase.com/docs/guides/getting-started/mcp)
- [Claude Code MCP Guide](https://code.claude.com/docs/en/mcp.md)

---

**Status**: ✅ Configurado e pronto para usar!
