
# Script de Gestión de Backups y Versionado - Creser Finance

function Create-Backup([string]$version, [string]$type) {
    $backupRoot = "backups"
    $targetDir = ""
    
    if ($type -eq "full") {
        $targetDir = "$backupRoot\releases\$($version)_full"
    } else {
        $targetDir = "$backupRoot\current_cycle\$($version)_$type"
    }

    Write-Host "Iniciando backup $($version) ($($type))..."
    
    if (Test-Path $targetDir) {
        Write-Warning "La version $($version) ya existe. Abortando."
        return
    }

    New-Item -ItemType Directory -Path $targetDir -Force

    # Excluir carpetas pesadas
    $exclude = @("node_modules", ".next", ".git", "backups", "dist", "build", "Demo_Nube")
    
    $items = Get-ChildItem -Path "." -Exclude $exclude
    foreach ($item in $items) {
        Copy-Item -Path $item.FullName -Destination $targetDir -Recurse -Force
    }

    # Crear manifiesto
    $manifest = @{
        version = $version
        date = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        type = $type
        files = (Get-ChildItem -Path $targetDir -Recurse | Select-Object -ExpandProperty Name)
    }
    $manifest | ConvertTo-Json | Out-File "$backupRoot\manifests\$($version)_manifest.json"

    Write-Host "Backup completado en $targetDir"
}

# Comandos:
# ./backup_manager.ps1 init -> V1.0.0 Full
# ./backup_manager.ps1 delta V1.1.0 -> V1.1.0 Delta

$command = $args[0]
if ($command -eq "init") {
    Create-Backup "V1.0.0" "full"
} elseif ($command -eq "full") {
    Create-Backup $args[1] "full"
} elseif ($command -eq "delta") {
    Create-Backup $args[1] "delta"
}
