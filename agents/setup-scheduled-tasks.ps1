# Artika — Настройка автоматических агентов в Windows Task Scheduler
# Запускать ОДИН РАЗ от имени администратора:
# PowerShell -ExecutionPolicy Bypass -File setup-scheduled-tasks.ps1

$ArtikaPath = "C:\Users\harch\OneDrive\Рабочий стол\cloude\Artika"
$BashExe = "C:\Program Files\Git\bin\bash.exe"

# Проверить git bash
if (-not (Test-Path $BashExe)) {
    $BashExe = "bash.exe"  # если в PATH
}

# --- Задача 1: Утренний брифинг в 9:00 ---
$action1 = New-ScheduledTaskAction `
    -Execute $BashExe `
    -Argument "`"$ArtikaPath/agents/morning-briefing.sh`""
$trigger1 = New-ScheduledTaskTrigger -Daily -At "09:00"
$settings1 = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable

Register-ScheduledTask `
    -TaskName "Artika - Morning Briefing" `
    -Description "Утренний брифинг: статус задач, VK токен, системы" `
    -Action $action1 `
    -Trigger $trigger1 `
    -Settings $settings1 `
    -Force

Write-Host "✅ Утренний брифинг: каждый день в 09:00"

# --- Задача 2: VK Token Refresh каждые 23 часа ---
$action2 = New-ScheduledTaskAction `
    -Execute $BashExe `
    -Argument "`"$ArtikaPath/agents/vk-token-refresh.sh`""

# Первый запуск сейчас + повторение каждые 23 часа
$trigger2 = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(5) `
    -RepetitionInterval (New-TimeSpan -Hours 23) `
    -RepetitionDuration (New-TimeSpan -Days 3650)
$settings2 = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable

Register-ScheduledTask `
    -TaskName "Artika - VK Token Refresh" `
    -Description "Автообновление VK Ads токена каждые 23 часа" `
    -Action $action2 `
    -Trigger $trigger2 `
    -Settings $settings2 `
    -Force

Write-Host "✅ VK Token Refresh: каждые 23 часа"

# --- Задача 3: Еженедельный отчёт по пятницам в 18:00 ---
$action3 = New-ScheduledTaskAction `
    -Execute $BashExe `
    -Argument "`"$ArtikaPath/agents/weekly-report.sh`""
$trigger3 = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Friday -At "18:00"
$settings3 = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable

Register-ScheduledTask `
    -TaskName "Artika - Weekly Report" `
    -Description "Еженедельный отчёт по всем проектам Artika" `
    -Action $action3 `
    -Trigger $trigger3 `
    -Settings $settings3 `
    -Force

Write-Host "✅ Weekly Report: каждую пятницу в 18:00"

Write-Host ""
Write-Host "=== Все задачи зарегистрированы ==="
Write-Host "Проверить: Get-ScheduledTask | Where-Object {`$_.TaskName -like 'Artika*'}"
