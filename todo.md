# Painel de Funis - TODO

## Funcionalidades

- [x] Sistema de login único com senha 'Titan2026' (sem campo de usuário)
- [x] Upload de CSV com detecção inteligente de datas duplicadas
- [x] Processamento de CSV com extração de Gestor, Rede, Nicho, ADV, VSL e Produto
- [x] Filtros dinâmicos: Gestor, Rede, Nicho, ADV, VSL, Período
- [x] Visualização padrão sem filtros mostra todos os funis ordenados por gasto
- [x] Tabela de resultados dia a dia agregando gestores/redes por funil
- [x] Exibição de métricas: Gasto, Profit, ROI, Compras, Initiate Checkout
- [x] Cores no ROI: vermelho (<0%), amarelo (0-10%), verde (>10%)
- [x] Totalizadores no topo: Total Gasto, Total Profit, ROI Geral, Total Compras
- [x] Banco de dados para persistência de dados históricos

## Redes Suportadas

- [x] MG (MediaGo)
- [x] NB (Newsbreak)
- [x] TB (Taboola)
- [x] RC (Revcontent)
- [x] OB (Outbrain)

## Schema do Banco

- [x] Tabela funnel_data para armazenar dados de campanhas

## Backend

- [x] API de upload de CSV
- [x] API de consulta com filtros
- [x] Lógica de detecção de datas duplicadas
- [x] Extração de dados do nome da campanha (Gestor, Rede)

## Frontend

- [x] Tela de login com senha única
- [x] Tela de upload de CSV
- [x] Dashboard com filtros e tabela de dados
- [x] Componente de totalizadores
- [x] Formatação de cores no ROI

## Funcionalidades Adicionais

- [ ] Detectar produtos desconhecidos e perguntar qual nicho pertence

## Correções

- [x] Corrigir formato CSV: "InitiateCheckout CPA" é um campo único (não dois separados)

## Novas Tarefas (19/01)

- [x] Corrigir texto do formato CSV no modal de upload (InitiateCheckout CPA como campo único)
- [x] Adicionar gráfico de colunas com gasto por dia e ROI dentro de cada coluna
- [x] Deletar dados antigos e carregar novos dados (26/12 a 19/01)

## Bugs Reportados

- [x] Dados não confiáveis - faltando dias 18 e 19/01 (corrigido timezone)
- [x] Valores não batem com a ferramenta de exportação original (corrigido - diferença < $1)

- [x] Bug: Dia 19/01 não aparece no painel (dados estão no banco mas não exibem) - corrigido
- [x] Bug: Gráfico mostra datas deslocadas 1 dia para trás (25/12-18/01 em vez de 26/12-19/01) - corrigido com parsing direto de string
