import TelegramBot from 'node-telegram-bot-api';
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Configuração de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const APP_ID = process.env.APP_ID || 'hpaes-rotinas-ti';
const ADMIN_IDS = process.env.ADMIN_TELEGRAM_IDS?.split(',').map(id => parseInt(id.trim())) || [];

// Criar bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Armazenar usuários registrados
const registeredUsers = new Map();

// Emojis para melhor visualização
const EMOJI = {
  check: '✅',
  cross: '❌',
  clock: '⏰',
  warning: '⚠️',
  info: 'ℹ️',
  printer: '🖨️',
  computer: '💻',
  network: '🌐',
  backup: '💾',
  server: '🖥️',
  fire: '🔥',
  star: '⭐',
  robot: '🤖',
  chart: '📊',
  calendar: '📅',
  bell: '🔔'
};

// Função para formatar data
function formatDate(timestamp) {
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Função para obter emoji de categoria
function getCategoryEmoji(categoria) {
  const map = {
    'Impressoras': EMOJI.printer,
    'Computadores': EMOJI.computer,
    'Rede': EMOJI.network,
    'Backup': EMOJI.backup,
    'Servidores': EMOJI.server,
  };
  return map[categoria] || EMOJI.info;
}

// Comando /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name;
  
  const welcomeMessage = `
${EMOJI.robot} *Bem-vindo ao Bot de Rotinas TI - HPAES!*

Olá, ${userName}! 👋

Eu sou seu assistente para gerenciar rotinas de TI.

*Comandos disponíveis:*

📋 *Rotinas*
/rotinas - Ver todas as rotinas
/pendentes - Ver rotinas pendentes hoje
/executar - Marcar rotina como executada

📊 *Status*
/status - Ver resumo do dia
/historico - Ver histórico recente

🖨️ *Impressoras*
/impressoras - Status das impressoras
/alertas - Ver alertas ativos

⚙️ *Configurações*
/registrar - Registrar seu usuário
/ajuda - Ver esta mensagem

Digite /registrar para começar!
  `;
  
  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Comando /ajuda
bot.onText(/\/ajuda/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Digite /start para ver todos os comandos disponíveis.');
});

// Comando /registrar
bot.onText(/\/registrar/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  
  try {
    // Buscar usuários no Firebase
    const usersSnapshot = await db.collection(`artifacts/${APP_ID}/users`).get();
    
    if (usersSnapshot.empty) {
      bot.sendMessage(chatId, `${EMOJI.warning} Nenhum usuário encontrado no sistema. Entre em contato com o administrador.`);
      return;
    }
    
    // Criar teclado inline com usuários
    const keyboard = {
      inline_keyboard: usersSnapshot.docs.map(doc => [{
        text: `${doc.data().nome} (${doc.data().tipo})`,
        callback_data: `register_${doc.id}`
      }])
    };
    
    bot.sendMessage(chatId, `${EMOJI.info} Selecione seu usuário:`, { reply_markup: keyboard });
    
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    bot.sendMessage(chatId, `${EMOJI.cross} Erro ao buscar usuários. Tente novamente.`);
  }
});

// Handler para registro de usuário
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  
  if (data.startsWith('register_')) {
    const userId = data.replace('register_', '');
    const telegramId = query.from.id;
    
    try {
      const userDoc = await db.doc(`artifacts/${APP_ID}/users/${userId}`).get();
      
      if (!userDoc.exists) {
        bot.answerCallbackQuery(query.id, { text: 'Usuário não encontrado!' });
        return;
      }
      
      const userData = userDoc.data();
      
      // Salvar registro
      registeredUsers.set(telegramId, {
        userId: userId,
        nome: userData.nome,
        tipo: userData.tipo,
        email: userData.email
      });
      
      // Atualizar documento do usuário com Telegram ID
      await db.doc(`artifacts/${APP_ID}/users/${userId}`).update({
        telegramId: telegramId,
        telegramUsername: query.from.username || ''
      });
      
      bot.answerCallbackQuery(query.id, { text: 'Registrado com sucesso!' });
      bot.sendMessage(chatId, 
        `${EMOJI.check} *Registro concluído!*\n\n` +
        `Nome: ${userData.nome}\n` +
        `Tipo: ${userData.tipo}\n\n` +
        `Agora você pode usar todos os comandos do bot!`,
        { parse_mode: 'Markdown' }
      );
      
    } catch (error) {
      console.error('Erro ao registrar:', error);
      bot.answerCallbackQuery(query.id, { text: 'Erro ao registrar!' });
    }
  }
  
  if (data.startsWith('exec_')) {
    await handleExecuteRotina(query);
  }
});

