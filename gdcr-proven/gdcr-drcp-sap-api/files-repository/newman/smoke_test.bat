# DDCR - Smoke Test - Sales + Finances
# Coloque este script na mesma pasta dos JSONs das collections

$salesCollection    = "$PSScriptRoot\collection_sales.json"
$financesCollection = "$PSScriptRoot\collection_finances.json"

# Verifica se newman esta instalado
if (-not (Get-Command newman -ErrorAction SilentlyContinue)) {
    Write-Host "Newman nao encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g newman
}

$totalFailed = 0

# ── SALES ──────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SMOKE TEST - SALES (13 rotas)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$salesResult = newman run $salesCollection `
    --reporters cli `
    --delay-request 300 2>&1

$salesResult | Write-Host

$salesFailed = ($salesResult | Select-String "AssertionError|failed").Count
$totalFailed += $salesFailed

if ($salesFailed -eq 0) {
    Write-Host "[SALES] Todas as rotas passaram!" -ForegroundColor Green
} else {
    Write-Host "[SALES] $salesFailed assertion(s) falharam!" -ForegroundColor Red
}

# ── FINANCES ───────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  SMOKE TEST - FINANCES (10 rotas)" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

$financesResult = newman run $financesCollection `
    --reporters cli `
    --delay-request 300 2>&1

$financesResult | Write-Host

$financesFailed = ($financesResult | Select-String "AssertionError|failed").Count
$totalFailed += $financesFailed

if ($financesFailed -eq 0) {
    Write-Host "[FINANCES] Todas as rotas passaram!" -ForegroundColor Green
} else {
    Write-Host "[FINANCES] $financesFailed assertion(s) falharam!" -ForegroundColor Red
}

# ── RESULTADO FINAL ────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor White
if ($totalFailed -eq 0) {
    Write-Host "  SMOKE TEST PASSOU - 23/23 rotas OK" -ForegroundColor Green
    Write-Host "  Pronto para rodar a carga de 200k!" -ForegroundColor Green
} else {
    Write-Host "  SMOKE TEST FALHOU - $totalFailed falha(s) encontrada(s)" -ForegroundColor Red
    Write-Host "  Corrija os erros antes de rodar a carga!" -ForegroundColor Red
}
Write-Host "========================================" -ForegroundColor White
