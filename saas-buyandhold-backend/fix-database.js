const { Sequelize } = require('sequelize');
const config = require('./config/environment');

async function fixDatabase() {
  console.log('🔧 Iniciando correção do banco de dados...');
  
  try {
    // Conectar ao PostgreSQL sem especificar o banco
    const sequelizeAdmin = new Sequelize('postgres', config.database.username, config.database.password, {
      host: config.database.host,
      port: config.database.port,
      dialect: 'postgres',
      logging: console.log
    });

    console.log('📡 Conectando ao PostgreSQL...');
    await sequelizeAdmin.authenticate();
    console.log('✅ Conexão com PostgreSQL estabelecida.');

    // Verificar se o banco existe
    const [results] = await sequelizeAdmin.query(
      `SELECT 1 FROM pg_database WHERE datname = '${config.database.name}'`
    );

    if (results.length === 0) {
      console.log(`🗄️ Criando banco de dados '${config.database.name}'...`);
      await sequelizeAdmin.query(`CREATE DATABASE "${config.database.name}";`);
      console.log('✅ Banco de dados criado com sucesso.');
    } else {
      console.log(`⚠️ Banco '${config.database.name}' já existe. Removendo e recriando...`);
      
      // Terminar conexões ativas
      await sequelizeAdmin.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${config.database.name}' AND pid <> pg_backend_pid();
      `);
      
      // Remover banco existente
      await sequelizeAdmin.query(`DROP DATABASE IF EXISTS "${config.database.name}";`);
      console.log('🗑️ Banco antigo removido.');
      
      // Criar novo banco
      await sequelizeAdmin.query(`CREATE DATABASE "${config.database.name}";`);
      console.log('✅ Novo banco criado.');
    }

    await sequelizeAdmin.close();

    // Conectar ao novo banco e sincronizar modelos
    console.log('🔄 Conectando ao novo banco e sincronizando modelos...');
    
    const sequelize = new Sequelize(config.database.name, config.database.username, config.database.password, {
      host: config.database.host,
      port: config.database.port,
      dialect: 'postgres',
      logging: console.log,
      pool: config.database.pool
    });

    await sequelize.authenticate();
    console.log('✅ Conectado ao novo banco.');

    // Importar e sincronizar modelos
    const User = require('./src/models/User');
    const Portfolio = require('./src/models/Portfolio');
    const Asset = require('./src/models/Asset');
    const Payment = require('./src/models/Payment');
    const Subscription = require('./src/models/Subscription');

    console.log('🔄 Sincronizando modelos...');
    await sequelize.sync({ force: true });
    console.log('✅ Modelos sincronizados com sucesso.');

    await sequelize.close();
    console.log('🎉 Banco de dados corrigido com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Reinicie o servidor backend');
    console.log('2. Teste o login e criação de usuários');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir banco de dados:', error);
    process.exit(1);
  }
}

fixDatabase();