// Comando /rotinas
bot.onText(/\/rotinas/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const rotinasSnapshot = await db.collection(`artifacts/${APP_ID}/public/data/rotinas`).get();
    
    if (rotinasSnapshot.empty) {
      bot.sendMessage(chatId, `${EMOJI.info} Nenhuma rotina cadastrada.`);
      return;
    }
    
    let message = `📋 *ROTINAS CADASTRADAS*\n\n`;
    
    const rotinasPorFreq = {
      'diaria': [],
      'semanal': [],
      'mensal': []
    };
    
    rotinasSnapshot.docs.forEach(doc => {
      const rotina = doc.data();
      rotinasPorFreq[rotina.frequencia]?.push({
        id: doc.id,
        ...rotina
      });
    });
    
    // Rotinas diárias
    if (rotinasPorFreq.diaria.length > 0) {
      message += `${EMOJI.calendar} *DIÁRIAS*\n`;
      rotinasPorFreq.diaria.forEach(r => {
        message += `${getCategoryEmoji(r.categoria)} ${r.nome}\n`;
        message += `   _${r.descricao}_\n\n`;
      });
    }
    
    // Rotinas semanais
    if (rotinasPorFreq.semanal.length > 0) {
      message += `${EMOJI.calendar} *SEMANAIS*\n`;
      rotinasPorFreq.semanal.forEach(r => {
        message += `${getCategoryEmoji(r.categoria)} ${r.nome}\n`;
        message += `   _${r.descricao}_\n\n`;
      });
    }
    
    // Rotinas mensais
    if (rotinasPorFreq.mensal.length > 0) {
      message += `${EMOJI.calendar} *MENSAIS*\n`;
      rotinasPorFreq.mensal.forEach(r => {
        message += `${getCategoryEmoji(r.categoria)} ${r.nome}\n`;
        message += `   _${r.descricao}_\n\n`;
      });
    }
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Erro ao buscar rotinas:', error);
    bot.sendMessage(chatId, `${EMOJI.cross} Erro ao buscar rotinas.`);
  }
});

// Comando /pendentes
bot.onText(/\/pendentes/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const rotinasSnapshot = await db.collection(`artifacts/${APP_ID}/public/data/rotinas`)
      .where('frequencia', '==', 'diaria')
      .get();
    
    const execucoesSnapshot = await db.collection(`artifacts/${APP_ID}/public/data/execucoes`)
      .where('dataHora', '>=', admin.firestore.Timestamp.fromDate(hoje))
      .get();
    
    const executadas = new Set(execucoesSnapshot.docs.map(doc => doc.data().rotinaId));
    
    const pendentes = rotinasSnapshot.docs.filter(doc => !executadas.has(doc.id));
    
    if (pendentes.length === 0) {
      bot.sendMessage(chatId, `${EMOJI.check} Todas as rotinas diárias foram executadas hoje!`);
      return;
    }
    
    let message = `${EMOJI.warning} *ROTINAS PENDENTES HOJE*\n\n`;
    message += `Total: ${pendentes.length}\n\n`;
    
    pendentes.forEach(doc => {
      const rotina = doc.data();
      message += `${getCategoryEmoji(rotina.categoria)} *${rotina.nome}*\n`;
      message += `   ${rotina.descricao}\n\n`;
    });
    
    // Adicionar botão para executar
    const keyboard = {
      inline_keyboard: [[{
        text: '✅ Executar Rotina',
        callback_data: 'show_exec_options'
      }]]
    };
    
    bot.sendMessage(chatId, message, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
    
  } catch (error) {
    console.error('Erro ao buscar pendentes:', error);
    bot.sendMessage(chatId, `${EMOJI.cross} Erro ao buscar rotinas pendentes.`);
  }
});

