# Painel de Funis - Guia de Configuração

## 📋 Pré-requisitos

- Node.js 18+ instalado
- MySQL 8+ instalado e rodando
- Credenciais da API RedTrack

## 🚀 Configuração Inicial

### 1. Instalar Dependências

```bash
pnpm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
# Database Configuration
DATABASE_URL=mysql://seu_usuario:sua_senha@localhost:3306/painel_funis

# RedTrack API Configuration
REDTRACK_API_URL=https://api.redtrack.io
REDTRACK_API_KEY=sua_chave_api_aqui
REDTRACK_ACCOUNT_ID=seu_id_de_conta_aqui
```

**Como obter as credenciais da RedTrack:**
1. Faça login no seu painel RedTrack
2. Vá em Settings > API
3. Copie o API Key e Account ID

### 3. Inicializar o Banco de Dados

Execute o script de inicialização que vai:
- Criar o banco de dados automaticamente
- Executar todas as migrações
- Criar as tabelas necessárias

```bash
pnpm db:init
```

**Solução de problemas comuns:**

- **MySQL não está rodando:**
  ```bash
  # macOS
  brew services start mysql
  
  # Linux
  sudo systemctl start mysql
  ```

- **Erro de permissão:**
  Certifique-se que o usuário MySQL tem permissão para criar bancos de dados:
  ```sql
  GRANT ALL PRIVILEGES ON painel_funis.* TO 'seu_usuario'@'localhost';
  FLUSH PRIVILEGES;
  ```

### 4. Iniciar o Servidor

```bash
pnpm dev
```

O servidor estará rodando em `http://localhost:5000` (ou porta configurada).

## 📊 Importando Dados da RedTrack

### Via API (Recomendado)

Use o endpoint tRPC para importar dados:

```typescript
// No cliente
import { trpc } from '@/lib/trpc';

// Importar dados de um período
const result = await trpc.funnel.importFromRedTrack.mutate({
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  replaceExisting: false, // true para substituir dados existentes
});

console.log(result.message);
console.log(`Registros importados: ${result.recordsImported}`);
```

### Estrutura de Dados Esperada

O sistema espera que os nomes de campanha na RedTrack sigam este padrão:

```
GESTOR_REDE_NICHO_ADV_VSL_PRODUTO
```

**Exemplo:**
```
ARTHUR_FB_EMAGRECIMENTO_ADV01_VSL01_PRODUTOX
```

Onde:
- **GESTOR**: Nome do gestor da campanha
- **REDE**: Plataforma de anúncio (FB, GOOGLE, TIKTOK, etc.)
- **NICHO**: Nicho de mercado (EMAGRECIMENTO, FINANCAS, etc.)
- **ADV**: Identificador do anúncio
- **VSL**: Identificador do VSL (Video Sales Letter)
- **PRODUTO**: Nome do produto

## 🗄️ Estrutura do Banco de Dados

### Tabela: `funnel_data`

Armazena os dados de desempenho das campanhas:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | ID único (auto-increment) |
| campaign | TEXT | Nome completo da campanha |
| gestor | VARCHAR(50) | Nome do gestor |
| rede | VARCHAR(10) | Plataforma de anúncio |
| nicho | VARCHAR(100) | Nicho de mercado |
| adv | VARCHAR(50) | ID do anúncio |
| vsl | VARCHAR(50) | ID do VSL |
| produto | VARCHAR(100) | Nome do produto |
| dataRegistro | DATE | Data do registro |
| cost | DECIMAL(12,2) | Custo total |
| profit | DECIMAL(12,2) | Lucro total |
| roi | DECIMAL(8,4) | Retorno sobre investimento |
| purchases | INT | Número de compras |
| initiateCheckoutCPA | DECIMAL(12,2) | CPA de iniciação de checkout |
| createdAt | TIMESTAMP | Data de criação |
| updatedAt | TIMESTAMP | Data de atualização |

