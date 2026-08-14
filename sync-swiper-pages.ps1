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

if (-not (Test-Path -LiteralPath $JsonFile)) {

    Write-Host "ERROR: No existe swiper-data.json" -ForegroundColor Red
    exit
}

Write-Host "OK: swiper-data.json encontrado" -ForegroundColor Green
Write-Host ""

# =========================================================
# LEER JSON
# =========================================================

try {

    $json = Get-Content -LiteralPath $JsonFile -Raw -Encoding UTF8 |
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
$descripcionEncontradas = 0

# =========================================================
# OBTENER TODOS LOS HTML UNA SOLA VEZ
# =========================================================

Write-Host "Buscando archivos HTML..." -ForegroundColor DarkGray

$todosLosHtml = Get-ChildItem `
    -LiteralPath $ProjectRoot `
    -Recurse `
    -File `
    -Filter "*.html"

Write-Host "HTML disponibles: $($todosLosHtml.Count)" -ForegroundColor DarkGray
Write-Host ""

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

        for ($i = 0; $i -lt $seccion.Count; $i++) {

            $item = $seccion[$i]

            if ($null -eq $item) {
                continue
            }

            if ([string]::IsNullOrWhiteSpace([string]$item.archivo)) {
                continue
            }

            $total++

            # =================================================
            # DATOS DEL ITEM
            # =================================================

            $relativePath = ([string]$item.archivo) -replace "/", "\"
            $nombreArchivo = Split-Path $relativePath -Leaf

            Write-Host ""
            Write-Host "[$total] $($item.titulo)" -ForegroundColor White
            Write-Host "    JSON: $relativePath" -ForegroundColor DarkGray

            # =================================================
            # BUSCAR HTML REAL
            # =================================================

            $archivoEncontrado = $todosLosHtml |
                Where-Object {
                    $_.Name -ieq $nombreArchivo
                } |
                Select-Object -First 1

            if (-not $archivoEncontrado) {

                Write-Host "    HTML NO ENCONTRADO: $nombreArchivo" -ForegroundColor Red

                $htmlNoEncontrados++

                continue
            }

            $htmlPath = $archivoEncontrado.FullName

            $htmlEncontrados++

            Write-Host "    HTML REAL: $htmlPath" -ForegroundColor Green

            # =================================================
            # LEER HTML
            # =================================================

            try {

                $html = Get-Content `
                    -LiteralPath $htmlPath `
                    -Raw `
                    -Encoding UTF8

            }
            catch {

                Write-Host "    ERROR LEYENDO HTML" -ForegroundColor Red
                continue
            }

            # =================================================
            # ARCHIVO
            # =================================================

            $hrefMatch = [regex]::Match(
                $html,
                '(?is)<a\b[^>]*\bid\s*=\s*["'']favoritoEnlace["''][^>]*\bhref\s*=\s*["'']([^"'']+)["'']'
            )

            if (-not $hrefMatch.Success) {

                $hrefMatch = [regex]::Match(
                    $html,
                    '(?is)<a\b[^>]*\bhref\s*=\s*["'']([^"'']+)["''][^>]*\bid\s*=\s*["'']favoritoEnlace["'']'
                )
            }

            if ($hrefMatch.Success) {

                $href = $hrefMatch.Groups[1].Value.Trim()

                # =================================================
                # OBTENER CARPETA REAL SIN GetRelativePath
                # =================================================

                $projectRootNormalizado = $ProjectRoot.TrimEnd("\","/")
                $htmlNormalizado = $htmlPath

                if ($htmlNormalizado.StartsWith(
                    $projectRootNormalizado,
                    [System.StringComparison]::OrdinalIgnoreCase
                )) {

                    $relativeReal = $htmlNormalizado.Substring(
                        $projectRootNormalizado.Length
                    ).TrimStart("\","/")

                }
                else {

                    $relativeReal = $relativePath
                }

                $carpetaReal = Split-Path $relativeReal -Parent

                if ($carpetaReal -and $carpetaReal -ne ".") {

                    $nuevoArchivo = (
                        $carpetaReal + "\" + $href
                    ) -replace "\\", "/"

                }
                else {

                    $nuevoArchivo = $href -replace "\\", "/"
                }

                $item.archivo = $nuevoArchivo

                Write-Host "    ARCHIVO: $nuevoArchivo" -ForegroundColor Green
            }

            # =================================================
            # POSTER
            # =================================================

            $poster = ""

            $coverMatches = [regex]::Matches(
                $html,
                '(?is)\.cover\s*\{(.*?)\}'
            )

            foreach ($coverMatch in $coverMatches) {

                $coverBlock = $coverMatch.Groups[1].Value

                $urlMatch = [regex]::Match(
                    $coverBlock,
                    '(?is)background(?:-image)?\s*:\s*url\s*\(\s*["'']?([^"'')]+)["'']?\s*\)'
                )

                if ($urlMatch.Success) {

                    $poster = $urlMatch.Groups[1].Value.Trim()

                    break
                }
            }

            if ($poster) {

                $item.poster = $poster
                $posterEncontrados++

                Write-Host "    POSTER: $poster" -ForegroundColor Green
            }
            else {

                Write-Host "    POSTER no encontrado" -ForegroundColor Yellow
            }

            # =================================================
            # BACKDROP
            # =================================================

            $backdrop = ""

            $landscapeMatches = [regex]::Matches(
                $html,
                '(?is)\.cover-landscape\s*\{(.*?)\}'
            )

            foreach ($landscapeMatch in $landscapeMatches) {

                $landscapeBlock = $landscapeMatch.Groups[1].Value

                $urlMatch = [regex]::Match(
                    $landscapeBlock,
                    '(?is)background(?:-image)?\s*:\s*url\s*\(\s*["'']?([^"'')]+)["'']?\s*\)'
                )

                if ($urlMatch.Success) {

                    $backdrop = $urlMatch.Groups[1].Value.Trim()

                    break
                }
            }

            if ($backdrop) {

                $item.backdrop = $backdrop
                $backdropEncontrados++

                Write-Host "    BACKDROP: $backdrop" -ForegroundColor Green
            }
            else {

                Write-Host "    BACKDROP no encontrado" -ForegroundColor Yellow
            }

            # =================================================
            # LOGO
            # =================================================
            #
            # IMPORTANTE:
            # NO buscamos el primer logo del HTML.
            #
            # Primero localizamos cover-content.
            # Después buscamos todos los IMG.logo que aparecen
            # DESPUES de cover-content.
            #
            # Así NO debe agarrar Knight.png del encabezado.
            # =================================================

            $logo = ""

            $coverContentIndex = $html.IndexOf(
                'class="cover-content"',
                [System.StringComparison]::OrdinalIgnoreCase
            )

            if ($coverContentIndex -lt 0) {

                $coverContentIndex = $html.IndexOf(
                    "class='cover-content'",
                    [System.StringComparison]::OrdinalIgnoreCase
                )
            }

            if ($coverContentIndex -ge 0) {

                $htmlDespuesCover = $html.Substring(
                    $coverContentIndex
                )

                $logoMatches = [regex]::Matches(
                    $htmlDespuesCover,
                    '(?is)<img\b[^>]*\bclass\s*=\s*["''][^"'']*\blogo\b[^"'']*["''][^>]*>'
                )

                foreach ($logoMatch in $logoMatches) {

                    $imgTag = $logoMatch.Value

                    $srcMatch = [regex]::Match(
                        $imgTag,
                        '(?is)\bsrc\s*=\s*["'']([^"'']+)["'']'
                    )

                    if ($srcMatch.Success) {

                        $posibleLogo = $srcMatch.Groups[1].Value.Trim()

                        if (
                            $posibleLogo -and
                            $posibleLogo -notmatch "Knight\.png"
                        ) {

                            $logo = $posibleLogo

                            break
                        }
                    }
                }
            }

            # =================================================
            # SEGUNDO METODO DE LOGO
            # =================================================
            #
            # Si la página no tiene cover-content exactamente
            # como esperamos, buscamos el IMG.logo que esté
            # cerca del contenido de portada.
            # =================================================

            if (-not $logo) {

                $logoMatches = [regex]::Matches(
                    $html,
                    '(?is)<img\b[^>]*\bclass\s*=\s*["''][^"'']*\blogo\b[^"'']*["''][^>]*>'
                )

                foreach ($logoMatch in $logoMatches) {

                    $imgTag = $logoMatch.Value

                    $srcMatch = [regex]::Match(
                        $imgTag,
                        '(?is)\bsrc\s*=\s*["'']([^"'']+)["'']'
                    )

                    if ($srcMatch.Success) {

                        $posibleLogo = $srcMatch.Groups[1].Value.Trim()

                        if (
                            $posibleLogo -and
                            $posibleLogo -notmatch "Knight\.png"
                        ) {

                            $logo = $posibleLogo

                            break
                        }
                    }
                }
            }

            if ($logo) {

                $item.logo = $logo
                $logoEncontrados++

                Write-Host "    LOGO: $logo" -ForegroundColor Green
            }
            else {

                Write-Host "    LOGO no encontrado" -ForegroundColor Yellow
            }

            # =================================================
            # DESCRIPCION
            # =================================================

            $descripcion = ""

            $descriptionMatch = [regex]::Match(
                $html,
                '(?is)<div\b[^>]*class\s*=\s*["''][^"'']*\bdescription\b[^"'']*["''][^>]*>(.*?)</div>'
            )

            if ($descriptionMatch.Success) {

                $descripcion = $descriptionMatch.Groups[1].Value.Trim()

                $descripcion = [regex]::Replace(
                    $descripcion,
                    '\s+',
                    ' '
                ).Trim()
            }

            if ($descripcion) {

                $item.descripcion = $descripcion
                $descripcionEncontradas++

                Write-Host "    DESCRIPCION encontrada" -ForegroundColor Green
            }
            else {

                Write-Host "    DESCRIPCION no encontrada" -ForegroundColor Yellow
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

Write-Host "Elementos procesados      : $total"
Write-Host "HTML encontrados          : $htmlEncontrados" -ForegroundColor Green
Write-Host "HTML no encontrados       : $htmlNoEncontrados" -ForegroundColor Red
Write-Host ""
Write-Host "Posters encontrados       : $posterEncontrados" -ForegroundColor Green
Write-Host "Backdrops encontrados     : $backdropEncontrados" -ForegroundColor Green
Write-Host "Logos encontrados         : $logoEncontrados" -ForegroundColor Green
Write-Host "Descripciones encontradas : $descripcionEncontradas" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "      SINCRONIZACION TERMINADA" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""