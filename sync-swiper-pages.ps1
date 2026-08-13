$ErrorActionPreference = "Stop"

# =========================================================
# CONFIGURACION
# =========================================================

$ProjectRoot = "G:\digital-knight-v2\www"
$JsonFile = Join-Path $ProjectRoot "swiper-data.json"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "     SINCRONIZADOR DE SWIPERS" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# =========================================================
# COMPROBAR JSON
# =========================================================

if (-not (Test-Path $JsonFile)) {

    Write-Host "ERROR: No existe swiper-data.json" -ForegroundColor Red
    exit
}

Write-Host "OK: swiper-data.json encontrado" -ForegroundColor Green
Write-Host ""

# =========================================================
# LEER JSON
# =========================================================

try {

    $json = Get-Content $JsonFile -Raw -Encoding UTF8 |
        ConvertFrom-Json

}
catch {

    Write-Host "ERROR leyendo swiper-data.json" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit
}

# =========================================================
# CONTADORES
# =========================================================

$total = 0
$htmlEncontrados = 0
$htmlNoEncontrados = 0
$posterEncontrados = 0
$backdropEncontrados = 0
$logoEncontrados = 0

# =========================================================
# RECORRER CONJUNTOS
# =========================================================

foreach ($conjuntoProp in $json.PSObject.Properties) {

    $conjunto = $conjuntoProp.Value

    if ($null -eq $conjunto) {
        continue
    }

    Write-Host ""
    Write-Host "CONJUNTO: $($conjuntoProp.Name)" -ForegroundColor Cyan

    # =====================================================
    # RECORRER SECCIONES
    # =====================================================

    foreach ($seccionProp in $conjunto.PSObject.Properties) {

        $seccion = $seccionProp.Value

        if ($null -eq $seccion) {
            continue
        }

        Write-Host ""
        Write-Host "SECCION: $($seccionProp.Name)" -ForegroundColor Magenta

        # =================================================
        # RECORRER ITEMS
        # =================================================

        foreach ($item in $seccion) {

            if ([string]::IsNullOrWhiteSpace($item.archivo)) {
                continue
            }

            $total++

            $relativePath = $item.archivo -replace "/", "\"
            $htmlPath = Join-Path $ProjectRoot $relativePath

            Write-Host ""
            Write-Host "[$total] $($item.titulo)" -ForegroundColor White
            Write-Host "    Archivo: $relativePath" -ForegroundColor DarkGray

            # =================================================
            # COMPROBAR HTML
            # =================================================

            if (-not (Test-Path $htmlPath)) {

                Write-Host "    HTML NO ENCONTRADO" -ForegroundColor Red

                $htmlNoEncontrados++
                continue
            }

            $htmlEncontrados++

            # =================================================
            # LEER HTML
            # =================================================

            try {

                $html = Get-Content $htmlPath -Raw -Encoding UTF8

            }
            catch {

                Write-Host "    ERROR LEYENDO HTML" -ForegroundColor Red
                continue
            }

# =================================================
# POSTER
# =================================================

$poster = ""

$coverStart = $html.IndexOf(".cover {")

if ($coverStart -ge 0) {

    $coverEnd = $html.IndexOf("}", $coverStart)

    if ($coverEnd -gt $coverStart) {

        $coverBlock = $html.Substring(
            $coverStart,
            $coverEnd - $coverStart
        )

        # Buscar únicamente background dentro de .cover
        $urlMatch = [regex]::Match(
    $coverBlock,
    "background\s*:\s*(?:var\([^,]+,\s*)?url\(\s*['""]?([^'"")]+)"
)

        if ($urlMatch.Success) {
            $poster = $urlMatch.Groups[1].Value.Trim()
        }
    }
}

if ($poster) {

    Write-Host "    POSTER encontrado" -ForegroundColor Green

    $item.poster = $poster
    $posterEncontrados++
}
else {

    Write-Host "    POSTER no encontrado" -ForegroundColor Yellow
}


# =================================================
# BACKDROP
# =================================================

$backdrop = ""

$landStart = $html.IndexOf(".cover-landscape {")

if ($landStart -ge 0) {

    $landEnd = $html.IndexOf("}", $landStart)

    if ($landEnd -gt $landStart) {

        $landBlock = $html.Substring(
            $landStart,
            $landEnd - $landStart
        )

        # Buscar únicamente background dentro de .cover-landscape
        $urlMatch = [regex]::Match(
    $landBlock,
    "background\s*:\s*(?:var\([^,]+,\s*)?url\(\s*['""]?([^'"")]+)"
)

        if ($urlMatch.Success) {
            $backdrop = $urlMatch.Groups[1].Value.Trim()
        }
    }
}

if ($backdrop) {

    Write-Host "    BACKDROP encontrado" -ForegroundColor Green

    $item.backdrop = $backdrop
    $backdropEncontrados++
}
else {

    Write-Host "    BACKDROP no encontrado" -ForegroundColor Yellow
}


# =========================================================
# EXTRAER LOGO DESDE .cover-content
# =========================================================

$logo = ""

$logoMatch = [regex]::Match(
    $html,
    '(?is)<div[^>]*class\s*=\s*["''][^"'']*\bcover-content\b[^"'']*["''][^>]*>.*?<img\b[^>]*\bclass\s*=\s*["''][^"'']*\blogo\b[^"'']*["''][^"'']*["''][^>]*\bsrc\s*=\s*["'']([^"'']+)["'']'
)

if ($logoMatch.Success) {

    $logo = $logoMatch.Groups[1].Value.Trim()
}
else {

    # Segundo intento:
    # permite que src aparezca antes que class
    $logoMatch = [regex]::Match(
        $html,
        '(?is)<div[^>]*class\s*=\s*["''][^"'']*\bcover-content\b[^"'']*["''][^>]*>.*?<img\b[^>]*\bsrc\s*=\s*["'']([^"'']+)["''][^>]*\bclass\s*=\s*["''][^"'']*\blogo\b[^"'']*["'']'
    )

    if ($logoMatch.Success) {

        $logo = $logoMatch.Groups[1].Value.Trim()
    }
}


if ($logo) {

    Write-Host "    LOGO encontrado" -ForegroundColor Green

    $item.logo = $logo
    $logoEncontrados++
}
else {

    Write-Host "    LOGO no encontrado" -ForegroundColor Yellow
}


        }
    }
}

# =========================================================
# GUARDAR JSON
# =========================================================

Write-Host ""
Write-Host "Guardando swiper-data.json..." -ForegroundColor Cyan

try {

    $jsonFinal = $json | ConvertTo-Json -Depth 50

    [System.IO.File]::WriteAllText(
        $JsonFile,
        $jsonFinal,
        [System.Text.UTF8Encoding]::new($false)
    )

}
catch {

    Write-Host "ERROR guardando el JSON" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit
}

# =========================================================
# RESUMEN
# =========================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "              RESULTADO" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Elementos procesados : $total"
Write-Host "HTML encontrados     : $htmlEncontrados" -ForegroundColor Green
Write-Host "HTML no encontrados  : $htmlNoEncontrados" -ForegroundColor Red
Write-Host ""
Write-Host "Posters encontrados  : $posterEncontrados" -ForegroundColor Green
Write-Host "Backdrops encontrados: $backdropEncontrados" -ForegroundColor Green
Write-Host "Logos encontrados    : $logoEncontrados" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "      SINCRONIZACION TERMINADA" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""