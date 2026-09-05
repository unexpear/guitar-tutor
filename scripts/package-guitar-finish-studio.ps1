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
Copy-Item -LiteralPath (Join-Path $sourceDirectory 'review.js') -Destination $stagingDirectory
Copy-Item -LiteralPath (Join-Path $sourceDirectory 'workspace.js') -Destination $stagingDirectory
Copy-Item -LiteralPath (Join-Path $sourceDirectory 'mesh-studio.bundle.js') -Destination $stagingDirectory
Copy-Item -LiteralPath (Join-Path $sourceDirectory 'mesh-studio.js') -Destination $stagingDirectory
foreach ($sourceFile in @('package.json', 'package-lock.json', 'mesh-studio.test.mjs', 'validate-glb.mjs', 'build-portable.mjs')) {
  Copy-Item -LiteralPath (Join-Path $sourceDirectory $sourceFile) -Destination $stagingDirectory
}
Copy-Item -LiteralPath (Join-Path $sourceDirectory 'THREE-LICENSE.txt') -Destination $stagingDirectory
Copy-Item -LiteralPath (Join-Path $sourceDirectory 'README.md') -Destination $stagingDirectory
Copy-Item -LiteralPath (Join-Path $sourceDirectory 'sources') -Destination $stagingDirectory -Recurse
node (Join-Path $sourceDirectory 'build-portable.mjs') (Join-Path $stagingDirectory 'Guitar-Finish-Studio-Offline.html')
if ($LASTEXITCODE -ne 0) { throw 'Portable HTML build failed.' }

Compress-Archive -Path (Join-Path $stagingDirectory '*') -DestinationPath $archivePath -CompressionLevel Optimal -Force
# Windows PowerShell can emit backslashes. Web hosts require portable ZIP paths.
Add-Type -AssemblyName System.IO.Compression.FileSystem
$studioZip = [IO.Compression.ZipFile]::Open($archivePath, [IO.Compression.ZipArchiveMode]::Update)
try {
  foreach ($entry in @($studioZip.Entries)) {
    if (-not $entry.FullName.Contains('\')) { continue }
    $portableName = $entry.FullName.Replace('\', '/')
    $buffer = New-Object IO.MemoryStream
    $inputStream = $entry.Open()
    try { $inputStream.CopyTo($buffer) } finally { $inputStream.Dispose() }
    $entry.Delete()
    $replacement = $studioZip.CreateEntry($portableName, [IO.Compression.CompressionLevel]::Optimal)
    $outputStream = $replacement.Open()
    try { $buffer.Position = 0; $buffer.CopyTo($outputStream) }
    finally { $outputStream.Dispose(); $buffer.Dispose() }
  }
} finally { $studioZip.Dispose() }
Write-Host "Created itch.io package: $archivePath"
