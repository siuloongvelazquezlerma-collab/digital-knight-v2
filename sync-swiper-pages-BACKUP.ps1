$ErrorActionPreference = "Stop"

# =========================================================
# SINCRONIZADOR DE SWIPERS
# Busca automáticamente el HTML correcto y extrae sus datos
# =========================================================

$ProjectRoot = "G:\digital-knight-v2\www"
$JsonFile = Join-Path $ProjectRoot "swiper-data.json"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "       SINCRONIZADOR DE SWIPERS V2" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# =========================================================
# COMPROBAR ARCHIVOS
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
$archivoEncontrados = 0

# =========================================================
# OBTENER TODOS LOS HTML
# =========================================================

Write-Host "Buscando todos los HTML..." -ForegroundColor DarkGray

$todosLosHtml = Get-ChildItem `
    -LiteralPath $ProjectRoot `
    -Recurse `
    -File `
    -Filter "*.html"

Write-Host "HTML encontrados: $($todosLosHtml.Count)" -ForegroundColor Green
Write-Host ""

# =========================================================
# FUNCIONES
# =========================================================

function Normalizar-Texto {
    param(
        [string]$Texto
    )

    if ([string]::IsNullOrWhiteSpace($Texto)) {
        return ""
    }

    $Texto = $Texto.ToLowerInvariant().Trim()

    # Quitar acentos
    $Texto = $Texto.Normalize(
        [System.Text.NormalizationForm]::FormD
    )

    $Texto = -join (
        $Texto.ToCharArray() |
        Where-Object {
            [Globalization.CharUnicodeInfo]::GetUnicodeCategory($_) -ne
            [Globalization.UnicodeCategory]::NonSpacingMark
        }
    )

    $Texto = $Texto.Normalize(
        [System.Text.NormalizationForm]::FormC
    )

    # Quitar extension
    $Texto = [regex]::Replace(
        $Texto,
        '\.html?$',
        ''
    )

    # Todo lo que no sea letra/número -> espacio
    $Texto = [regex]::Replace(
        $Texto,
        '[^a-z0-9]+',
        ' '
    )

    # Quitar espacios dobles
    $Texto = [regex]::Replace(
        $Texto,
        '\s+',
        ' '
    ).Trim()

    return $Texto
}

function Obtener-Url-CSS {
    param(
        [string]$Html,
        [string]$Clase
    )

    $matches = [regex]::Matches(
        $Html,
        "(?is)\.$Clase\s*\{(.*?)\}"
    )

    foreach ($match in $matches) {

        $bloque = $match.Groups[1].Value

        $urlMatch = [regex]::Match(
            $bloque,
            '(?is)background(?:-image)?\s*:\s*(?:[^;]*?)url\s*\(\s*["'']?([^"'')]+)["'']?\s*\)'
        )

        if ($urlMatch.Success) {

            $url = $urlMatch.Groups[1].Value.Trim()

            if ($url) {
                return $url
            }
        }
    }

    return ""
}

function Obtener-Logo {
    param(
        [string]$Html
    )

    # =====================================================
    # PRIMERA OPCION:
    # IMG.logo dentro de cover-content
    # =====================================================

    $coverContentMatch = [regex]::Match(
        $Html,
        '(?is)<div\b[^>]*class\s*=\s*["''][^"'']*\bcover-content\b[^"'']*["''][^>]*>(.*?)(?:</div>\s*</div>|</div>)'
    )

    if ($coverContentMatch.Success) {

        $bloque = $coverContentMatch.Groups[1].Value

        $logoMatches = [regex]::Matches(
            $bloque,
            '(?is)<img\b[^>]*>'
        )

        foreach ($logoMatch in $logoMatches) {

            $tag = $logoMatch.Value

            $classMatch = [regex]::Match(
                $tag,
                '(?is)\bclass\s*=\s*["'']([^"'']*)["'']'
            )

            if ($classMatch.Success) {

                $clases = $classMatch.Groups[1].Value

                if ($clases -match '(^|\s)logo(\s|$)') {

                    $srcMatch = [regex]::Match(
                        $tag,
                        '(?is)\bsrc\s*=\s*["'']([^"'']+)["'']'
                    )

                    if ($srcMatch.Success) {

                        $src = $srcMatch.Groups[1].Value.Trim()

                        if (
                            $src -and
                            $src -notmatch 'Knight\.png' -and
                            $src -notmatch 'logo\s*2025'
                        ) {
                            return $src
                        }
                    }
                }
            }
        }
    }

    # =====================================================
    # SEGUNDA OPCION:
    # Cualquier IMG con clase logo
    # =====================================================

    $logoMatches = [regex]::Matches(
        $Html,
        '(?is)<img\b[^>]*>'
    )

    foreach ($logoMatch in $logoMatches) {

        $tag = $logoMatch.Value

        $classMatch = [regex]::Match(
            $tag,
            '(?is)\bclass\s*=\s*["'']([^"'']*)["'']'
        )

        if (-not $classMatch.Success) {
            continue
        }

        $clases = $classMatch.Groups[1].Value

        if ($clases -notmatch '(^|\s)logo(\s|$)') {
            continue
        }

        $srcMatch = [regex]::Match(
            $tag,
            '(?is)\bsrc\s*=\s*["'']([^"'']+)["'']'
        )

        if ($srcMatch.Success) {

            $src = $srcMatch.Groups[1].Value.Trim()

            if (
                $src -and
                $src -notmatch 'Knight\.png' -and
                $src -notmatch 'logo\s*2025'
            ) {
                return $src
            }
        }
    }

    return ""
}

