/**
 * Script Node.js para monitorar níveis de tinta das impressoras
 * Pode ser executado como serviço ou via Electron
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class PrinterMonitor {
    constructor() {
        this.printers = [];
        this.updateInterval = 300000; // 5 minutos
        this.scriptPath = path.join(__dirname, 'get-printer-ink-levels.ps1');
    }

    /**
     * Executa o script PowerShell para obter informações das impressoras
     */
    async getPrinterInfo(printerName = '') {
        return new Promise((resolve, reject) => {
            const command = `powershell -ExecutionPolicy Bypass -File "${this.scriptPath}" -PrinterName "${printerName}"`;
            
            exec(command, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
                if (error) {
                    console.error('Erro ao executar PowerShell:', error);
                    reject(error);
                    return;
                }
                
                if (stderr) {
                    console.warn('PowerShell stderr:', stderr);
                }
                
                try {
                    const result = JSON.parse(stdout);
                    resolve(result);
                } catch (parseError) {
                    console.error('Erro ao parsear JSON:', parseError);
                    console.log('Output:', stdout);
                    reject(parseError);
                }
            });
        });
    }

    /**
     * Detecta todas as impressoras conectadas
     */
    async detectPrinters() {
        try {
            const printers = await this.getPrinterInfo();
            this.printers = Array.isArray(printers) ? printers : [printers];
            return this.printers;
        } catch (error) {
            console.error('Erro ao detectar impressoras:', error);
            return [];
        }
    }

    /**
     * Obtém informações de uma impressora específica
     */
    async getPrinterByName(name) {
        try {
            const printer = await this.getPrinterInfo(name);
            return printer;
        } catch (error) {
            console.error(`Erro ao obter impressora ${name}:`, error);
            return null;
        }
    }

    /**
     * Inicia monitoramento contínuo
     */
    startMonitoring(callback) {
        console.log('Iniciando monitoramento de impressoras...');
        
        // Primeira execução imediata
        this.detectPrinters().then(printers => {
            console.log(`Detectadas ${printers.length} impressora(s)`);
            if (callback) callback(printers);
        });

        // Execuções periódicas
        this.monitoringInterval = setInterval(async () => {
            const printers = await this.detectPrinters();
            console.log(`Atualização: ${printers.length} impressora(s)`);
            if (callback) callback(printers);
        }, this.updateInterval);
    }

    /**
     * Para o monitoramento
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            console.log('Monitoramento parado');
        }
    }

    /**
     * Simula níveis de tinta para teste (quando não conseguir ler da impressora)
     */
    simulateInkLevels(printer) {
        return {
            ...printer,
            TintaPreta: Math.floor(Math.random() * 100),
            TintaCiano: Math.floor(Math.random() * 100),
            TintaMagenta: Math.floor(Math.random() * 100),
            TintaAmarela: Math.floor(Math.random() * 100),
            Metodo: 'Simulado (Teste)'
        };
    }
}

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PrinterMonitor;
}

// Se executado diretamente, fazer teste
if (require.main === module) {
    const monitor = new PrinterMonitor();
    
    console.log('=== Teste do Monitor de Impressoras ===\n');
    
    monitor.detectPrinters().then(printers => {
        console.log('Impressoras detectadas:');
        console.log(JSON.stringify(printers, null, 2));
        
        if (printers.length > 0) {
            console.log('\n=== Iniciando monitoramento contínuo ===');
            console.log('Pressione Ctrl+C para parar\n');
            
            monitor.startMonitoring((updatedPrinters) => {
                console.log(`[${new Date().toLocaleTimeString()}] Atualização:`, 
                    updatedPrinters.map(p => p.Nome).join(', '));
            });
        } else {
            console.log('\nNenhuma impressora detectada.');
            console.log('Verifique se há impressoras instaladas no Windows.');
        }
    }).catch(error => {
        console.error('Erro:', error);
    });
}
