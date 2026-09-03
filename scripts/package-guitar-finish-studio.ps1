$ErrorActionPreference = 'Stop'

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$sourceDirectory = Join-Path $repositoryRoot 'tools\guitar-finish-studio'
$outputRoot = Join-Path $repositoryRoot 'dist-itch'
$stagingDirectory = Join-Path $outputRoot 'guitar-finish-studio'
$archivePath = Join-Path $outputRoot 'guitar-finish-studio.zip'

if (-not (Test-Path -LiteralPath (Join-Path $sourceDirectory 'index.html') -PathType Leaf)) {
  throw 'Guitar Finish Studio index.html is missing.'
}

New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null
if (Test-Path -LiteralPath $stagingDirectory) {
  Remove-Item -LiteralPath $stagingDirectory -Recurse -Force
}
New-Item -ItemType Directory -Path $stagingDirectory | Out-Null
Copy-Item -LiteralPath (Join-Path $sourceDirectory 'index.html') -Destination $stagingDirectory
Copy-Item -LiteralPath (Join-Path $sourceDirectory 'styles.css') -Destination $stagingDirectory
Copy-Item -LiteralPath (Join-Path $sourceDirectory 'app.js') -Destination $stagingDirectory
Copy-Item -LiteralPath (Join-Path $sourceDirectory 'README.md') -Destination $stagingDirectory

Compress-Archive -Path (Join-Path $stagingDirectory '*') -DestinationPath $archivePath -CompressionLevel Optimal -Force
Write-Host "Created itch.io package: $archivePath"