// Comando /executar
bot.onText(/\/executar/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  
  if (!registeredUsers.has(telegramId)) {
    bot.sendMessage(chatId, `${EMOJI.warning} Você precisa se registrar primeiro! Use /registrar`);
    return;
  }
  
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const rotinasSnapshot = await db.collection(`artifacts/${APP_ID}/public/data/rotinas`)
      .where('frequencia', '==', 'diaria')
      .get();
    
    const execucoesSnapshot = await db.collection(`artifacts/${APP_ID}/public/data/execucoes`)
      .where('dataHora', '>=', admin.firestore.Timestamp.fromDate(hoje))
      .get();
    
    const executadas = new Set(execucoesSnapshot.docs.map(doc => doc.data().rotinaId));
    const pendentes = rotinasSnapshot.docs.filter(doc => !executadas.has(doc.id));
    
    if (pendentes.length === 0) {
      bot.sendMessage(chatId, `${EMOJI.check} Todas as rotinas já foram executadas!`);
      return;
    }
    
    const keyboard = {
      inline_keyboard: pendentes.map(doc => [{
        text: `${getCategoryEmoji(doc.data().categoria)} ${doc.data().nome}`,
        callback_data: `exec_${doc.id}`
      }])
    };
    
    bot.sendMessage(chatId, 
      `${EMOJI.info} Selecione a rotina para marcar como executada:`,
      { reply_markup: keyboard }
    );
    
  } catch (error) {
    console.error('Erro ao listar rotinas:', error);
    bot.sendMessage(chatId, `${EMOJI.cross} Erro ao listar rotinas.`);
  }
});

// Handler para executar rotina
async function handleExecuteRotina(query) {
  const chatId = query.message.chat.id;
  const telegramId = query.from.id;
  const rotinaId = query.data.replace('exec_', '');
  
  if (!registeredUsers.has(telegramId)) {
    bot.answerCallbackQuery(query.id, { text: 'Você precisa se registrar primeiro!' });
    return;
  }
  
  try {
    const user = registeredUsers.get(telegramId);
    const rotinaDoc = await db.doc(`artifacts/${APP_ID}/public/data/rotinas/${rotinaId}`).get();
    
    if (!rotinaDoc.exists) {
      bot.answerCallbackQuery(query.id, { text: 'Rotina não encontrada!' });
      return;
    }
    
    const rotina = rotinaDoc.data();
    
    // Criar execução
    await db.collection(`artifacts/${APP_ID}/public/data/execucoes`).add({
      rotinaId: rotinaId,
      rotinaNome: rotina.nome,
      dataHora: admin.firestore.Timestamp.now(),
      responsavelId: user.userId,
      responsavelNome: user.nome,
      observacao: 'Executado via Telegram Bot',
      origem: 'telegram'
    });
    
    bot.answerCallbackQuery(query.id, { text: 'Rotina executada com sucesso!' });
    bot.sendMessage(chatId,
      `${EMOJI.check} *Rotina Executada!*\n\n` +
      `${getCategoryEmoji(rotina.categoria)} ${rotina.nome}\n` +
      `Por: ${user.nome}\n` +
      `Horário: ${formatDate(new Date())}`,
      { parse_mode: 'Markdown' }
    );
    
  } catch (error) {
    console.error('Erro ao executar rotina:', error);
    bot.answerCallbackQuery(query.id, { text: 'Erro ao executar rotina!' });
  }
}

// Comando /status
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Buscar rotinas diárias
    const rotinasSnapshot = await db.collection(`artifacts/${APP_ID}/public/data/rotinas`)
      .where('frequencia', '==', 'diaria')
      .get();
    
    // Buscar execuções de hoje
    const execucoesSnapshot = await db.collection(`artifacts/${APP_ID}/public/data/execucoes`)
      .where('dataHora', '>=', admin.firestore.Timestamp.fromDate(hoje))
      .get();
    
    const totalRotinas = rotinasSnapshot.size;
    const executadas = execucoesSnapshot.size;
    const pendentes = totalRotinas - executadas;
    const percentual = totalRotinas > 0 ? Math.round((executadas / totalRotinas) * 100) : 0;
    
    let message = `${EMOJI.chart} *STATUS DO DIA*\n\n`;
    message += `📅 ${hoje.toLocaleDateString('pt-BR')}\n\n`;
    message += `${EMOJI.check} Executadas: ${executadas}\n`;
    message += `${EMOJI.clock} Pendentes: ${pendentes}\n`;
    message += `📊 Progresso: ${percentual}%\n\n`;
    
    // Barra de progresso
    const barLength = 10;
    const filled = Math.round((percentual / 100) * barLength);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
    message += `${bar} ${percentual}%\n\n`;
    
    if (pendentes > 0) {
      message += `${EMOJI.warning} Ainda há ${pendentes} rotina(s) pendente(s)!`;
    } else {
      message += `${EMOJI.star} Parabéns! Todas as rotinas foram executadas!`;
    }
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    bot.sendMessage(chatId, `${EMOJI.cross} Erro ao buscar status.`);
  }
});

