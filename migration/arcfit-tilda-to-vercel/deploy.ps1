# deploy.ps1 — автоматизация Vercel-операций для миграции arcfit.ru
#
# Использование:
#   .\deploy.ps1 status                 # текущий статус: домены, env vars, последний деплой
#   .\deploy.ps1 set-env                # залить env vars из .env.production.example в Vercel
#   .\deploy.ps1 add-domain             # добавить arcfit.ru + www.arcfit.ru в Vercel (через API)
#   .\deploy.ps1 verify-domain          # проверить статус верификации
#   .\deploy.ps1 redeploy               # триггернуть production rebuild (пустой commit + push)
#   .\deploy.ps1 prod-check             # curl-проверка прода (titles, schemas, /api/lead)
#
# Требует:
#   - .\..\..\$env:USERPROFILE\.claude\secrets\vercel.env (VERCEL_TOKEN, VERCEL_TEAM_ID, VERCEL_PROJECT_ID_ARCFIT_NEXT)
#   - git настроенный с правом push в main
#   - PowerShell 5.1+

[CmdletBinding()]
param(
    [Parameter(Position=0)]
    [ValidateSet('status', 'set-env', 'add-domain', 'verify-domain', 'redeploy', 'prod-check')]
    [string]$Action = 'status'
)

# ---------- Загрузка credentials ----------
$secretsFile = Join-Path $env:USERPROFILE ".claude\secrets\vercel.env"
if (-not (Test-Path $secretsFile)) {
    Write-Error "Не найден $secretsFile с VERCEL_TOKEN. Создать токен: https://vercel.com/account/tokens"
    exit 1
}

$envVars = @{}
Get-Content $secretsFile | ForEach-Object {
    if ($_ -match '^([A-Z_]+)=(.+)$') {
        $envVars[$matches[1]] = $matches[2].Trim('"')
    }
}

$VERCEL_TOKEN = $envVars['VERCEL_TOKEN']
$TEAM_ID = $envVars['VERCEL_TEAM_ID']
$PROJECT_ID = $envVars['VERCEL_PROJECT_ID_ARCFIT_NEXT']

if (-not $VERCEL_TOKEN -or -not $TEAM_ID -or -not $PROJECT_ID) {
    Write-Error "Не хватает VERCEL_TOKEN/VERCEL_TEAM_ID/VERCEL_PROJECT_ID_ARCFIT_NEXT в $secretsFile"
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $VERCEL_TOKEN"
    "Content-Type"  = "application/json"
}

$base = "https://api.vercel.com"

# ---------- Helpers ----------
function Invoke-VercelApi {
    param($Method, $Path, $Body = $null)
    $url = "$base$Path"
    if ($url -notlike "*teamId=*") {
        $url += if ($url -like "*?*") { "&teamId=$TEAM_ID" } else { "?teamId=$TEAM_ID" }
    }
    $args = @{
        Uri     = $url
        Headers = $headers
        Method  = $Method
    }
    if ($Body) {
        $args.Body = ($Body | ConvertTo-Json -Compress -Depth 5)
    }
    Invoke-RestMethod @args
}

