# 🐛 Debug - Níveis de Tinta não aparecem

## Problema
As impressoras aparecem no app com status, mas o nível de tinta não está sendo exibido.

## Alterações Realizadas

### 1. Melhorias no SNMP (`agent/index.js`)
- ✅ Adicionado OID para capacidade máxima de tinta (`prtMarkerSuppliesMaxCapacity`)
- ✅ Implementado cálculo de percentual baseado em capacidade máxima
- ✅ Adicionado suporte para múltiplas escalas (0-100, 0-255)
- ✅ Adicionado logging detalhado para debug
- ✅ Aumentado timeout de SNMP de 3000ms para 5000ms

### 2. Logs Adicionados
Agora o agente mostra:
- 📊 Resposta completa do SNMP (descrição, status, nível atual, capacidade máxima)
- 🖋️ Cálculo do percentual de tinta
- 🎨 Confirmação quando o nível é detectado
- ⚠️ Aviso quando o nível não está disponível

## Como Testar

### Passo 1: Reiniciar o Agente
```bash
cd agent
npm start
```

### Passo 2: Observar os Logs
Procure por estas mensagens no console:

```
📊 SNMP Response para [IP]:
  description: [modelo da impressora]
  status: [número]
  currentLevel: [valor] ← Este é o nível atual
  maxCapacity: [valor]  ← Esta é a capacidade máxima

🖋️ Tinta calculada: [atual]/[máximo] = [percentual]%
🎨 Nível de tinta detectado: [percentual]%
```

### Passo 3: Verificar Possíveis Problemas

#### ❌ Se aparecer: "SNMP não disponível"
**Causa:** A impressora não responde a SNMP
**Solução:**
1. Verificar se SNMP está habilitado na impressora
2. Acessar painel web da impressora (http://[IP])
3. Procurar por configurações de SNMP
4. Habilitar SNMP v1/v2c
5. Definir community string (padrão: "public")

#### ❌ Se aparecer: "currentLevel: null" ou "undefined"
**Causa:** O OID padrão não funciona para esta impressora
**Solução:** Precisamos descobrir o OID correto para esta impressora específica

#### ❌ Se aparecer: "Nível de tinta não disponível via SNMP"
**Causa:** O valor retornado é null ou negativo
**Solução:** Verificar logs para entender o que está sendo retornado

## OIDs SNMP Utilizados

```
Descrição do Sistema:
  1.3.6.1.2.1.1.1.0

Status da Impressora:
  1.3.6.1.2.1.25.3.5.1.1.1

Nível Atual de Suprimento:
  1.3.6.1.2.1.43.11.1.1.9.1.1

Capacidade Máxima:
  1.3.6.1.2.1.43.11.1.1.8.1.1
```

## Testando SNMP Manualmente

### Windows (usando snmpwalk)
```bash
# Instalar snmpwalk (via Chocolatey)
choco install net-snmp

# Testar conexão SNMP
snmpwalk -v2c -c public [IP] 1.3.6.1.2.1.43.11.1.1.9

# Ver capacidade máxima
snmpwalk -v2c -c public [IP] 1.3.6.1.2.1.43.11.1.1.8
```

### Alternativa: Usar ferramenta online
- SNMP Tester: https://www.paessler.com/tools/snmptester
- Inserir IP da impressora
- Community: public
- OID: 1.3.6.1.2.1.43.11.1.1.9.1.1

## Próximos Passos

1. **Executar o agente** e observar os logs
2. **Copiar os logs** da seção SNMP Response
3. **Verificar se currentLevel e maxCapacity** têm valores
4. **Se não tiver valores**, testar SNMP manualmente
5. **Reportar os resultados** para ajuste do código

## Fabricantes Conhecidos

### HP
- Geralmente usa OID padrão
- Pode precisar habilitar SNMP no painel web

### Brother
- Pode usar OIDs proprietários
- Verificar documentação específica

### Epson
- Pode não suportar nível de tinta via SNMP
- Algumas impressoras só reportam via software proprietário

### Canon
- Suporte limitado a SNMP
- Pode precisar de OIDs específicos

## Informações Adicionais

Se os OIDs padrão não funcionarem, podemos:
1. Fazer um SNMP walk completo na impressora
2. Procurar OIDs específicos do fabricante
3. Implementar suporte para múltiplos cartuchos (CMYK)
4. Adicionar fallback para outros métodos de detecção
