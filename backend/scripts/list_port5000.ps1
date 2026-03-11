$lines = netstat -ano | findstr ':5000'
if (-not $lines) {
    Write-Host 'No process is listening on port 5000'
} else {
    $pids = $lines | ForEach-Object { ($_ -replace '.*\s([0-9]+)$','$1') } | Select-Object -Unique
    Write-Host ('Found PIDs: ' + ($pids -join ', '))
    foreach ($thepid in $pids) {
        Write-Host ('---- PID ' + $thepid + ' ----')
        tasklist /FI "PID eq $thepid"
    }
}
