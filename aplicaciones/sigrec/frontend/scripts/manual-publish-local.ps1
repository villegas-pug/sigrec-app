$ErrorActionPreference = 'Stop'
$repositoryDir = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../../..'))
$manifestPath = Join-Path $repositoryDir 'artifacts/manual-usuario/clean/manifest.json'
$manualDeadline = (Get-Date).AddMinutes(70)
do {
    $manualParts = @(Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json)
    if ($manualParts | Where-Object { $_.failure }) { throw 'La grabación necesita corrección antes de publicar los medios.' }
    if ($manualParts.Count -eq 21) { break }
    if ((Get-Date) -gt $manualDeadline) { throw 'La grabación no terminó dentro del plazo de producción.' }
    Start-Sleep -Seconds 5
} while ($true)
node (Join-Path $PSScriptRoot 'manual-finalize.mjs') prepare
if ($LASTEXITCODE -ne 0) { throw 'No se pudo preparar la narración.' }
& (Join-Path $PSScriptRoot 'manual-narrate.ps1')
# Evita que la codificación anticipada y la final escriban la misma toma simultáneamente.
while (Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -like '*manual-finalize.mjs*--partial*' }) {
    Start-Sleep -Seconds 5
}
node (Join-Path $PSScriptRoot 'manual-finalize.mjs')
if ($LASTEXITCODE -ne 0) { throw 'No se pudieron codificar las tomas.' }
node (Join-Path $PSScriptRoot 'manual-media.mjs') clean
if ($LASTEXITCODE -ne 0) { throw 'No se pudieron ensamblar los capítulos.' }
