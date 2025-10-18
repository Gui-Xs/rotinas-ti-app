/**
 * 🖨️ AGENTE DE MONITORAMENTO DE IMPRESSORAS
 * 
 * Este serviço detecta impressoras USB e de rede, coletando informações
 * como status, nível de tinta e enviando para o Firebase Firestore.
 * 
 * Execução: npm start
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import ping from 'ping';
import snmp from 'snmp-native';

const execAsync = promisify(exec);

// ============================================
// 📋 CONFIGURAÇÃO
// ============================================

let config;
let db;
let appId;

/**
 * Carrega as configurações do arquivo config.json
 */
async function loadConfig() {
  try {
    const configFile = await fs.readFile('./config.json', 'utf-8');
    config = JSON.parse(configFile);
    
    // Validar configurações obrigatórias
    if (!config.firebase || !config.firebase.projectId) {
      throw new Error('Configuração do Firebase incompleta em config.json');
    }
    
    if (!config.computerName || !config.location) {
      throw new Error('computerName e location são obrigatórios em config.json');
    }
    
    appId = config.appId || 'rotinas-ti-app';
    
    console.log('✅ Configurações carregadas com sucesso');
    console.log(`📍 Computador: ${config.computerName}`);
    console.log(`📍 Local: ${config.location}`);
    
    return config;
  } catch (error) {
    console.error('❌ Erro ao carregar config.json:', error.message);
    console.log('\n💡 Dica: Copie config.example.json para config.json e configure suas credenciais');
    process.exit(1);
  }
}

/**
 * Inicializa a conexão com o Firebase
 */
function initializeFirebase() {
  try {
    const app = initializeApp({
      credential: cert({
        projectId: config.firebase.projectId,
        privateKey: config.firebase.privateKey.replace(/\\n/g, '\n'),
        clientEmail: config.firebase.clientEmail,
      }),
    });
    
    db = getFirestore(app);
    console.log('✅ Firebase inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error.message);
    process.exit(1);
  }
}

// ============================================
// 🖨️ DETECÇÃO DE IMPRESSORAS USB
// ============================================

/**
 * Detecta impressoras USB conectadas localmente (Windows)
 */
async function detectUSBPrinters() {
  const printers = [];
  
  try {
    // Comando Windows para listar impressoras
    const { stdout } = await execAsync('wmic printer list brief', { 
      encoding: 'utf-8',
      windowsHide: true 
    });
    
    const lines = stdout.split('\n').filter(line => line.trim());
    
    // Pular cabeçalho
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse da linha (formato: Default  Local  Name  Network  PortName  PrintProcessor  ShareName  Status)
      const parts = line.split(/\s{2,}/); // Split por 2+ espaços
      
      if (parts.length >= 3) {
        const printerName = parts[2] || parts[1] || 'Impressora Desconhecida';
        const portName = parts[4] || 'USB';
        const status = parts[7] || 'Unknown';
        
        // Filtrar apenas impressoras USB/locais
        if (portName.includes('USB') || portName.includes('LPT') || !portName.includes(':')) {
          printers.push({
            name: printerName,
            type: 'USB',
            ip: null,
            usb_port: portName,
            status: status.toLowerCase().includes('error') ? 'Offline' : 'Online',
            ink_level: null, // USB printers geralmente não reportam nível de tinta via WMIC
            last_check: new Date().toISOString(),
            location: config.location,
            registered_by: config.computerName,
          });
        }
      }
    }
    
    console.log(`🖨️  Detectadas ${printers.length} impressoras USB`);
  } catch (error) {
    console.error('⚠️  Erro ao detectar impressoras USB:', error.message);
  }
  
  return printers;
}

/**
 * Tenta obter informações detalhadas de uma impressora USB específica
 */
async function getUSBPrinterDetails(printerName) {
  try {
    const { stdout } = await execAsync(
      `wmic printer where "name='${printerName.replace(/'/g, "\\'")}'" get Status,PrinterStatus /format:list`,
      { encoding: 'utf-8', windowsHide: true }
    );
    
    // Parse do output
    const details = {};
    stdout.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        details[key.trim()] = value.trim();
      }
    });
    
    return details;
  } catch (error) {
    return {};
  }
}

// ============================================
// 🌐 DETECÇÃO DE IMPRESSORAS DE REDE
// ============================================

/**
 * Verifica se um host está online via ping
 */
async function checkHostOnline(ip) {
  try {
    const result = await ping.promise.probe(ip, {
      timeout: 2,
      extra: ['-n', '1'], // Windows: enviar apenas 1 pacote
    });
    return result.alive;
  } catch (error) {
    return false;
  }
}

/**
 * Obtém informações via SNMP (nível de tinta, status)
 */
