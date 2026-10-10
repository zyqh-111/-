$ErrorActionPreference = 'Stop'

function Assert-NativeSuccess([string]$Stage) {
  if ($LASTEXITCODE -ne 0) { throw "$Stage failed with exit code $LASTEXITCODE." }
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$exeName = ([char]0x626B).ToString() + ([char]0x96F7).ToString() + '.exe'
$outputExe = Join-Path $projectRoot $exeName
$candidateExe = Join-Path $projectRoot 'minesweeper-candidate.exe'
$blobPath = Join-Path $projectRoot 'sea-prep.blob'
$configPath = Join-Path $projectRoot 'sea-config.json'
$stdoutPath = Join-Path $projectRoot 'healthcheck.stdout.txt'
$stderrPath = Join-Path $projectRoot 'healthcheck.stderr.txt'
$nodeExe = (Get-Command node -ErrorAction Stop).Source
$nodeMajor = [int]((node --version).TrimStart('v').Split('.')[0])
Assert-NativeSuccess 'Node version check'
if ($nodeMajor -ne 24) { throw "Node.js 24 is required; found major version $nodeMajor." }

Push-Location $projectRoot
try {
  npm ci
  Assert-NativeSuccess 'Dependency installation'
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
      'timer.js' = (Join-Path $projectRoot 'app\timer.js')
      'main.js' = (Join-Path $projectRoot 'app\main.js')
    }
  }
  $config | ConvertTo-Json -Depth 4 | Set-Content -Encoding utf8 $configPath
  node --experimental-sea-config $configPath
  Assert-NativeSuccess 'SEA blob generation'
  Copy-Item $nodeExe $candidateExe -Force
  npx --no-install postject $candidateExe NODE_SEA_BLOB $blobPath --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
  Assert-NativeSuccess 'SEA injection'

  Remove-Item $stdoutPath, $stderrPath -Force -ErrorAction SilentlyContinue
  $env:MINESWEEPER_NO_BROWSER = '1'
  $env:MINESWEEPER_HEALTHCHECK = '1'
  $process = Start-Process -FilePath $candidateExe -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath
  try {
    $url = $null
    for ($attempt = 0; $attempt -lt 40 -and -not $url; $attempt++) {
      Start-Sleep -Milliseconds 200
      if (Test-Path $stdoutPath) {
        $line = Get-Content $stdoutPath -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($line -match '^MINESWEEPER_URL=(.+)$') { $url = $Matches[1] }
      }
    }
    if (-not $url) { throw "Candidate did not start: $(Get-Content $stderrPath -Raw -ErrorAction SilentlyContinue)" }
    foreach ($asset in '/', '/styles.css', '/game.js', '/timer.js', '/main.js') {
      $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 5 -Uri ($url.TrimEnd('/') + $asset)
      if ($response.StatusCode -ne 200) { throw "Health check failed for $asset." }
    }
  }
  finally {
    if ($process -and -not $process.HasExited) { Stop-Process -Id $process.Id -Force }
  }
  Move-Item $candidateExe $outputExe -Force
  Write-Host "Built and verified $outputExe"
}
finally {
  Remove-Item Env:MINESWEEPER_NO_BROWSER, Env:MINESWEEPER_HEALTHCHECK -ErrorAction SilentlyContinue
  Remove-Item $candidateExe, $blobPath, $configPath, $stdoutPath, $stderrPath -Force -ErrorAction SilentlyContinue
  Pop-Location
}
