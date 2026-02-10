#!/usr/bin/env tsx
/**
 * Database Initialization Script
 *
 * This script:
 * 1. Checks if the database exists
 * 2. Creates the database if it doesn't exist
 * 3. Runs migrations to create tables
 *
 * Usage: pnpm db:init
 */

import mysql from 'mysql2/promise';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);

async function initializeDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL não está configurado no arquivo .env');
    console.log('\n📝 Configure a variável DATABASE_URL no arquivo .env:');
    console.log('DATABASE_URL=mysql://usuario:senha@localhost:3306/painel_funis\n');
    process.exit(1);
  }

  // Parse database URL
  const urlMatch = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

  if (!urlMatch) {
    console.error('❌ Formato inválido de DATABASE_URL');
    console.log('Formato esperado: mysql://usuario:senha@host:porta/banco_de_dados');
    process.exit(1);
  }

  const [, user, password, host, port, database] = urlMatch;

  console.log('🔧 Inicializando banco de dados...\n');
  console.log(`Host: ${host}:${port}`);
  console.log(`Database: ${database}`);
  console.log(`User: ${user}\n`);

  let connection;

  try {
    // Connect without specifying database
    console.log('📡 Conectando ao MySQL...');
    connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user,
      password,
    });

    console.log('✅ Conectado ao MySQL\n');

    // Check if database exists
    console.log(`🔍 Verificando se o banco de dados "${database}" existe...`);
    const [databases] = await connection.query(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [database]
    );

    if (Array.isArray(databases) && databases.length > 0) {
      console.log(`✅ Banco de dados "${database}" já existe\n`);
    } else {
      console.log(`📦 Criando banco de dados "${database}"...`);
      await connection.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✅ Banco de dados "${database}" criado com sucesso\n`);
    }

    await connection.end();

    // Run migrations
    console.log('🔄 Executando migrações...');
    const { stdout, stderr } = await execAsync('pnpm drizzle-kit generate && pnpm drizzle-kit migrate');

    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    console.log('\n✅ Banco de dados inicializado com sucesso!');
    console.log('\n🚀 Próximos passos:');
    console.log('1. Configure suas credenciais da API RedTrack no arquivo .env');
    console.log('2. Execute: pnpm dev');
    console.log('3. Use o endpoint importFromRedTrack para importar dados\n');

  } catch (error) {
    console.error('\n❌ Erro ao inicializar banco de dados:', error);

    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        console.log('\n💡 Dica: Verifique se o MySQL está rodando:');
        console.log('   - macOS: brew services start mysql');
        console.log('   - Linux: sudo systemctl start mysql');
        console.log('   - Windows: inicie o serviço MySQL\n');
      } else if (error.message.includes('Access denied')) {
        console.log('\n💡 Dica: Verifique suas credenciais no arquivo .env');
        console.log('   - Usuário e senha corretos?');
        console.log('   - O usuário tem permissão para criar bancos de dados?\n');
      }
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initializeDatabase();