function Obtener-Descripcion {
    param(
        [string]$Html
    )

    $match = [regex]::Match(
        $Html,
        '(?is)<div\b[^>]*class\s*=\s*["''][^"'']*\bdescription\b[^"'']*["''][^>]*>(.*?)</div>'
    )

    if ($match.Success) {

        $descripcion = $match.Groups[1].Value

        # Quitar HTML interno
        $descripcion = [regex]::Replace(
            $descripcion,
            '<[^>]+>',
            ''
        )

        $descripcion = [System.Net.WebUtility]::HtmlDecode(
            $descripcion
        )

        $descripcion = [regex]::Replace(
            $descripcion,
            '\s+',
            ' '
        ).Trim()

        return $descripcion
    }

    return ""
}

function Obtener-FavoritoEnlace {
    param(
        [string]$Html
    )

    $match = [regex]::Match(
        $Html,
        '(?is)<a\b[^>]*\bid\s*=\s*["'']favoritoEnlace["''][^>]*\bhref\s*=\s*["'']([^"'']+)["'']'
    )

    if (-not $match.Success) {

        $match = [regex]::Match(
            $Html,
            '(?is)<a\b[^>]*\bhref\s*=\s*["'']([^"'']+)["''][^>]*\bid\s*=\s*["'']favoritoEnlace["'']'
        )
    }

    if ($match.Success) {
        return $match.Groups[1].Value.Trim()
    }

    return ""
}

function Obtener-PageTitle {
    param(
        [string]$Html
    )

    # <title>
    $match = [regex]::Match(
        $Html,
        '(?is)<title[^>]*>(.*?)</title>'
    )

    if ($match.Success) {

        $titulo = [System.Net.WebUtility]::HtmlDecode(
            $match.Groups[1].Value
        )

        $titulo = [regex]::Replace(
            $titulo,
            '\s+',
            ' '
        ).Trim()

        if ($titulo) {
            return $titulo
        }
    }

    # #page-title
    $match = [regex]::Match(
        $Html,
        '(?is)<[^>]*id\s*=\s*["'']page-title["''][^>]*>(.*?)</[^>]+>'
    )

    if ($match.Success) {

        $titulo = [regex]::Replace(
            $match.Groups[1].Value,
            '<[^>]+>',
            ''
        )

        $titulo = [System.Net.WebUtility]::HtmlDecode(
            $titulo
        )

        $titulo = [regex]::Replace(
            $titulo,
            '\s+',
            ' '
        ).Trim()

        return $titulo
    }

    return ""
}

function Obtener-NombreFavorito {
    param(
        [string]$Html
    )

    $match = [regex]::Match(
        $Html,
        '(?is)<[^>]*id\s*=\s*["'']nombre["''][^>]*>(.*?)</'
    )

    if ($match.Success) {

        $nombre = [regex]::Replace(
            $match.Groups[1].Value,
            '<[^>]+>',
            ''
        )

        $nombre = [System.Net.WebUtility]::HtmlDecode(
            $nombre
        )

        return (
            [regex]::Replace(
                $nombre,
                '\s+',
                ' '
            ).Trim()
        )
    }

    return ""
}