async function getSNMPInfo(ip, community = 'public') {
  return new Promise((resolve) => {
    try {
      const session = new snmp.Session({ host: ip, community, timeout: 5000 });
      
      // OIDs padrão para impressoras - buscar múltiplos cartuchos
      const oids = {
        sysDescr: [1, 3, 6, 1, 2, 1, 1, 1, 0], // Descrição do sistema
        hrPrinterStatus: [1, 3, 6, 1, 2, 1, 25, 3, 5, 1, 1, 1], // Status da impressora
        // OIDs para níveis de tinta/toner - índices 1 a 4 (CMYK)
        level1: [1, 3, 6, 1, 2, 1, 43, 11, 1, 1, 9, 1, 1],
        max1: [1, 3, 6, 1, 2, 1, 43, 11, 1, 1, 8, 1, 1],
        level2: [1, 3, 6, 1, 2, 1, 43, 11, 1, 1, 9, 1, 2],
        max2: [1, 3, 6, 1, 2, 1, 43, 11, 1, 1, 8, 1, 2],
        level3: [1, 3, 6, 1, 2, 1, 43, 11, 1, 1, 9, 1, 3],
        max3: [1, 3, 6, 1, 2, 1, 43, 11, 1, 1, 8, 1, 3],
        level4: [1, 3, 6, 1, 2, 1, 43, 11, 1, 1, 9, 1, 4],
        max4: [1, 3, 6, 1, 2, 1, 43, 11, 1, 1, 8, 1, 4],
        // OIDs para nomes/cores dos cartuchos
        color1: [1, 3, 6, 1, 2, 1, 43, 11, 1, 1, 6, 1, 1],
        color2: [1, 3, 6, 1, 2, 1, 43, 11, 1, 1, 6, 1, 2],
        color3: [1, 3, 6, 1, 2, 1, 43, 11, 1, 1, 6, 1, 3],
        color4: [1, 3, 6, 1, 2, 1, 43, 11, 1, 1, 6, 1, 4],
      };
      
      session.getAll({ oids: Object.values(oids) }, (error, varbinds) => {
        session.close();
        
        if (error) {
          console.log(`  ⚠️  SNMP não disponível para ${ip}: ${error.message}`);
          resolve({ available: false });
          return;
        }
        
        console.log(`  📊 SNMP Response para ${ip}:`, {
          description: varbinds[0]?.value?.toString() || 'N/A',
          status: varbinds[1]?.value,
        });
        
        // Processar níveis de tinta por cor
        const inkLevels = [];
        let totalInk = 0;
        let validCartridges = 0;
        
        for (let i = 0; i < 4; i++) {
          const levelIdx = 2 + (i * 2);
          const maxIdx = 3 + (i * 2);
          const colorIdx = 10 + i;
          
          const currentLevel = varbinds[levelIdx]?.value;
          const maxCapacity = varbinds[maxIdx]?.value;
          const colorName = varbinds[colorIdx]?.value?.toString() || '';
          
          if (currentLevel !== null && currentLevel !== undefined && currentLevel >= 0) {
            let percentage = null;
            
            if (maxCapacity && maxCapacity > 0) {
              percentage = Math.round((currentLevel / maxCapacity) * 100);
            } else if (currentLevel >= 0 && currentLevel <= 100) {
              percentage = currentLevel;
            } else if (currentLevel > 100) {
              percentage = Math.round((currentLevel / 255) * 100);
            }
            
            if (percentage !== null) {
              percentage = Math.max(0, Math.min(100, percentage));
              
              // Detectar cor baseado no nome ou posição
              let color = 'black';
              const colorLower = colorName.toLowerCase();
              if (colorLower.includes('cyan') || colorLower.includes('ciano')) color = 'cyan';
              else if (colorLower.includes('magenta')) color = 'magenta';
              else if (colorLower.includes('yellow') || colorLower.includes('amarelo')) color = 'yellow';
              else if (colorLower.includes('black') || colorLower.includes('preto') || colorLower.includes('negro')) color = 'black';
              else if (i === 0) color = 'cyan';
              else if (i === 1) color = 'magenta';
              else if (i === 2) color = 'yellow';
              else if (i === 3) color = 'black';
              
              inkLevels.push({
                color,
                level: percentage,
                name: colorName || color
              });
              
              totalInk += percentage;
              validCartridges++;
              
              console.log(`  🎨 Cartucho ${i + 1} (${color}): ${percentage}%`);
            }
          }
        }
        
        // Calcular média geral
        const avgInkLevel = validCartridges > 0 ? Math.round(totalInk / validCartridges) : null;
        
        const info = {
          available: true,
          description: varbinds[0]?.value?.toString() || 'N/A',
          status: varbinds[1]?.value || 0,
          inkLevel: avgInkLevel,
          inkLevels: inkLevels.length > 0 ? inkLevels : null,
        };
        
        resolve(info);
      });
    } catch (error) {
      console.log(`  ⚠️  Erro SNMP para ${ip}:`, error.message);
      resolve({ available: false });
    }
  });
}

