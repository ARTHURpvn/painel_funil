#!/usr/bin/env tsx
/**
 * Script para Formatar/Limpar o Banco de Dados
 *
 * Este script:
 * 1. Remove todos os dados da tabela funnel_data
 * 2. Reseta o auto_increment
 * 3. Mantém a estrutura das tabelas intacta
 *
 * USO:
 *   pnpm db:format
 *
 * ATENÇÃO: Este comando é IRREVERSÍVEL!
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function formatDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL não está configurado no arquivo .env');
    process.exit(1);
  }

  // Parse database URL
  let user: string;
  let password: string | undefined;
  let host: string;
  let port: number;
  let database: string;

  try {
    const parsedUrl = new URL(databaseUrl);
    if (parsedUrl.protocol !== 'mysql:') {
      throw new Error('Invalid protocol');
    }

    user = decodeURIComponent(parsedUrl.username);
    password = parsedUrl.password ? decodeURIComponent(parsedUrl.password) : undefined;
    host = parsedUrl.hostname;
    port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 3306;
    database = parsedUrl.pathname.replace(/^\//, '');

    if (!user || !host || !database) {
      throw new Error('Missing required parts');
    }
  } catch {
    console.error('❌ Formato inválido de DATABASE_URL');
    console.log('Formato esperado: mysql://usuario[:senha]@host[:porta]/banco_de_dados');
    process.exit(1);
  }

  console.log('⚠️  ATENÇÃO: FORMATAÇÃO DE BANCO DE DADOS ⚠️\n');
  console.log(`Host: ${host}:${port}`);
  console.log(`Database: ${database}`);
  console.log(`User: ${user}\n`);
  console.log('⚠️  Este comando irá DELETAR TODOS OS DADOS!\n');
  console.log('📋 O que será feito:');
  console.log('   1. Remover todos os registros da tabela funnel_data');
  console.log('   2. Resetar o contador de IDs (auto_increment)');
  console.log('   3. A estrutura das tabelas será mantida\n');

  const answer = await question('Digite "CONFIRMAR" para continuar ou qualquer outra coisa para cancelar: ');

  if (answer.trim() !== 'CONFIRMAR') {
    console.log('\n❌ Operação cancelada pelo usuário');
    rl.close();
    process.exit(0);
  }

  let connection;

  try {
    console.log('\n📡 Conectando ao MySQL...');

    const connectionConfig: mysql.ConnectionOptions = {
      host,
      port,
      user,
      database,
    };

    if (password) {
      connectionConfig.password = password;
    }

    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Conectado ao MySQL\n');

    // Check if table exists
    console.log('🔍 Verificando tabelas...');
    const [tables] = await connection.query(
      'SHOW TABLES LIKE "funnel_data"'
    ) as any;

    if (!tables || tables.length === 0) {
      console.log('⚠️  Tabela funnel_data não existe ainda');
      console.log('💡 Execute primeiro: pnpm db:init\n');
      rl.close();
      process.exit(0);
    }

    // Check current record count
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as total FROM funnel_data'
    ) as any;
    const currentCount = countResult[0].total;
    console.log(`📊 Registros encontrados: ${currentCount}\n`);

    if (currentCount === 0) {
      console.log('✅ Banco de dados já está vazio!');
      rl.close();
      process.exit(0);
    }

    // Truncate table
    console.log('🗑️  Removendo todos os dados...');
    await connection.query('TRUNCATE TABLE funnel_data');
    console.log('✅ Todos os dados foram removidos');
    console.log('✅ Auto increment resetado para 1\n');

    // Verify
    const [verifyResult] = await connection.query(
      'SELECT COUNT(*) as total FROM funnel_data'
    ) as any;
    const finalCount = verifyResult[0].total;

    console.log('✅ Formatação concluída com sucesso!');
    console.log(`📊 Registros atuais: ${finalCount}`);
    console.log('\n🚀 Próximos passos:');
    console.log('   1. Execute: pnpm dev');
    console.log('   2. Acesse: http://localhost:5000/import');
    console.log('   3. Importe novos dados do RedTrack\n');

  } catch (error) {
    console.error('\n❌ Erro ao formatar banco de dados:', error);

    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        console.log('\n💡 Dica: Verifique se o MySQL está rodando:');
        console.log('   - macOS: brew services start mysql');
        console.log('   - Linux: sudo systemctl start mysql');
        console.log('   - Windows: inicie o serviço MySQL\n');
      } else if (error.message.includes('Access denied')) {
        console.log('\n💡 Dica: Verifique suas credenciais no arquivo .env\n');
      }
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
    rl.close();
  }
}

formatDatabase();

