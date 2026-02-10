#!/usr/bin/env tsx
/**
 * Script de teste para importação de dados do RedTrack
 *
 * Este script demonstra como usar o serviço RedTrack e importar dados
 *
 * Uso: tsx scripts/test-import.ts
 */

import dotenv from 'dotenv';
import { getRedTrackService } from '../server/redtrack';
import { insertFunnelDataBatch, getDb } from '../server/db';
import { InsertFunnelData } from '../drizzle/schema';

dotenv.config();

/**
 * Parse RedTrack data fields to extract funnel components
 */
function parseRedTrackData(row: any): {
  gestor?: string;
  rede?: string;
  nicho?: string;
  adv?: string;
  vsl?: string;
  produto?: string;
} {
  // RedTrack uses sub1, sub2, sub3, sub4, sub5 for custom fields
  return {
    gestor: row.sub1 || undefined,
    rede: row.sub2 || undefined,
    nicho: row.sub3 || undefined,
    adv: row.sub4 || undefined,
    vsl: row.sub5 || undefined,
    produto: undefined, // Can be extracted from campaign name if needed
  };
}

async function testImport() {
  console.log('🚀 Iniciando teste de importação...\n');

  // 1. Verificar configuração
  console.log('📋 Verificando configuração...');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não configurado no .env');
    process.exit(1);
  }

  if (!process.env.REDTRACK_API_KEY || !process.env.REDTRACK_ACCOUNT_ID) {
    console.error('❌ Credenciais RedTrack não configuradas no .env');
    console.log('Configure: REDTRACK_API_KEY e REDTRACK_ACCOUNT_ID');
    process.exit(1);
  }

  console.log('✅ Configuração OK\n');

  // 2. Testar conexão com banco de dados
  console.log('📊 Testando conexão com banco de dados...');
  const db = await getDb();

  if (!db) {
    console.error('❌ Não foi possível conectar ao banco de dados');
    console.log('Verifique se o MySQL está rodando e se DATABASE_URL está correto');
    process.exit(1);
  }

  console.log('✅ Banco de dados conectado\n');

  // 3. Testar conexão com RedTrack
  console.log('🔌 Testando conexão com RedTrack API...');

  try {
    const redTrack = getRedTrackService();
    const isConnected = await redTrack.testConnection();

    if (!isConnected) {
      console.error('❌ Falha ao conectar com RedTrack API');
      console.log('Verifique suas credenciais no arquivo .env');
      process.exit(1);
    }

    console.log('✅ RedTrack API conectado\n');

    // 4. Buscar dados de exemplo (últimos 7 dias)
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);

    const startDate = lastWeek.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    console.log(`📥 Buscando dados de ${startDate} até ${endDate}...`);

    const report = await redTrack.getCampaignReport(
      startDate,
      endDate,
      ['campaign', 'sub1', 'sub2', 'sub3'],
    );

    if (!report || report.length === 0) {
      console.log('⚠️  Nenhum dado encontrado no período');
      return;
    }

    console.log(`✅ ${report.length} registros encontrados\n`);

    // 5. Processar e exibir amostra
    console.log('📊 Amostra de dados (primeiros 3 registros):\n');

    const sampleData = report.slice(0, 3);
    sampleData.forEach((row, index) => {
      const parsed = parseRedTrackData(row);
      console.log(`${index + 1}. ${row.campaign || 'N/A'}`);
      console.log(`   Sub1 (Gestor): ${row.sub1 || 'N/A'}`);
      console.log(`   Sub2 (Rede): ${row.sub2 || 'N/A'}`);
      console.log(`   Sub3 (Nicho): ${row.sub3 || 'N/A'}`);
      console.log(`   Cost: $${row.cost}`);
      console.log(`   Profit: $${row.profit}`);
      console.log(`   ROI: ${row.roi}%`);
      console.log(`   Conversions: ${row.conversions}`);
      console.log('');
    });

    // 6. Transformar para formato do banco de dados
    console.log('🔄 Transformando dados...');

    const records: InsertFunnelData[] = report.map(row => {
      const parsed = parseRedTrackData(row);

      return {
        campaign: row.campaign || '',
        gestor: parsed.gestor || null,
        rede: parsed.rede || null,
        nicho: parsed.nicho || null,
        adv: parsed.adv || null,
        vsl: parsed.vsl || null,
        produto: parsed.produto || null,
        dataRegistro: new Date(startDate),
        cost: typeof row.cost === 'string' ? row.cost : row.cost?.toString() || '0',
        profit: typeof row.profit === 'string' ? row.profit : row.profit?.toString() || '0',
        roi: typeof row.roi === 'string' ? row.roi : row.roi?.toString() || '0',
        purchases: typeof row.conversions === 'string' ? parseInt(row.conversions) : row.conversions || 0,
        initiateCheckoutCPA: typeof row.cpa === 'string' ? row.cpa : row.cpa?.toString() || '0',
      };
    });

    console.log(`✅ ${records.length} registros prontos para importação\n`);

    // 7. Perguntar se quer importar (simulado - apenas exibe)
    console.log('💾 Para importar estes dados, execute:');
    console.log('   await insertFunnelDataBatch(records);');
    console.log('\n📝 Ou use o endpoint tRPC:');
    console.log('   trpc.funnel.importFromRedTrack.mutate({ startDate, endDate })');

    console.log('\n✅ Teste concluído com sucesso!');
    console.log('\n📚 Próximos passos:');
    console.log('1. Ajuste o formato dos nomes de campanha no RedTrack');
    console.log('2. Use o componente RedTrackImporter no frontend');
    console.log('3. Ou chame o endpoint via tRPC\n');

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error);

    if (error instanceof Error) {
      console.error('Mensagem:', error.message);
    }

    process.exit(1);
  }
}

testImport();

