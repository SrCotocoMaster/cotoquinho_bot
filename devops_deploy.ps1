<#
.SYNOPSIS
    Script do Agente D (DevOps) para deploy local do Cotoquinho.
.DESCRIPTION
    Executa o build e deploy dos containers usando docker-compose.
    Este script garante que as alterações locais sejam refletidas no ambiente Docker.
#>

Write-Host "[AGENTE D] Iniciando protocolo de deploy..." -ForegroundColor Cyan

# Verifica se estamos na pasta correta (app)
if (!(Test-Path "docker-compose.yml")) {
    Write-Host "Erro: docker-compose.yml nao encontrado. Execute este script dentro da pasta 'app'." -ForegroundColor Red
    exit 1
}

Write-Host "[AGENTE D] Derrubando containers, volumes e limpando imagens (DEEP CLEAN)..." -ForegroundColor Yellow
docker-compose down -v
docker image rm app-server app-web -f

Write-Host "[AGENTE D] Construindo (NO-CACHE)..." -ForegroundColor Green
docker-compose build --no-cache

Write-Host "[AGENTE D] Subindo containers..." -ForegroundColor Green
docker-compose up -d --force-recreate

if ($LASTEXITCODE -eq 0) {
    Write-Host "[AGENTE D] Sistema operacional! Cotoquinho esta online." -ForegroundColor Green
    Write-Host "Dashboard: http://localhost" -ForegroundColor Gray
    Write-Host "API Health: http://localhost:3000/health" -ForegroundColor Gray
}
else {
    Write-Host "[AGENTE D] Falha no deploy. Verifique os logs acima." -ForegroundColor Red
}

Write-Host "[AGENTE D] Limpando imagens inuteis (dangling)..." -ForegroundColor Gray
docker image prune -f