function Obtener-IdPagina {
    param(
        [string]$Html
    )

    # window.movieId = "..."
    $match = [regex]::Match(
        $Html,
        '(?is)\bwindow\.movieId\s*=\s*["'']([^"'']+)["'']'
    )

    if ($match.Success) {
        return $match.Groups[1].Value.Trim()
    }

    # const movieId = "..."
    $match = [regex]::Match(
        $Html,
        '(?is)\b(?:const|let|var)\s+movieId\s*=\s*["'']([^"'']+)["'']'
    )

    if ($match.Success) {
        return $match.Groups[1].Value.Trim()
    }

    # const seriesId = "..."
    $match = [regex]::Match(
        $Html,
        '(?is)\b(?:const|let|var)\s+seriesId\s*=\s*["'']([^"'']+)["'']'
    )

    if ($match.Success) {
        return $match.Groups[1].Value.Trim()
    }

    # window.seriesId
    $match = [regex]::Match(
        $Html,
        '(?is)\bwindow\.seriesId\s*=\s*["'']([^"'']+)["'']'
    )

    if ($match.Success) {
        return $match.Groups[1].Value.Trim()
    }

    return ""
}

# =========================================================
# CREAR INDICE DE HTML
# =========================================================

Write-Host "Construyendo indice de páginas..." -ForegroundColor Cyan

$indicePaginas = @()