## 🔌 Endpoints Disponíveis

### Importação de Dados

**`funnel.importFromRedTrack`** - Importa dados da RedTrack API
```typescript
input: {
  startDate: string;     // Formato: YYYY-MM-DD
  endDate: string;       // Formato: YYYY-MM-DD
  replaceExisting: boolean; // Opcional, padrão: false
}

output: {
  success: boolean;
  message: string;
  recordsImported: number;
}
```

**`funnel.testRedTrackConnection`** - Testa conexão com RedTrack
```typescript
output: {
  success: boolean;
  message: string;
}
```

### Consulta de Dados

**`funnel.getData`** - Obtém dados agregados com filtros
```typescript
input: {
  gestor?: string;
  rede?: string;
  nicho?: string;
  adv?: string;
  vsl?: string;
  dataInicio?: string;
  dataFim?: string;
}
```

**`funnel.getTotals`** - Obtém totais com filtros
```typescript
input: {
  // mesmos filtros de getData
}

output: {
  totalCost: number;
  totalProfit: number;
  totalPurchases: number;
  roi: number;
}
```

**`funnel.getDailyTotals`** - Obtém totais diários para gráficos
```typescript
input: {
  // mesmos filtros de getData
}

output: Array<{
  date: string;
  cost: number;
  profit: number;
  roi: number;
}>
```

**`funnel.getFilters`** - Obtém opções disponíveis para filtros
```typescript
output: {
  gestores: string[];
  redes: string[];
  nichos: string[];
  advs: string[];
  vsls: string[];
}
```

**`funnel.getExistingDates`** - Obtém datas com dados disponíveis
```typescript
output: string[]; // Array de datas no formato YYYY-MM-DD
```

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor em modo desenvolvimento

# Banco de Dados
pnpm db:init          # Inicializa banco de dados (primeira vez)
pnpm db:push          # Gera e executa migrações

# Build e Produção
pnpm build            # Compila para produção
pnpm start            # Inicia servidor em produção

# Qualidade de Código
pnpm check            # Verifica tipos TypeScript
pnpm format           # Formata código
pnpm test             # Executa testes
```

## 📝 Exemplo de Uso Completo

```typescript
// 1. Testar conexão com RedTrack
const connectionTest = await trpc.funnel.testRedTrackConnection.query();
console.log(connectionTest.message);

// 2. Importar dados do último mês
const importResult = await trpc.funnel.importFromRedTrack.mutate({
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  replaceExisting: false,
});
console.log(`${importResult.recordsImported} registros importados`);

// 3. Consultar totais
const totals = await trpc.funnel.getTotals.query({
  dataInicio: '2025-01-01',
  dataFim: '2025-01-31',
  gestor: 'ARTHUR',
});
console.log('ROI:', totals.roi, '%');

// 4. Obter dados para dashboard
const dailyData = await trpc.funnel.getDailyTotals.query({
  dataInicio: '2025-01-01',
  dataFim: '2025-01-31',
});
// Use dailyData para popular gráficos
```

## 🛠️ Arquitetura

```
server/
├── redtrack.ts          # Serviço de integração com RedTrack API
├── db.ts                # Funções de banco de dados
├── routers.ts           # Definição de endpoints tRPC
└── _core/               # Configurações core do servidor

drizzle/
├── schema.ts            # Schema do banco de dados
└── migrations/          # Migrações do banco

scripts/
└── init-db.ts           # Script de inicialização do BD
```

## 🔒 Segurança

- Nunca commite o arquivo `.env` com credenciais reais
- Use `.env.example` como template
- Mantenha suas credenciais da RedTrack API seguras
- Configure permissões adequadas no banco de dados MySQL

## 📚 Recursos Adicionais

- [Documentação Drizzle ORM](https://orm.drizzle.team/)
- [Documentação tRPC](https://trpc.io/)
- [Documentação RedTrack API](https://redtrack.io/docs/api)

