# Script de Verificação e Correção do config.json
# Execução: .\verificar-config.ps1

Write-Host "`n🔍 VERIFICAÇÃO DO AGENTE DE IMPRESSORAS`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$configPath = ".\config.json"
$examplePath = ".\config.example.json"

# Verificar se config.json existe
Write-Host "1️⃣  Verificando se config.json existe..." -ForegroundColor Yellow

if (Test-Path $configPath) {
    Write-Host "   ✅ Arquivo config.json encontrado`n" -ForegroundColor Green
    
    # Ler e verificar o appId
    Write-Host "2️⃣  Verificando appId..." -ForegroundColor Yellow
    
    try {
        $config = Get-Content $configPath -Raw | ConvertFrom-Json
        $appId = $config.appId
        
        Write-Host "   📋 appId atual: '$appId'" -ForegroundColor White
        
        if ($appId -eq "rotinas-ti-app") {
            Write-Host "   ✅ appId está CORRETO!`n" -ForegroundColor Green
            Write-Host "   ℹ️  O agente está configurado corretamente." -ForegroundColor Cyan
            Write-Host "   ℹ️  Se as impressoras ainda não aparecem, verifique:" -ForegroundColor Cyan
            Write-Host "      - O agente está rodando?" -ForegroundColor White
            Write-Host "      - As credenciais do Firebase estão corretas?" -ForegroundColor White
            Write-Host "      - Há erros no console do agente?`n" -ForegroundColor White
        }
        elseif ($appId -eq "rotinas-ti-hpaes") {
            Write-Host "   ❌ appId está INCORRETO!`n" -ForegroundColor Red
            Write-Host "   🔧 CORREÇÃO NECESSÁRIA:" -ForegroundColor Yellow
            Write-Host "      O appId deve ser 'rotinas-ti-app' e não 'rotinas-ti-hpaes'`n" -ForegroundColor White
            
            # Perguntar se deseja corrigir automaticamente
            $resposta = Read-Host "   Deseja corrigir automaticamente? (S/N)"
            
            if ($resposta -eq "S" -or $resposta -eq "s") {
                # Fazer backup
                $backupPath = ".\config.json.backup"
                Copy-Item $configPath $backupPath
                Write-Host "`n   💾 Backup criado: config.json.backup" -ForegroundColor Cyan
                
                # Corrigir o appId
                $config.appId = "rotinas-ti-app"
                $config | ConvertTo-Json -Depth 10 | Set-Content $configPath
                
                Write-Host "   ✅ Correção aplicada com sucesso!`n" -ForegroundColor Green
                Write-Host "   📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
                Write-Host "      1. Pare o agente (Ctrl+C se estiver rodando)" -ForegroundColor White
                Write-Host "      2. Inicie o agente novamente" -ForegroundColor White
                Write-Host "      3. Verifique se as impressoras aparecem no app`n" -ForegroundColor White
            }
            else {
                Write-Host "`n   ℹ️  Correção manual necessária:" -ForegroundColor Cyan
                Write-Host "      1. Abra o arquivo: $configPath" -ForegroundColor White
                Write-Host "      2. Altere 'appId' de 'rotinas-ti-hpaes' para 'rotinas-ti-app'" -ForegroundColor White
                Write-Host "      3. Salve o arquivo" -ForegroundColor White
                Write-Host "      4. Reinicie o agente`n" -ForegroundColor White
            }
        }
        else {
            Write-Host "   ⚠️  appId desconhecido: '$appId'" -ForegroundColor Yellow
            Write-Host "   ℹ️  O appId correto deve ser: 'rotinas-ti-app'`n" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "   ❌ Erro ao ler config.json: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   ℹ️  Verifique se o arquivo está no formato JSON válido`n" -ForegroundColor Cyan
    }
}
else {
    Write-Host "   ❌ Arquivo config.json NÃO encontrado`n" -ForegroundColor Red
    
    if (Test-Path $examplePath) {
        Write-Host "   🔧 SOLUÇÃO:" -ForegroundColor Yellow
        Write-Host "      1. Copie o arquivo de exemplo:" -ForegroundColor White
        Write-Host "         Copy-Item config.example.json config.json`n" -ForegroundColor Cyan
        Write-Host "      2. Edite o config.json e configure:" -ForegroundColor White
        Write-Host "         - Credenciais do Firebase" -ForegroundColor White
        Write-Host "         - Nome do computador" -ForegroundColor White
        Write-Host "         - Localização" -ForegroundColor White
        Write-Host "         - Impressoras de rede (se houver)`n" -ForegroundColor White
        
        $resposta = Read-Host "   Deseja criar o config.json agora? (S/N)"
        
        if ($resposta -eq "S" -or $resposta -eq "s") {
            Copy-Item $examplePath $configPath
            Write-Host "`n   ✅ Arquivo config.json criado!" -ForegroundColor Green
            Write-Host "   ⚠️  ATENÇÃO: Configure as credenciais do Firebase antes de iniciar o agente" -ForegroundColor Yellow
            Write-Host "   📝 Edite o arquivo: $configPath`n" -ForegroundColor Cyan
        }
    }
    else {
        Write-Host "   ❌ Arquivo config.example.json também não encontrado!" -ForegroundColor Red
        Write-Host "   ℹ️  Verifique se você está no diretório correto do agente`n" -ForegroundColor Cyan
    }
}

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🏁 Verificação concluída`n" -ForegroundColor Cyan
