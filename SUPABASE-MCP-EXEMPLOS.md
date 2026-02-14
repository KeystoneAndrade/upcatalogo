# Exemplos de Uso - Supabase MCP

Apos configurar o MCP, voce pode executar estes comandos direto no Claude Code:

## 🔍 CONSULTAS (SELECT)

### Ver todas as tabelas
```
Quais sao todas as tabelas do banco de dados?
```

### Produtos
```
Quantos produtos tem cadastrados?
Mostre os 5 ultimos produtos criados
Liste todos os produtos inativos
Qual e o produto mais caro?
Quantos produtos tem estoque zero?
```

### Pedidos
```
Quantos pedidos foram criados hoje?
Mostre os 10 ultimos pedidos
Listar pedidos pendentes
Qual foi o valor total de vendas?
Quantos pedidos foram entregues este mes?
```

### Clientes
```
Quem sao os clientes que mais compraram?
Qual cliente fez a maior compra?
Listar todos os WhatsApp dos clientes
```

### Categorias
```
Quantas categorias existem?
Quais categorias nao tem produtos?
```

### Pagamentos
```
Quantos metodos de pagamento estao ativos?
Quais formas de pagamento sao mais usadas?
```

### Entregas
```
Quantas zonas de entrega existem?
Qual zona tem o frete mais caro?
Quais zonas oferecem frete gratis?
```

---

## ➕ INSERCOES (Insert)

### Criar categoria
```
Crie uma categoria chamada "Eletronicos" com slug "eletronicos"
```

### Criar metodo de pagamento
```
Adicione um metodo de pagamento "Boleto" do tipo "transfer"
```

### Criar zona de entrega
```
Crie uma zona de entrega "Zona Centro" para as cidades ["Sao Paulo", "Guarulhos"]
com frete de R$ 20 e prazo de 1-2 dias
```

### Inserir produto
```
Crie um produto com nome "Teclado Mecanico", preco 250, slug "teclado-mecanico"
```

---

## ✏️ ATUALIZACOES (Update)

### Atualizar produto
```
Mude o preco do produto com slug "teclado-mecanico" para 280
```

### Atualizar pedido
```
Mude o status do pedido #12345678 para "shipped"
Atualize o tracking code do pedido #12345678 para "BR123456789"
```

### Ativar/Desativar
```
Desative todos os produtos que tem estoque zero
Ative todas as categorias
```

### Atualizar tenant
```
Atualize o telefone WhatsApp do tenant para 5511999999999
Mude a cor primaria do tenant para #FF6B6B
```

---

## 🗑️ DELECOES (Delete)

### Deletar categoria
```
Delete a categoria com slug "teste"
```

### Deletar zona de entrega
```
Delete a zona de entrega chamada "Zona Inativa"
```

### Deletar metodo de pagamento
```
Delete o metodo de pagamento "Cartao"
```

---

## 📊 ANALISES E RELATORIOS

### Vendas
```
Qual foi a receita total de todos os pedidos entregues?
Quantos pedidos foram feitos por dia nos ultimos 7 dias?
Qual e a ticket medio?
```

### Produtos
```
Quais sao os 10 produtos mais vendidos?
Qual categoria tem mais produtos?
Quantos produtos nao tem imagem?
```

### Performance
```
Qual e o tempo medio entre criar um pedido e confirmar?
Qual zona de entrega tem mais pedidos?
```

---

## 🔧 OPERACOES ADMINISTRATIVAS

### Limpar dados
```
Delete todos os pedidos com status "cancelled"
Remova todos os produtos inativos
```

### Atualizar em massa
```
Mude todos os pedidos pendentes para status "confirmed"
Ative todos os metodos de pagamento inativos
```

### Validacoes
```
Mostre pedidos sem endereço preenchido
Liste produtos sem descricao
Verifique quais zonas nao tem prazo definido
```

---

## 💡 DICAS

1. **Sempre confirme antes de deletar**
   ```
   Quantos produtos tem a categoria "X"?
   (apos ver a quantidade)
   Delete a categoria "X"
   ```

2. **Para dados sensveis, use SELECT primeiro**
   ```
   Mostre 3 pedidos da tabela orders
   (verificar estrutura)
   Mude o status para "shipped"
   ```

3. **Combine consultas**
   ```
   Mostre os 5 produtos com menor estoque, e quantos pedidos cada um vendeu
   ```

4. **Use para debug**
   ```
   Verifique se a categoria "Novo" foi criada com sucesso
   Mostre o ultimo pedido criado
   ```

---

## ⚠️ ATENCAO

- O MCP pode fazer **WRITES** no banco por padrao
- Se quiser apenas **LEITURA**, adicione `read_only=true` no `.mcp.json`
- Sempre revise as operacoes antes de confirmar
- Em producao, use apenas **SELECT** e database snapshots

---

## 🚀 Comece Agora

1. Reinicie Claude Code
2. Execute `/mcp` para autenticar
3. Teste: "Quantos produtos tem cadastrados?"
4. Sucesso! Agora voce tem acesso completo ao banco via MCP!