# ---------- Actions ----------
switch ($Action) {
    'status' {
        Write-Host "=== arcfit-next status ===" -ForegroundColor Cyan
        $project = Invoke-VercelApi GET "/v9/projects/$PROJECT_ID"
        Write-Host "rootDirectory: $($project.rootDirectory)"
        Write-Host "framework:     $($project.framework)"
        Write-Host "live:          $($project.live)"

        Write-Host "`n=== Domains ===" -ForegroundColor Cyan
        $domains = Invoke-VercelApi GET "/v9/projects/$PROJECT_ID/domains"
        $domains.domains | ForEach-Object { Write-Host "  $($_.name) → verified=$($_.verified)" }

        Write-Host "`n=== Latest deployments ===" -ForegroundColor Cyan
        $deps = Invoke-VercelApi GET "/v6/deployments?projectId=$PROJECT_ID&limit=5"
        $deps.deployments | ForEach-Object {
            Write-Host ("  {0} {1,-7} {2}" -f $_.uid.Substring(0,12), $_.state, $_.meta.githubCommitSha.Substring(0,7))
        }

        Write-Host "`n=== Env vars ===" -ForegroundColor Cyan
        $envs = Invoke-VercelApi GET "/v10/projects/$PROJECT_ID/env"
        $envs.envs | ForEach-Object { Write-Host "  $($_.key) [$($_.target -join ',')] $($_.type)" }
    }

    'set-env' {
        $envFile = Join-Path $PSScriptRoot ".env.production.example"
        if (-not (Test-Path $envFile)) { Write-Error "Нет $envFile"; exit 1 }
        Write-Host "Заливаю env из $envFile в Vercel..." -ForegroundColor Cyan
        Get-Content $envFile | ForEach-Object {
            $line = $_.Trim()
            if ($line -match '^([A-Z_]+[A-Z0-9_]*)=(.+)$') {
                $key = $matches[1]
                $value = $matches[2]
                if ($key -in @('VERCEL_TOKEN','VERCEL_TEAM_ID','VERCEL_PROJECT_ID_ARCFIT_NEXT')) {
                    Write-Host "  skip $key (служебный)" -ForegroundColor Yellow
                    return
                }
                $type = if ($key -like 'NEXT_PUBLIC_*') { 'plain' } else { 'encrypted' }
                $body = @{
                    key = $key; value = $value; type = $type; target = @('production')
                }
                try {
                    Invoke-VercelApi POST "/v10/projects/$PROJECT_ID/env" $body | Out-Null
                    Write-Host "  ✓ $key" -ForegroundColor Green
                } catch {
                    Write-Host "  ! $key — возможно уже существует ($($_.Exception.Message.Substring(0, [Math]::Min(60, $_.Exception.Message.Length))))" -ForegroundColor Yellow
                }
            }
        }
    }

    'add-domain' {
        Write-Host "Добавляю arcfit.ru в Vercel..." -ForegroundColor Cyan
        try {
            $resp = Invoke-VercelApi POST "/v10/projects/$PROJECT_ID/domains" @{ name = "arcfit.ru" }
            Write-Host "  ✓ arcfit.ru добавлен" -ForegroundColor Green
            if ($resp.verification) {
                Write-Host "`n  Прописать в nic.ru DNS:" -ForegroundColor Yellow
                $resp.verification | ForEach-Object {
                    Write-Host "    Тип:    $($_.type)"
                    Write-Host "    Имя:    $($_.domain)"
                    Write-Host "    Знач.:  $($_.value)"
                    Write-Host ""
                }
            }
        } catch {
            Write-Host "  ! $($_.Exception.Message)" -ForegroundColor Yellow
        }

        Write-Host "Добавляю www.arcfit.ru с редиректом..." -ForegroundColor Cyan
        try {
            Invoke-VercelApi POST "/v10/projects/$PROJECT_ID/domains" @{
                name = "www.arcfit.ru"; redirect = "arcfit.ru"
            } | Out-Null
            Write-Host "  ✓ www.arcfit.ru → arcfit.ru" -ForegroundColor Green
        } catch {
            Write-Host "  ! $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }

    'verify-domain' {
        Write-Host "Проверяю верификацию arcfit.ru..." -ForegroundColor Cyan
        $domain = Invoke-VercelApi GET "/v9/projects/$PROJECT_ID/domains/arcfit.ru"
        Write-Host "  verified: $($domain.verified)"
        if (-not $domain.verified) {
            Write-Host "  Прописать TXT-запись (см. add-domain) и повторить через 1-5 мин" -ForegroundColor Yellow
        }
    }

    'redeploy' {
        Write-Host "Триггерю rebuild через пустой commit..." -ForegroundColor Cyan
        & git commit --allow-empty -m "trigger: arcfit-next rebuild"
        & git push origin HEAD:main
        Write-Host "Пушнул. Vercel начнёт build через ~5-10 сек." -ForegroundColor Green
    }

    'prod-check' {
        Write-Host "=== Проверка прода ===" -ForegroundColor Cyan
        $url = "https://arcfit-next.vercel.app"
        Write-Host "URL: $url"
        Write-Host ""
        $pages = '/', '/schedule', '/pricing', '/programs', '/facilities', '/trainers', '/contacts'
        foreach ($p in $pages) {
            $resp = Invoke-WebRequest "$url$p`?v=$([DateTimeOffset]::Now.ToUnixTimeSeconds())" -UseBasicParsing
            $title = if ($resp.Content -match '<title>([^<]+)</title>') { $matches[1] } else { '???' }
            Write-Host ("  {0,-15} {1}" -f $p, $title.Substring(0, [Math]::Min(85, $title.Length)))
        }
        Write-Host ""
        Write-Host "Метрика 95693874 в HTML:" -NoNewline
        $home = Invoke-WebRequest "$url/" -UseBasicParsing
        Write-Host (if ($home.Content -match 'ym\(95693874') { ' ✓' } else { ' ✗' })

        Write-Host "Лид-форма (/api/lead):" -NoNewline
        try {
            $body = @{ name='_PROD_CHECK_'; phone='+79000000000' } | ConvertTo-Json
            $r = Invoke-RestMethod "$url/api/lead" -Method POST -Body $body -ContentType 'application/json'
            Write-Host (if ($r.success) { ' ✓ tranid=' + $r.tranid } else { ' ✗ ' + ($r | ConvertTo-Json -Compress) })
        } catch {
            Write-Host " ✗ $($_.Exception.Message)"
        }
    }
}
