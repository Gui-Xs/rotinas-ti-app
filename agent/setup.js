/**
 * 🔧 SCRIPT DE CONFIGURAÇÃO INICIAL
 * 
 * Este script ajuda a configurar o agente pela primeira vez,
 * criando o arquivo config.json com base no exemplo.
 */

import fs from 'fs/promises';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function setup() {
  console.log('\n🔧 CONFIGURAÇÃO DO AGENTE DE MONITORAMENTO\n');
  console.log('═══════════════════════════════════════════════════════\n');
  
  try {
    // Verificar se config.json já existe
    try {
      await fs.access('./config.json');
      const overwrite = await question('⚠️  config.json já existe. Deseja sobrescrever? (s/N): ');
      if (overwrite.toLowerCase() !== 's') {
        console.log('❌ Configuração cancelada.');
        rl.close();
        return;
      }
    } catch {
      // Arquivo não existe, continuar
    }
    
    console.log('📋 Por favor, forneça as seguintes informações:\n');
    
    // Coletar informações
    const projectId = await question('Firebase Project ID: ');
    const clientEmail = await question('Firebase Client Email: ');
    console.log('\nCole a Private Key (incluindo BEGIN e END, pressione Enter duas vezes quando terminar):');
    
    let privateKey = '';
    let emptyLines = 0;
    
    rl.on('line', (line) => {
      if (line.trim() === '') {
        emptyLines++;
        if (emptyLines >= 2) {
          rl.pause();
        }
      } else {
        emptyLines = 0;
        privateKey += line + '\\n';
      }
    });
    
    await new Promise((resolve) => {
      rl.on('pause', resolve);
    });
    
    rl.removeAllListeners('line');
    
    const computerName = await question('\nNome deste computador (ex: PC da Recepção): ');
    const location = await question('Local/Setor (ex: Recepção): ');
    const checkInterval = await question('Intervalo de verificação em segundos (padrão: 60): ') || '60';
    
    // Criar configuração
    const config = {
      firebase: {
        projectId: projectId.trim(),
        privateKey: privateKey.trim(),
        clientEmail: clientEmail.trim(),
      },
      appId: 'rotinas-ti-hpaes',
      computerName: computerName.trim(),
      location: location.trim(),
      checkInterval: parseInt(checkInterval) * 1000,
      networkPrinters: [],
    };
    
    // Perguntar sobre impressoras de rede
    const addNetwork = await question('\nDeseja adicionar impressoras de rede? (s/N): ');
    
    if (addNetwork.toLowerCase() === 's') {
      let addMore = true;
      
      while (addMore) {
        console.log('\n--- Nova Impressora de Rede ---');
        const name = await question('Nome: ');
        const ip = await question('IP: ');
        const snmpCommunity = await question('SNMP Community (padrão: public): ') || 'public';
        
        config.networkPrinters.push({
          name: name.trim(),
          ip: ip.trim(),
          snmpCommunity: snmpCommunity.trim(),
        });
        
        const more = await question('\nAdicionar outra impressora de rede? (s/N): ');
        addMore = more.toLowerCase() === 's';
      }
    }
    
    // Salvar configuração
    await fs.writeFile('./config.json', JSON.stringify(config, null, 2));
    
    console.log('\n✅ Configuração salva com sucesso em config.json!');
    console.log('\n📝 Resumo:');
    console.log(`   - Computador: ${config.computerName}`);
    console.log(`   - Local: ${config.location}`);
    console.log(`   - Intervalo: ${config.checkInterval / 1000}s`);
    console.log(`   - Impressoras de rede: ${config.networkPrinters.length}`);
    console.log('\n🚀 Execute "npm start" para iniciar o monitoramento.\n');
    
  } catch (error) {
    console.error('\n❌ Erro durante a configuração:', error.message);
  }
  
  rl.close();
}

setup();
