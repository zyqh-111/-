$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$exeName = ([char]0x626B).ToString() + ([char]0x96F7).ToString() + '.exe'
$outputExe = Join-Path $projectRoot $exeName
$blobPath = Join-Path $projectRoot 'sea-prep.blob'
$configPath = Join-Path $projectRoot 'sea-config.json'
$nodeExe = (Get-Command node).Source

Push-Location $projectRoot
try {
  if (-not (Test-Path (Join-Path $projectRoot 'node_modules\postject'))) {
    npm install --no-save --no-package-lock postject@1.0.0-alpha.6
  }

  $config = @{
    main = (Join-Path $projectRoot 'launcher.js')
    output = $blobPath
    disableExperimentalSEAWarning = $true
    useSnapshot = $false
    useCodeCache = $false
    assets = @{
      'index.html' = (Join-Path $projectRoot 'app\index.html')
      'styles.css' = (Join-Path $projectRoot 'app\styles.css')
      'game.js' = (Join-Path $projectRoot 'app\game.js')
      'main.js' = (Join-Path $projectRoot 'app\main.js')
    }
  }
  $config | ConvertTo-Json -Depth 4 | Set-Content -Encoding utf8 $configPath

  node --experimental-sea-config $configPath
  Copy-Item $nodeExe $outputExe -Force
  npx postject $outputExe NODE_SEA_BLOB $blobPath --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
  if (-not (Test-Path $outputExe) -or (Get-Item $outputExe).Length -eq 0) {
    throw 'The executable was not created.'
  }
  Write-Host "Built $outputExe"
}
finally {
  Remove-Item $blobPath, $configPath -Force -ErrorAction SilentlyContinue
  Pop-Location
}