// Comando /historico
bot.onText(/\/historico/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const execucoesSnapshot = await db.collection(`artifacts/${APP_ID}/public/data/execucoes`)
      .orderBy('dataHora', 'desc')
      .limit(10)
      .get();
    
    if (execucoesSnapshot.empty) {
      bot.sendMessage(chatId, `${EMOJI.info} Nenhuma execução registrada.`);
      return;
    }
    
    let message = `📜 *HISTÓRICO RECENTE*\n\n`;
    message += `Últimas 10 execuções:\n\n`;
    
    execucoesSnapshot.docs.forEach(doc => {
      const exec = doc.data();
      message += `${EMOJI.check} *${exec.rotinaNome}*\n`;
      message += `   Por: ${exec.responsavelNome}\n`;
      message += `   ${formatDate(exec.dataHora)}\n`;
      if (exec.observacao && exec.observacao !== 'Executado via Telegram Bot') {
        message += `   _${exec.observacao}_\n`;
      }
      message += `\n`;
    });
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    bot.sendMessage(chatId, `${EMOJI.cross} Erro ao buscar histórico.`);
  }
});

// Comando /impressoras
bot.onText(/\/impressoras/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const impressorasSnapshot = await db.collection(`artifacts/${APP_ID}/public/data/impressoras`).get();
    
    if (impressorasSnapshot.empty) {
      bot.sendMessage(chatId, `${EMOJI.info} Nenhuma impressora monitorada.`);
      return;
    }
    
    let message = `${EMOJI.printer} *STATUS DAS IMPRESSORAS*\n\n`;
    
    let online = 0;
    let offline = 0;
    let alertas = 0;
    
    impressorasSnapshot.docs.forEach(doc => {
      const imp = doc.data();
      const status = imp.status === 'online' ? EMOJI.check : EMOJI.cross;
      
      message += `${status} *${imp.nome}*\n`;
      message += `   IP: ${imp.ip || 'N/A'}\n`;
      message += `   Status: ${imp.status}\n`;
      
      if (imp.nivelTinta) {
        const tintaBaixa = Object.values(imp.nivelTinta).some(nivel => nivel < 20);
        if (tintaBaixa) {
          message += `   ${EMOJI.warning} Tinta baixa!\n`;
          alertas++;
        }
      }
      
      message += `\n`;
      
      if (imp.status === 'online') online++;
      else offline++;
    });
    
    message += `\n📊 *Resumo*\n`;
    message += `${EMOJI.check} Online: ${online}\n`;
    message += `${EMOJI.cross} Offline: ${offline}\n`;
    message += `${EMOJI.warning} Alertas: ${alertas}\n`;
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Erro ao buscar impressoras:', error);
    bot.sendMessage(chatId, `${EMOJI.cross} Erro ao buscar impressoras.`);
  }
});

// Comando /alertas
bot.onText(/\/alertas/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const impressorasSnapshot = await db.collection(`artifacts/${APP_ID}/public/data/impressoras`).get();
    
    let alertas = [];
    
    impressorasSnapshot.docs.forEach(doc => {
      const imp = doc.data();
      
      if (imp.status === 'offline') {
        alertas.push({
          tipo: 'offline',
          nome: imp.nome,
          mensagem: 'Impressora offline'
        });
      }
      
      if (imp.nivelTinta) {
        Object.entries(imp.nivelTinta).forEach(([cor, nivel]) => {
          if (nivel < 20) {
            alertas.push({
              tipo: 'tinta',
              nome: imp.nome,
              mensagem: `Tinta ${cor} baixa (${nivel}%)`
            });
          }
        });
      }
    });
    
    if (alertas.length === 0) {
      bot.sendMessage(chatId, `${EMOJI.check} Nenhum alerta ativo!`);
      return;
    }
    
    let message = `${EMOJI.warning} *ALERTAS ATIVOS*\n\n`;
    message += `Total: ${alertas.length}\n\n`;
    
    alertas.forEach(alerta => {
      const emoji = alerta.tipo === 'offline' ? EMOJI.cross : EMOJI.warning;
      message += `${emoji} *${alerta.nome}*\n`;
      message += `   ${alerta.mensagem}\n\n`;
    });
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    bot.sendMessage(chatId, `${EMOJI.cross} Erro ao buscar alertas.`);
  }
});

