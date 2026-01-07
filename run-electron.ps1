Write-Host "Starting PassWorld Electron Application..." -ForegroundColor Green

# 尝试找到Node.js安装路径
$nodePaths = @(
    "C:\Program Files\nodejs\",
    "C:\Program Files (x86)\nodejs\",
    "$env:USERPROFILE\AppData\Local\nvs\nodejs\",
    "$env:LOCALAPPDATA\nvs\nodejs\"
)

$nodeFound = $false
foreach ($path in $nodePaths) {
    if (Test-Path $path) {
        $env:PATH += ";$path"
        Write-Host "Added $path to PATH" -ForegroundColor Yellow
        $nodeFound = $true
        break
    }
}

if (-not $nodeFound) {
    Write-Host "Node.js installation path not found in common locations." -ForegroundColor Red
    Write-Host "Please ensure Node.js is installed and PATH is configured correctly." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# 检查node和npm是否可用
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = $(node --version 2>$null)
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Node.js is not found in your system PATH." -ForegroundColor Red
    Write-Host "Please ensure Node.js is installed and added to your PATH." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
} else {
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
}

$npmVersion = $(npm --version 2>$null)
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm is not found in your system PATH." -ForegroundColor Red
    Write-Host "Please ensure Node.js is installed and added to your PATH." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
} else {
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
}

# 检查Electron是否已安装
if (!(Test-Path "node_modules\electron")) {
    Write-Host "Installing Electron..." -ForegroundColor Yellow
    npm install electron@^28.2.0 --save-dev --ignore-scripts
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install Electron." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# 运行Electron应用
Write-Host "Running PassWorld..." -ForegroundColor Green
npx electron .