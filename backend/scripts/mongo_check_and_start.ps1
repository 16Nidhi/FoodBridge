$svc = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
if ($svc) { Write-Output "SERVICE_PRESENT:$($svc.Status)" } else { Write-Output "SERVICE_PRESENT:NotFound" }
$m = Get-ChildItem 'C:\Program Files\MongoDB\Server' -Recurse -Filter mongod.exe -ErrorAction SilentlyContinue | Select-Object -First 1
if ($m) { Write-Output "MONGOD_PATH:$($m.FullName)" } else { Write-Output "MONGOD_PATH:NotFound" }
if (Get-Process -Name mongod -ErrorAction SilentlyContinue) { Write-Output "MONGOD_RUNNING:true" } else { Write-Output "MONGOD_RUNNING:false" }
if (-not (Test-Path 'C:\data\db')) { New-Item -ItemType Directory -Path 'C:\data\db' | Out-Null; Write-Output 'CREATED_DATA_DIR' } else { Write-Output 'DATA_DIR_EXISTS' }
if ($m -and -not (Get-Process -Name mongod -ErrorAction SilentlyContinue)) { Start-Process -FilePath $m.FullName -ArgumentList '--dbpath','C:\data\db' -WindowStyle Hidden; Start-Sleep -Seconds 2; Write-Output 'STARTED_MONGOD' } else { Write-Output 'SKIPPED_START' }
netstat -ano | findstr ':27017' | ForEach-Object { Write-Output "NETSTAT: $_" }
if (-not (netstat -ano | findstr ':27017')) { Write-Output 'NO_PORT_27017' }
Get-Process -Name mongod -ErrorAction SilentlyContinue | ForEach-Object { Write-Output "PROCESS: $($_.Id) $($_.Name)" }