// Sistema de notificações automáticas
async function verificarRotinasPendentes() {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeTimestamp = admin.firestore.Timestamp.fromDate(hoje);
    
    // Buscar TODAS as rotinas (não só diárias)
    const rotinasSnapshot = await db.collection(`artifacts/${APP_ID}/public/data/rotinas`).get();
    
    const execucoesSnapshot = await db.collection(`artifacts/${APP_ID}/public/data/execucoes`)
      .where('dataHora', '>=', hojeTimestamp)
      .get();
    
    const executadas = new Set(execucoesSnapshot.docs.map(doc => doc.data().rotinaId));
    
    // Filtrar rotinas pendentes baseado na frequência
    const pendentes = [];
    
    rotinasSnapshot.docs.forEach(doc => {
      const rotina = doc.data();
      const rotinaId = doc.id;
      
      // Se já foi executada hoje, não está pendente
      if (executadas.has(rotinaId)) {
        return;
      }
      
      let isPendente = false;
      
      switch(rotina.frequencia) {
        case 'diaria':
          // Rotinas diárias são pendentes se não foram executadas hoje
          isPendente = true;
          break;
          
        case 'semanal':
          // Rotinas semanais são pendentes se não foram executadas esta semana
          const inicioSemana = new Date(hoje);
          inicioSemana.setDate(hoje.getDate() - hoje.getDay());
          const execucaoSemanal = execucoesSnapshot.docs.find(e => 
            e.data().rotinaId === rotinaId && 
            e.data().dataHora.toDate() >= inicioSemana
          );
          isPendente = !execucaoSemanal;
          break;
          
        case 'mensal':
          // Rotinas mensais são pendentes se não foram executadas este mês
          const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
          const execucaoMensal = execucoesSnapshot.docs.find(e => 
            e.data().rotinaId === rotinaId && 
            e.data().dataHora.toDate() >= inicioMes
          );
          isPendente = !execucaoMensal;
          break;
          
        case 'agendada':
          // Rotinas agendadas são pendentes se a data é hoje
          if (rotina.dataEspecifica) {
            const dataAgendada = new Date(rotina.dataEspecifica);
            dataAgendada.setHours(0, 0, 0, 0);
            isPendente = dataAgendada.getTime() === hoje.getTime();
          }
          break;
          
        case 'unica':
          // Rotinas únicas são pendentes se nunca foram executadas
          const execucaoUnica = execucoesSnapshot.docs.find(e => e.data().rotinaId === rotinaId);
          isPendente = !execucaoUnica;
          break;
      }
      
      if (isPendente) {
        pendentes.push({ id: rotinaId, data: rotina });
      }
    });
    
    if (pendentes.length > 0) {
      // Notificar usuários registrados
      for (const [telegramId, user] of registeredUsers.entries()) {
        let message = `${EMOJI.bell} *LEMBRETE DE ROTINAS*\n\n`;
        message += `Olá ${user.nome}!\n\n`;
        message += `Você tem ${pendentes.length} rotina(s) pendente(s):\n\n`;
        
        // Agrupar por frequência
        const porFrequencia = {
          diaria: [],
          semanal: [],
          mensal: [],
          agendada: [],
          unica: []
        };
        
        pendentes.forEach(p => {
          porFrequencia[p.data.frequencia]?.push(p.data);
        });
        
        // Mostrar rotinas agrupadas
        if (porFrequencia.diaria.length > 0) {
          message += `📅 *Diárias (${porFrequencia.diaria.length})*\n`;
          porFrequencia.diaria.slice(0, 3).forEach(r => {
            message += `${getCategoryEmoji(r.categoria)} ${r.nome}\n`;
          });
          if (porFrequencia.diaria.length > 3) {
            message += `... e mais ${porFrequencia.diaria.length - 3}\n`;
          }
          message += `\n`;
        }
        
        if (porFrequencia.semanal.length > 0) {
          message += `📅 *Semanais (${porFrequencia.semanal.length})*\n`;
          porFrequencia.semanal.slice(0, 2).forEach(r => {
            message += `${getCategoryEmoji(r.categoria)} ${r.nome}\n`;
          });
          if (porFrequencia.semanal.length > 2) {
            message += `... e mais ${porFrequencia.semanal.length - 2}\n`;
          }
          message += `\n`;
        }
        
        if (porFrequencia.mensal.length > 0) {
          message += `📅 *Mensais (${porFrequencia.mensal.length})*\n`;
          porFrequencia.mensal.slice(0, 2).forEach(r => {
            message += `${getCategoryEmoji(r.categoria)} ${r.nome}\n`;
          });
          if (porFrequencia.mensal.length > 2) {
            message += `... e mais ${porFrequencia.mensal.length - 2}\n`;
          }
          message += `\n`;
        }
        
        if (porFrequencia.agendada.length > 0) {
          message += `📅 *Agendadas para Hoje (${porFrequencia.agendada.length})*\n`;
          porFrequencia.agendada.forEach(r => {
            message += `${getCategoryEmoji(r.categoria)} ${r.nome}\n`;
          });
          message += `\n`;
        }
        
        if (porFrequencia.unica.length > 0) {
          message += `📋 *Únicas (${porFrequencia.unica.length})*\n`;
          porFrequencia.unica.slice(0, 2).forEach(r => {
            message += `${getCategoryEmoji(r.categoria)} ${r.nome}\n`;
          });
          if (porFrequencia.unica.length > 2) {
            message += `... e mais ${porFrequencia.unica.length - 2}\n`;
          }
          message += `\n`;
        }
        
        message += `Use /pendentes para ver todas.`;
        
        try {
          await bot.sendMessage(telegramId, message, { parse_mode: 'Markdown' });
        } catch (error) {
          console.error(`Erro ao notificar usuário ${telegramId}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('Erro ao verificar rotinas pendentes:', error);
  }
}

// Verificar alertas de impressoras
async function verificarAlertasImpressoras() {
  try {
    const impressorasSnapshot = await db.collection(`artifacts/${APP_ID}/public/data/impressoras`).get();
    
    let alertasCriticos = [];
    
    impressorasSnapshot.docs.forEach(doc => {
      const imp = doc.data();
      
      if (imp.status === 'offline') {
        alertasCriticos.push(`${EMOJI.cross} ${imp.nome} está offline`);
      }
      
      if (imp.nivelTinta) {
        Object.entries(imp.nivelTinta).forEach(([cor, nivel]) => {
          if (nivel < 10) {
            alertasCriticos.push(`${EMOJI.warning} ${imp.nome}: Tinta ${cor} crítica (${nivel}%)`);
          }
        });
      }
    });
    
    if (alertasCriticos.length > 0 && ADMIN_IDS.length > 0) {
      let message = `${EMOJI.fire} *ALERTAS CRÍTICOS*\n\n`;
      message += alertasCriticos.join('\n');
      
      for (const adminId of ADMIN_IDS) {
        try {
          await bot.sendMessage(adminId, message, { parse_mode: 'Markdown' });
        } catch (error) {
          console.error(`Erro ao notificar admin ${adminId}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('Erro ao verificar alertas:', error);
  }
}

// Configurar verificações periódicas
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL || '60') * 60 * 1000; // Converter para ms

setInterval(verificarRotinasPendentes, CHECK_INTERVAL);
setInterval(verificarAlertasImpressoras, CHECK_INTERVAL);

// Verificar na inicialização
setTimeout(verificarRotinasPendentes, 5000);
setTimeout(verificarAlertasImpressoras, 10000);

console.log(`${EMOJI.robot} Bot do Telegram iniciado com sucesso!`);
console.log(`${EMOJI.info} Verificações automáticas a cada ${process.env.CHECK_INTERVAL || 60} minutos`);
console.log(`${EMOJI.bell} Aguardando comandos...`);

// Tratamento de erros
bot.on('polling_error', (error) => {
  console.error('Erro de polling:', error.message);
});

process.on('SIGINT', () => {
  console.log('\n👋 Encerrando bot...');
  bot.stopPolling();
  process.exit(0);
});
