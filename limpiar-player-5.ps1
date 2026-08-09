$ErrorActionPreference = "Stop"

# =========================================================
# CONFIGURACIÓN
# =========================================================

$root = "G:\digital-knight-v2\www"

# Cantidad máxima de páginas a modificar en esta prueba
$maxPaginas = 5

# Crear respaldo
$fecha = Get-Date -Format "yyyyMMdd_HHmmss"
$backupRoot = "G:\digital-knight-v2\backup-player-$fecha"

New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   LIMPIEZA PLAYER-PELICULAS - PRUEBA"
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Carpeta: $root"
Write-Host "Backup : $backupRoot"
Write-Host ""

# =========================================================
# BUSCAR HTML
# =========================================================

$paginas = Get-ChildItem -Path $root -Filter "*.html" -Recurse |
    Where-Object {
        $_.FullName -notlike "*\backup-player-*"
    }

Write-Host "Páginas HTML encontradas: $($paginas.Count)" -ForegroundColor Yellow
Write-Host ""

$modificadas = 0
$omitidas = 0

foreach ($archivo in $paginas) {

    if ($modificadas -ge $maxPaginas) {
        break
    }

    Write-Host "---------------------------------------------"
    Write-Host "Revisando: $($archivo.FullName)" -ForegroundColor Gray

    $contenido = Get-Content -LiteralPath $archivo.FullName -Raw -Encoding UTF8

    # =====================================================
    # BUSCAR EL SCRIPT QUE CONTIENE EL PLAYER DUPLICADO
    # =====================================================

    $patronScript = '(?is)<script\b[^>]*>(.*?)</script\s*>'

    $scripts = [regex]::Matches($contenido, $patronScript)

    $scriptEncontrado = $false
    $nuevoContenido = $contenido

    foreach ($script in $scripts) {

        $scriptCompleto = $script.Value
        $codigo = $script.Groups[1].Value

        # -------------------------------------------------
        # Patrón característico del player-peliculas
        # -------------------------------------------------

        $tieneVideoElement =
            $codigo -match "const\s+videoElement\s*=\s*document\.getElementById\s*\(\s*['""]video['""]\s*\)"

        $tieneShowPlayer =
            $codigo -match "function\s+showPlayer\s*\("

        $tieneEnterFullscreen =
            $codigo -match "function\s+enterFullscreen\s*\("

        $tieneMovieProgress =
            $codigo -match "function\s+updateMovieProgress\s*\("

        # Necesitamos varias señales para evitar tocar
        # scripts que no sean realmente el reproductor.
        if (
            $tieneVideoElement -and
            $tieneShowPlayer -and
            $tieneEnterFullscreen -and
            $tieneMovieProgress
        ) {

            Write-Host "  [OK] Encontrado script del reproductor" -ForegroundColor Green

            # =================================================
            # CONSERVAR movieId
            # =================================================

            $movieIdMatch = [regex]::Match(
                $codigo,
                'window\.movieId\s*=\s*["'']([^"'']+)["'']\s*;'
            )

            if (-not $movieIdMatch.Success) {

                Write-Host "  [OMITIDO] No se encontró window.movieId" -ForegroundColor Red
                $omitidas++
                continue
            }

            $movieId = $movieIdMatch.Groups[1].Value

            # =================================================
            # CONSERVAR BLOQUE DE IDIOMAS
            #
            # Si existe un bloque /* ... */ que contenga
            # videos / langOptions / currentLang, lo conservamos.
            # =================================================

            $bloqueIdioma = ""

            $comentarios = [regex]::Matches(
                $codigo,
                '(?is)/\*.*?\*/'
            )

            foreach ($comentario in $comentarios) {

                $textoComentario = $comentario.Value

                if (
                    $textoComentario -match "langOptions" -and
                    $textoComentario -match "currentLang" -and
                    $textoComentario -match "videos\s*="
                ) {

                    $bloqueIdioma = $textoComentario

                    Write-Host "  [OK] Bloque de idiomas conservado" -ForegroundColor Green
                    break
                }
            }

            # =================================================
            # CREAR SCRIPT LIMPIO
            # =================================================

            $scriptLimpio = @"
<script>

window.movieId = "$movieId";

$bloqueIdioma

</script>
"@

            # =================================================
            # REEMPLAZAR SOLO EL SCRIPT DEL PLAYER
            # =================================================

            $nuevoContenido = $nuevoContenido.Replace(
                $scriptCompleto,
                $scriptLimpio
            )

            $scriptEncontrado = $true

            break
        }
    }

    if (-not $scriptEncontrado) {

        Write-Host "  [SIN CAMBIOS] No se encontró patrón seguro del player" -ForegroundColor DarkYellow
        $omitidas++
        continue
    }

    # =====================================================
    # BACKUP DEL ARCHIVO ORIGINAL
    # =====================================================

    $rutaRelativa = $archivo.FullName.Substring($root.Length).TrimStart('\')

    $rutaBackup = Join-Path $backupRoot $rutaRelativa
    $directorioBackup = Split-Path $rutaBackup -Parent

    New-Item -ItemType Directory -Path $directorioBackup -Force | Out-Null

    Copy-Item `
        -LiteralPath $archivo.FullName `
        -Destination $rutaBackup `
        -Force

    # =====================================================
    # ASEGURAR player-peliculas.js
    # =====================================================

    if ($nuevoContenido -notmatch 'player-peliculas\.js') {

        Write-Host "  [OMITIDO] No tiene player-peliculas.js" -ForegroundColor Red
        $omitidas++
        continue
    }

    # =====================================================
    # GUARDAR
    # =====================================================

    Set-Content `
        -LiteralPath $archivo.FullName `
        -Value $nuevoContenido `
        -Encoding UTF8

    $modificadas++

    Write-Host "  [MODIFICADA] $($archivo.Name)" -ForegroundColor Cyan
}

# =========================================================
# RESULTADO
# =========================================================

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "               RESULTADO"
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Modificadas : $modificadas" -ForegroundColor Green
Write-Host "Omitidas    : $omitidas" -ForegroundColor Yellow
Write-Host ""
Write-Host "Backup creado en:" -ForegroundColor Cyan
Write-Host $backupRoot
Write-Host ""

if ($modificadas -eq 0) {

    Write-Host "NO se modificó ninguna página." -ForegroundColor Red

} elseif ($modificadas -lt $maxPaginas) {

    Write-Host "Se modificaron menos de 5 porque las demás no coincidieron con el patrón seguro." -ForegroundColor Yellow

} else {

    Write-Host "PRUEBA DE 5 PÁGINAS COMPLETADA." -ForegroundColor Green
}

Write-Host ""