/**
 * Tenta obter nível de tinta usando múltiplos OIDs alternativos
 */
async function tryAlternativeInkOIDs(ip, community = 'public') {
  return new Promise((resolve) => {
    try {
      const session = new snmp.Session({ host: ip, community, timeout: 5000 });
      
      // Lista de OIDs alternativos para diferentes fabricantes
      const alternativeOIDs = [
        // Índices diferentes do mesmo OID base
        [1, 3, 6, 1, 2, 1, 43, 11, 1, 1, 9, 1, 2], // Segundo cartucho
        [1, 3, 6, 1, 2, 1, 43, 11, 1, 1, 9, 1, 3], // Terceiro cartucho
        [1, 3, 6, 1, 2, 1, 43, 11, 1, 1, 9, 1, 4], // Quarto cartucho
        // HP específico
        [1, 3, 6, 1, 4, 1, 11, 2, 3, 9, 4, 2, 1, 4, 1, 1, 5, 1],
        // Brother específico
        [1, 3, 6, 1, 4, 1, 2435, 2, 3, 9, 4, 2, 1, 5, 5, 1, 0],
      ];
      
      session.getAll({ oids: alternativeOIDs }, (error, varbinds) => {
        session.close();
        
        if (error) {
          resolve(null);
          return;
        }
        
        console.log(`  🔍 Tentando OIDs alternativos para ${ip}:`, 
          varbinds.map((v, i) => `OID[${i}]: ${v?.value}`).join(', ')
        );
        
        // Procurar o primeiro valor válido
        for (const varbind of varbinds) {
          const value = varbind?.value;
          if (value !== null && value !== undefined && value >= 0) {
            let inkLevel = null;
            
            if (value <= 100) {
              inkLevel = value;
            } else if (value <= 255) {
              inkLevel = Math.round((value / 255) * 100);
            }
            
            if (inkLevel !== null) {
              console.log(`  ✅ Nível encontrado via OID alternativo: ${inkLevel}%`);
              resolve(inkLevel);
              return;
            }
          }
        }
        
        resolve(null);
      });
    } catch (error) {
      resolve(null);
    }
  });
}

/**
 * Detecta impressoras de rede configuradas
 */
async function detectNetworkPrinters() {
  const printers = [];
  
  if (!config.networkPrinters || config.networkPrinters.length === 0) {
    console.log('ℹ️  Nenhuma impressora de rede configurada');
    return printers;
  }
  
  console.log(`🌐 Verificando ${config.networkPrinters.length} impressoras de rede...`);
  
  for (const networkPrinter of config.networkPrinters) {
    try {
      const { name, ip, snmpCommunity } = networkPrinter;
      
      // Verificar se está online
      const isOnline = await checkHostOnline(ip);
      
      let inkLevel = null;
      let status = isOnline ? 'Online' : 'Offline';
      
      // Se estiver online, tentar obter informações via SNMP
      let inkLevels = null;
      if (isOnline) {
        const snmpInfo = await getSNMPInfo(ip, snmpCommunity || 'public');
        
        if (snmpInfo.available) {
          // Converter status SNMP para texto legível
          const statusMap = {
            1: 'Online',
            2: 'Unknown',
            3: 'Idle',
            4: 'Printing',
            5: 'Warmup',
          };
          status = statusMap[snmpInfo.status] || 'Online';
          
          // Níveis de tinta por cor (se disponível)
          if (snmpInfo.inkLevels && snmpInfo.inkLevels.length > 0) {
            inkLevels = snmpInfo.inkLevels;
            console.log(`  🎨 Níveis de tinta por cor detectados: ${inkLevels.length} cartuchos`);
          }
          
          // Nível de tinta médio (se disponível)
          if (snmpInfo.inkLevel !== null && snmpInfo.inkLevel >= 0) {
            inkLevel = Math.min(100, snmpInfo.inkLevel);
            console.log(`  🎨 Nível médio de tinta: ${inkLevel}%`);
          } else {
            console.log(`  ⚠️  Nível de tinta não disponível via OID padrão, tentando OIDs alternativos...`);
            // Tentar OIDs alternativos
            const alternativeInkLevel = await tryAlternativeInkOIDs(ip, snmpCommunity || 'public');
            if (alternativeInkLevel !== null) {
              inkLevel = alternativeInkLevel;
            } else {
              console.log(`  ❌ Nenhum OID alternativo retornou nível de tinta`);
            }
          }
        }
      }
      
      printers.push({
        name,
        type: 'Rede',
        ip,
        usb_port: null,
        status,
        ink_level: inkLevel,
        ink_levels: inkLevels,
        last_check: new Date().toISOString(),
        location: config.location,
        registered_by: config.computerName,
      });
      
      console.log(`  ${isOnline ? '✅' : '❌'} ${name} (${ip}) - ${status} - Tinta: ${inkLevel !== null ? inkLevel + '%' : 'N/A'}`);
    } catch (error) {
      console.error(`⚠️  Erro ao verificar ${networkPrinter.name}:`, error.message);
    }
  }
  
  return printers;
}