foreach ($archivoHtml in $todosLosHtml) {

    try {

        $contenido = Get-Content `
            -LiteralPath $archivoHtml.FullName `
            -Raw `
            -Encoding UTF8

        if ([string]::IsNullOrWhiteSpace($contenido)) {
            continue
        }

        $tituloHtml = Obtener-PageTitle $contenido
        $nombreHtml = Obtener-NombreFavorito $contenido
        $idPagina = Obtener-IdPagina $contenido

        $indicePaginas += [PSCustomObject]@{
            File = $archivoHtml
            Html = $contenido
            FileNameNormalized = Normalizar-Texto $archivoHtml.BaseName
            TitleNormalized = Normalizar-Texto $tituloHtml
            NombreNormalized = Normalizar-Texto $nombreHtml
            Id = $idPagina.ToLowerInvariant()
        }

    }
    catch {
        Write-Host "No se pudo leer: $($archivoHtml.FullName)" -ForegroundColor DarkYellow
    }
}

Write-Host "Indice creado: $($indicePaginas.Count) páginas" -ForegroundColor Green
Write-Host ""

# =========================================================
# RECORRER JSON
# =========================================================

foreach ($conjuntoProp in $json.PSObject.Properties) {

    $conjunto = $conjuntoProp.Value

    if ($null -eq $conjunto) {
        continue
    }

    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "CONJUNTO: $($conjuntoProp.Name)" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan

    foreach ($seccionProp in $conjunto.PSObject.Properties) {

        $seccion = $seccionProp.Value

        if ($null -eq $seccion) {
            continue
        }

        if (-not ($seccion -is [System.Collections.IEnumerable])) {
            continue
        }

        Write-Host ""
        Write-Host "SECCION: $($seccionProp.Name)" -ForegroundColor Magenta

        foreach ($item in $seccion) {

            if ($null -eq $item) {
                continue
            }

            if ([string]::IsNullOrWhiteSpace([string]$item.titulo)) {
                continue
            }

            $total++

            $tituloJson = ([string]$item.titulo).Trim()
            $tituloNormalizado = Normalizar-Texto $tituloJson

            Write-Host ""
            Write-Host "[$total] $tituloJson" -ForegroundColor White

            # =================================================
            # DATOS PARA BUSCAR
            # =================================================

            $archivoJson = [string]$item.archivo

            $nombreArchivoJson = ""

            if ($archivoJson) {
                $nombreArchivoJson = [System.IO.Path]::GetFileNameWithoutExtension(
                    $archivoJson
                )
            }

            $nombreArchivoNormalizado = Normalizar-Texto $nombreArchivoJson

            # =================================================
            # BUSQUEDA
            # =================================================

            $candidatos = @()

            # -----------------------------------------------
            # 1. ARCHIVO EXACTO
            # -----------------------------------------------

            if ($archivoJson) {

                $rutaCompleta = Join-Path `
                    $ProjectRoot `
                    ($archivoJson -replace "/", "\")

                if (Test-Path -LiteralPath $rutaCompleta) {

                    $candidatos = @(
                        $indicePaginas |
                        Where-Object {
                            $_.File.FullName -ieq $rutaCompleta
                        }
                    )
                }
            }

            # -----------------------------------------------
            # 2. NOMBRE DEL ARCHIVO
            # -----------------------------------------------

            if ($candidatos.Count -eq 0 -and $nombreArchivoNormalizado) {

                $candidatos = @(
                    $indicePaginas |
                    Where-Object {
                        $_.FileNameNormalized -eq $nombreArchivoNormalizado
                    }
                )
            }

            # -----------------------------------------------
            # 3. TITULO DEL HTML
            # -----------------------------------------------

            if ($candidatos.Count -eq 0) {

                $candidatos = @(
                    $indicePaginas |
                    Where-Object {
                        $_.TitleNormalized -eq $tituloNormalizado
                    }
                )
            }

            # -----------------------------------------------
            # 4. #nombre
            # -----------------------------------------------

            if ($candidatos.Count -eq 0) {

                $candidatos = @(
                    $indicePaginas |
                    Where-Object {
                        $_.NombreNormalized -eq $tituloNormalizado
                    }
                )
            }

            # -----------------------------------------------
            # 5. BUSQUEDA PARCIAL
            # -----------------------------------------------

            if ($candidatos.Count -eq 0 -and $tituloNormalizado.Length -ge 5) {

                $candidatos = @(
                    $indicePaginas |
                    Where-Object {
                        (
                            $_.TitleNormalized -and
                            (
                                $_.TitleNormalized.Contains($tituloNormalizado) -or
                                $tituloNormalizado.Contains($_.TitleNormalized)
                            )
                        ) -or
                        (
                            $_.NombreNormalized -and
                            (
                                $_.NombreNormalized.Contains($tituloNormalizado) -or
                                $tituloNormalizado.Contains($_.NombreNormalized)
                            )
                        ) -or
                        (
                            $_.FileNameNormalized -and
                            (
                                $_.FileNameNormalized.Contains($tituloNormalizado) -or
                                $tituloNormalizado.Contains($_.FileNameNormalized)
                            )
                        )
                    }
                )
            }

            # =================================================
            # SI NO ENCUENTRA
            # =================================================

            if ($candidatos.Count -eq 0) {

                Write-Host "    HTML NO ENCONTRADO" -ForegroundColor Red
                Write-Host "    Titulo buscado: $tituloJson" -ForegroundColor DarkYellow

                $htmlNoEncontrados++

                continue
            }

            # =================================================
            # SI ENCUENTRA VARIOS
            # =================================================

            if ($candidatos.Count -gt 1) {

                Write-Host "    Se encontraron $($candidatos.Count) coincidencias." -ForegroundColor Yellow
                Write-Host "    Usando la primera coincidencia." -ForegroundColor Yellow
            }

            $pagina = $candidatos[0]

            $htmlPath = $pagina.File.FullName
            $html = $pagina.Html

            $htmlEncontrados++

            Write-Host "    HTML: $htmlPath" -ForegroundColor Green

            # =================================================
            # ARCHIVO REAL
            # =================================================

            $relativeReal = $htmlPath.Substring(
                $ProjectRoot.Length
            ).TrimStart("\","/")

            $nuevoArchivo = $relativeReal -replace "\\", "/"

            $item.archivo = $nuevoArchivo

            $archivoEncontrados++

            Write-Host "    ARCHIVO: $nuevoArchivo" -ForegroundColor Green

            # =================================================
            # POSTER
            # =================================================

            $poster = Obtener-Url-CSS `
                -Html $html `
                -Clase "cover"

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

            $backdrop = Obtener-Url-CSS `
                -Html $html `
                -Clase "cover-landscape"

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

            $logo = Obtener-Logo $html

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

            $descripcion = Obtener-Descripcion $html

            if ($descripcion) {

                $item.descripcion = $descripcion
                $descripcionEncontradas++

                Write-Host "    DESCRIPCION encontrada" -ForegroundColor Green
            }
            else {

                Write-Host "    DESCRIPCION no encontrada" -ForegroundColor Yellow
            }

            # =================================================
            # ID PARA DEPURACION
            # =================================================

            $idPagina = Obtener-IdPagina $html

            if ($idPagina) {

                Write-Host "    ID: $idPagina" -ForegroundColor DarkGray
            }
        }
    }
}

# =========================================================
# GUARDAR JSON
# =========================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "GUARDANDO swiper-data.json" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

try {

    $jsonFinal = $json | ConvertTo-Json -Depth 100

    [System.IO.File]::WriteAllText(
        $JsonFile,
        $jsonFinal,
        [System.Text.UTF8Encoding]::new($false)
    )

}
catch {

    Write-Host "ERROR guardando JSON" -ForegroundColor Red
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
Write-Host "Archivos actualizados     : $archivoEncontrados" -ForegroundColor Green
Write-Host "Posters encontrados       : $posterEncontrados" -ForegroundColor Green
Write-Host "Backdrops encontrados     : $backdropEncontrados" -ForegroundColor Green
Write-Host "Logos encontrados         : $logoEncontrados" -ForegroundColor Green
Write-Host "Descripciones encontradas : $descripcionEncontradas" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "       SINCRONIZACION TERMINADA" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""