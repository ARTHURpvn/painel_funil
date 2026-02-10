# Painel de Funis - TODO

## Funcionalidades

- [x] Sistema de login único com senha 'Titan2026' (sem campo de usuário)
- [x] Filtros dinâmicos: Gestor, Rede, Nicho, ADV, VSL, Período
- [x] Visualização padrão sem filtros mostra todos os funis ordenados por gasto
- [x] Tabela de resultados dia a dia agregando gestores/redes por funil
- [x] Exibição de métricas: Gasto, Profit, ROI, Compras, Initiate Checkout
- [x] Cores no ROI: vermelho (<0%), amarelo (0-10%), verde (>10%)
- [x] Totalizadores no topo: Total Gasto, Total Profit, ROI Geral, Total Compras
- [x] Banco de dados para persistência de dados históricos
- [ ] Integração com RedTrack API para importação de dados

## Redes Suportadas

- [x] MG (MediaGo)
- [x] NB (Newsbreak)
- [x] TB (Taboola)
- [x] RC (Revcontent)
- [x] OB (Outbrain)

## Schema do Banco

- [x] Tabela funnel_data para armazenar dados de campanhas

## Backend

- [x] API de consulta com filtros
- [ ] Integração com RedTrack API para sincronização de dados
- [ ] Processamento de dados do RedTrack API (extração de Gestor, Rede, Nicho, ADV, VSL, Produto)

## Frontend

- [x] Tela de login com senha única
- [x] Dashboard com filtros e tabela de dados
- [x] Componente de totalizadores
- [x] Formatação de cores no ROI
- [x] Gráfico de colunas com gasto por dia e ROI

## Funcionalidades Adicionais

- [ ] Detectar produtos desconhecidos e perguntar qual nicho pertence

## Notas de Desenvolvimento

- [x] Removidas todas as dependências de CSV e planilhas (09/02/2026)
- [ ] Preparar estrutura para requisições RedTrack API

## Bugs Reportados

- [x] Dados não confiáveis - faltando dias 18 e 19/01 (corrigido timezone)
- [x] Valores não batem com a ferramenta de exportação original (corrigido - diferença < $1)

- [x] Bug: Dia 19/01 não aparece no painel (dados estão no banco mas não exibem) - corrigido
- [x] Bug: Gráfico mostra datas deslocadas 1 dia para trás (25/12-18/01 em vez de 26/12-19/01) - corrigido com parsing direto de string