// ============================================
// 💾 ENVIO PARA FIREBASE
// ============================================

/**
 * Envia ou atualiza informações de uma impressora no Firestore
 */
async function updatePrinterInFirestore(printer) {
  try {
    // Criar ID único baseado no nome e tipo
    const printerId = `${printer.registered_by}_${printer.name}`
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    
    const printerRef = db.collection(`artifacts/${appId}/printers`).doc(printerId);
    
    // Adicionar timestamp do Firestore
    const printerData = {
      ...printer,
      last_check: Timestamp.now(),
      updated_at: Timestamp.now(),
    };
    
    // Verificar se já existe
    const doc = await printerRef.get();
    
    if (doc.exists) {
      // Atualizar apenas campos relevantes
      await printerRef.update({
        status: printerData.status,
        ink_level: printerData.ink_level,
        ink_levels: printerData.ink_levels || null,
        last_check: printerData.last_check,
        updated_at: printerData.updated_at,
        ip: printerData.ip,
        usb_port: printerData.usb_port,
      });
    } else {
      // Criar novo documento
      await printerRef.set({
        ...printerData,
        created_at: Timestamp.now(),
      });
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Erro ao atualizar impressora ${printer.name}:`, error.message);
    return false;
  }
}

/**
 * Processa e envia todas as impressoras detectadas
 */
async function syncPrintersToFirestore(printers) {
  console.log(`\n📤 Enviando ${printers.length} impressoras para o Firebase...`);
  
  let successCount = 0;
  
  for (const printer of printers) {
    const success = await updatePrinterInFirestore(printer);
    if (success) successCount++;
  }
  
  console.log(`✅ ${successCount}/${printers.length} impressoras sincronizadas com sucesso\n`);
}

// ============================================
// 🔄 LOOP PRINCIPAL
// ============================================

/**
 * Executa uma verificação completa de todas as impressoras
 */
async function runCheck() {
  console.log('═══════════════════════════════════════════════════════');
  console.log(`🔍 Iniciando verificação - ${new Date().toLocaleString('pt-BR')}`);
  console.log('═══════════════════════════════════════════════════════');
  
  try {
    // Detectar impressoras USB e de rede em paralelo
    const [usbPrinters, networkPrinters] = await Promise.all([
      detectUSBPrinters(),
      detectNetworkPrinters(),
    ]);
    
    // Combinar todas as impressoras
    const allPrinters = [...usbPrinters, ...networkPrinters];
    
    if (allPrinters.length === 0) {
      console.log('⚠️  Nenhuma impressora detectada');
    } else {
      // Enviar para o Firebase
      await syncPrintersToFirestore(allPrinters);
    }
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  }
  
  const nextCheck = new Date(Date.now() + config.checkInterval);
  console.log(`⏰ Próxima verificação em ${config.checkInterval / 1000}s (${nextCheck.toLocaleTimeString('pt-BR')})\n`);
}

/**
 * Inicia o loop de monitoramento
 */
async function startMonitoring() {
  console.log('\n🚀 AGENTE DE MONITORAMENTO DE IMPRESSORAS INICIADO');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Primeira verificação imediata
  await runCheck();
  
  // Configurar verificações periódicas
  const interval = config.checkInterval || 60000; // Padrão: 60 segundos
  setInterval(runCheck, interval);
  
  console.log('✅ Monitoramento ativo. Pressione Ctrl+C para encerrar.\n');
}

// ============================================
// 🎬 INICIALIZAÇÃO
// ============================================

async function main() {
  try {
    // Carregar configurações
    await loadConfig();
    
    // Inicializar Firebase
    initializeFirebase();
    
    // Iniciar monitoramento
    await startMonitoring();
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

// Tratamento de sinais para encerramento gracioso
process.on('SIGINT', () => {
  console.log('\n\n👋 Encerrando agente de monitoramento...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Encerrando agente de monitoramento...');
  process.exit(0);
});

// Iniciar aplicação
main();
