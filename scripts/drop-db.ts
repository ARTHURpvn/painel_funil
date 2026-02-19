#!/usr/bin/env tsx
/**
 * Script para APAGAR o Banco de Dados COMPLETAMENTE
 *
 * Este script:
 * 1. Apaga o banco de dados inteiro (não apenas os dados)
 * 2. Remove toda a estrutura, tabelas, índices
 * 3. É COMPLETAMENTE IRREVERSÍVEL
 *
 * USO:
 *   pnpm db:drop
 *
 * ATENÇÃO: Este comando APAGA O BANCO DE DADOS INTEIRO!
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

async function dropDatabase() {
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

  console.log('🔥 ATENÇÃO: APAGAR BANCO DE DADOS COMPLETAMENTE 🔥\n');
  console.log(`Host: ${host}:${port}`);
  console.log(`Database: ${database}`);
  console.log(`User: ${user}\n`);
  console.log('🔥 Este comando irá APAGAR O BANCO DE DADOS INTEIRO!\n');
  console.log('📋 O que será feito:');
  console.log('   1. Apagar o banco de dados completamente');
  console.log('   2. Remover todas as tabelas');
  console.log('   3. Remover todos os dados');
  console.log('   4. Remover toda a estrutura\n');
  console.log('⚠️  Para usar novamente, você precisará executar: pnpm db:init\n');

  const answer1 = await question('Digite "APAGAR" para continuar ou qualquer outra coisa para cancelar: ');

  if (answer1.trim() !== 'APAGAR') {
    console.log('\n❌ Operação cancelada pelo usuário');
    rl.close();
    process.exit(0);
  }

  console.log('\n⚠️  ÚLTIMA CHANCE! Tem certeza absoluta?\n');
  const answer2 = await question('Digite "SIM APAGAR TUDO" para confirmar: ');

  if (answer2.trim() !== 'SIM APAGAR TUDO') {
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
    };

    if (password) {
      connectionConfig.password = password;
    }

    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Conectado ao MySQL\n');

    // Check if database exists
    console.log(`🔍 Verificando se o banco "${database}" existe...`);
    const [databases] = await connection.query(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [database]
    ) as any;

    if (!databases || databases.length === 0) {
      console.log(`ℹ️  O banco de dados "${database}" não existe`);
      console.log('✅ Nada para apagar!\n');
      rl.close();
      process.exit(0);
    }

    // Get table count
    const [tables] = await connection.query(
      `SELECT COUNT(*) as total FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
      [database]
    ) as any;
    const tableCount = tables[0].total;

    console.log(`📊 Banco encontrado com ${tableCount} tabela(s)\n`);

    // Drop database
    console.log(`🔥 Apagando banco de dados "${database}"...`);
    await connection.query(`DROP DATABASE \`${database}\``);
    console.log('✅ Banco de dados apagado com sucesso!\n');

    // Verify
    const [verifyDatabases] = await connection.query(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [database]
    ) as any;

    if (!verifyDatabases || verifyDatabases.length === 0) {
      console.log('✅ Verificação: Banco de dados não existe mais');
      console.log('\n🎯 Operação concluída com sucesso!');
      console.log('\n📋 Próximos passos:');
      console.log('   1. Para criar novamente: pnpm db:init');
      console.log('   2. Depois execute: pnpm dev');
      console.log('   3. Importe dados: http://localhost:5000/import\n');
    } else {
      console.log('⚠️  Aviso: Banco ainda existe (pode ser cache do MySQL)');
    }

  } catch (error) {
    console.error('\n❌ Erro ao apagar banco de dados:', error);

    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        console.log('\n💡 Dica: Verifique se o MySQL está rodando:');
        console.log('   - macOS: brew services start mysql');
        console.log('   - Linux: sudo systemctl start mysql');
        console.log('   - Windows: inicie o serviço MySQL\n');
      } else if (error.message.includes('Access denied')) {
        console.log('\n💡 Dica: Verifique se o usuário tem permissão para deletar bancos\n');
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

dropDatabase();

