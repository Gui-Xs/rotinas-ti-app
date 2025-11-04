import readline from 'readline';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

console.log('🤖 CONFIGURAÇÃO DO BOT DO TELEGRAM - ROTINAS TI\n');
console.log('Este assistente irá ajudá-lo a configurar o bot.\n');

async function setup() {
  try {
    console.log('📋 PASSO 1: Token do Bot');
    console.log('Para obter o token:');
    console.log('1. Abra o Telegram e procure por @BotFather');
    console.log('2. Envie /newbot e siga as instruções');
    console.log('3. Copie o token fornecido\n');
    
    const botToken = await question('Digite o token do bot: ');
    
    console.log('\n📋 PASSO 2: Configuração do Firebase');
    console.log('Você precisa das credenciais do Firebase Admin SDK.');
    console.log('Para obtê-las:');
    console.log('1. Acesse o Firebase Console');
    console.log('2. Vá em Configurações do Projeto > Contas de Serviço');
    console.log('3. Clique em "Gerar nova chave privada"\n');
    
    const projectId = await question('Digite o Project ID do Firebase: ');
    const clientEmail = await question('Digite o Client Email: ');
    
    console.log('\nDigite a Private Key (cole todo o conteúdo entre aspas):');
    const privateKey = await question('Private Key: ');
    
    console.log('\n📋 PASSO 3: Configuração do App');
    const appId = await question('Digite o APP_ID (padrão: hpaes-rotinas-ti): ') || 'hpaes-rotinas-ti';
    
    console.log('\n📋 PASSO 4: Administradores');
    console.log('Para obter seu Telegram ID:');
    console.log('1. Procure por @userinfobot no Telegram');
    console.log('2. Envie /start');
    console.log('3. Copie o ID fornecido\n');
    
    const adminIds = await question('Digite os IDs dos admins (separados por vírgula): ');
    
    console.log('\n📋 PASSO 5: Intervalo de Verificação');
    const checkInterval = await question('Intervalo de verificação em minutos (padrão: 60): ') || '60';
    
    // Criar arquivo .env
    const envContent = `# Token do Bot do Telegram
TELEGRAM_BOT_TOKEN=${botToken}

# Credenciais do Firebase Admin SDK
FIREBASE_PROJECT_ID=${projectId}
FIREBASE_PRIVATE_KEY="${privateKey}"
FIREBASE_CLIENT_EMAIL=${clientEmail}

# App ID do sistema
APP_ID=${appId}

# IDs dos administradores do Telegram
ADMIN_TELEGRAM_IDS=${adminIds}

# Intervalo de verificação de rotinas pendentes (em minutos)
CHECK_INTERVAL=${checkInterval}
`;
    
    fs.writeFileSync(join(__dirname, '.env'), envContent);
    
    console.log('\n✅ Configuração concluída com sucesso!');
    console.log('\n📝 Arquivo .env criado.');
    console.log('\n🚀 Para iniciar o bot, execute:');
    console.log('   npm start');
    console.log('\n📖 Para mais informações, consulte o README.md');
    
  } catch (error) {
    console.error('\n❌ Erro durante a configuração:', error.message);
  } finally {
    rl.close();
  }
}

setup();
