# ============================================================
#       SINCRONIZADOR DE SWIPERS V5
#       HTML -> swiper-data.json
#
#       IMPORTANTE:
#       - NUNCA modifica archivos HTML
#       - swiper-data.json es el UNICO archivo que se modifica
#       - La ruta del JSON determina la carpeta y archivo
#       - El HTML solamente sirve como fuente de informacion
# ============================================================

$ErrorActionPreference = "SilentlyContinue"

$ROOT = "G:\digital-knight-v2"
$WWW  = Join-Path $ROOT "www"
$JSON = Join-Path $WWW "swiper-data.json"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "       SINCRONIZADOR DE SWIPERS V5" -ForegroundColor Cyan
Write-Host "       HTML -> swiper-data.json" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if (!(Test-Path $JSON)) {

    Write-Host "ERROR: swiper-data.json no encontrado" -ForegroundColor Red
    exit
}

Write-Host "OK: swiper-data.json encontrado" -ForegroundColor Green
Write-Host ""

# ============================================================
# FUNCIONES
# ============================================================

function Normalizar-Texto {

    param([string]$Texto)

    if ([string]::IsNullOrWhiteSpace($Texto)) {
        return ""
    }

    $Texto = $Texto.ToLowerInvariant()

    $Texto = $Texto -replace "&amp;", "&"
    $Texto = $Texto -replace "&quot;", '"'
    $Texto = $Texto -replace "&#39;", "'"
    $Texto = $Texto -replace "&apos;", "'"
    $Texto = $Texto -replace "&nbsp;", " "

    try {

        $Texto = $Texto.Normalize(
            [Text.NormalizationForm]::FormD
        )

        $Texto = -join (
            $Texto.ToCharArray() |
            Where-Object {
                [Globalization.CharUnicodeInfo]::GetUnicodeCategory($_) -ne
                [Globalization.UnicodeCategory]::NonSpacingMark
            }
        )

        $Texto = $Texto.Normalize(
            [Text.NormalizationForm]::FormC
        )

    }
    catch {}

    $Texto = $Texto -replace '[^a-z0-9]+', ' '
    $Texto = $Texto -replace '\s+', ' '

    return $Texto.Trim()
}


function Normalizar-NombreArchivo {

    param([string]$Texto)

    if ([string]::IsNullOrWhiteSpace($Texto)) {
        return ""
    }

    $Texto = [System.IO.Path]::GetFileNameWithoutExtension($Texto)

    return Normalizar-Texto $Texto
}


# ============================================================
# TITULO DEL HTML
# ============================================================

function Obtener-TituloHTML {

    param([string]$Contenido)

    if ($Contenido -match '(?is)<title[^>]*>\s*(.*?)\s*</title>') {

        $titulo = $matches[1]

        $titulo = $titulo -replace '<[^>]+>', ' '

        $titulo = [System.Net.WebUtility]::HtmlDecode($titulo)

        $titulo = $titulo -replace '\s*[\|\-–—]\s*Digital Knight.*$', ''
        $titulo = $titulo -replace '\s*[\|\-–—]\s*DigitalKnight.*$', ''

        return $titulo.Trim()
    }

    return ""
}


# ============================================================
# POSTER
#
# Busca el background de .cover
# ============================================================

function Obtener-Poster {

    param([string]$Contenido)

    if (
        $Contenido -match
        '(?is)\.cover\s*\{.*?background\s*:\s*url\(["'']?([^)"'']+)["'']?\)'
    ) {

        return $matches[1].Trim()
    }

    return ""
}


# ============================================================
# BACKDROP
#
# Busca el background de .cover-landscape
# ============================================================

function Obtener-Backdrop {

    param([string]$Contenido)

    if (
        $Contenido -match
        '(?is)\.cover-landscape\s*\{.*?background\s*:\s*url\(["'']?([^)"'']+)["'']?\)'
    ) {

        return $matches[1].Trim()
    }

    return ""
}


# ============================================================
# LOGO
#
# IMPORTANTE:
#
# NO toma:
#
# <img ... class="logo">
#
# del encabezado.
#
# Busca especificamente el logo dentro de .cover-content
# ============================================================

function Obtener-Logo {

    param([string]$Contenido)

    # Primero localizar cover-content

    if (
        $Contenido -match
        '(?is)<div[^>]*class\s*=\s*["''][^"'']*\bcover-content\b[^"'']*["''][^>]*>(.*?)</div>'
    ) {

        $coverContent = $matches[1]

        # Buscar img class="logo" dentro de cover-content

        if (
            $coverContent -match
            '(?is)<img[^>]*class\s*=\s*["''][^"'']*\blogo\b[^"'']*["''][^>]*src\s*=\s*["'']([^"'']+)["'']'
        ) {

            return $matches[1].Trim()
        }

        # Caso donde src aparece antes que class

        if (
            $coverContent -match
            '(?is)<img[^>]*src\s*=\s*["'']([^"'']+)["''][^>]*class\s*=\s*["''][^"'']*\blogo\b[^"'']*["'']'
        ) {

            return $matches[1].Trim()
        }
    }

    return ""
}


# ============================================================
# DESCRIPCION
# ============================================================

function Obtener-Descripcion {

    param([string]$Contenido)

    if (
        $Contenido -match
        '(?is)<div[^>]*class\s*=\s*["''][^"'']*\bdescription\b[^"'']*["''][^>]*>\s*(.*?)\s*</div>'
    ) {

        $texto = $matches[1]

        $texto = $texto -replace '<[^>]+>', ' '

        $texto = [System.Net.WebUtility]::HtmlDecode($texto)

        $texto = $texto -replace '\s+', ' '

        return $texto.Trim()
    }

    return ""
}

# ============================================================
# META
#
# EJEMPLO HTML:
#
# <div class="meta">7+   7 temporadas   1991   Dob Lat</div>
#
# RESULTADO:
#
# Serie · 7+ · 1991 · 7 Temporadas
#
# IMPORTANTE:
# - SOLO LEE EL HTML
# - NUNCA MODIFICA EL HTML
# - ELIMINA "Dob Lat"
# ============================================================

function Obtener-Meta {

    param([string]$Contenido)

    if (
        $Contenido -match
        '(?is)<div[^>]*class\s*=\s*["''][^"'']*\bmeta\b[^"'']*["''][^>]*>\s*(.*?)\s*</div>'
    ) {

        $meta = $matches[1]

        # Quitar HTML interno
        $meta = $meta -replace '<[^>]+>', ' '

        # Decodificar entidades HTML
        $meta = [System.Net.WebUtility]::HtmlDecode($meta)

        # Convertir espacios especiales
        $meta = $meta -replace '[\u00A0\u2007\u202F]', ' '

        # Quitar Dob Lat
        $meta = $meta -replace '(?i)\s*Dob\s+Lat\s*$', ''

        # Quitar Dob o Lat si aparecen solos al final
        $meta = $meta -replace '(?i)\s+(Dob|Lat)\s*$', ''

        # Normalizar espacios
        $meta = $meta -replace '\s+', ' '
        $meta = $meta.Trim()

        if ([string]::IsNullOrWhiteSpace($meta)) {
            return ""
        }


        # ====================================================
        # SERIE
        #
        # Ejemplo:
        # 7+ 7 temporadas 1991
        #
        # Resultado:
        # Serie · 7+ · 1991 · 7 Temporadas
        # ====================================================

        if (
            $meta -match
            '^(?<edad>\d+\+)\s+(?<temporadas>\d+\s+temporadas?)\s+(?<anio>(?:19|20)\d{2})$'
        ) {

            $edad = $matches["edad"].Trim()
            $temporadas = $matches["temporadas"].Trim()
            $anio = $matches["anio"].Trim()

            $temporadas = $temporadas -replace '(?i)temporadas?', 'Temporadas'

            return ("Serie " + [char]0x00B7 + " " + $edad + " " + [char]0x00B7 + " " + $anio + " " + [char]0x00B7 + " " + $temporadas)
        }


        # ====================================================
        # SERIE
        #
        # También acepta:
        #
        # 13+ 5 temporadas 1992
        # 13+ 1 temporada 2020
        # ====================================================

        if (
            $meta -match
            '^(?<edad>\d+\+)\s+(?<temporadas>\d+\s+temporadas?)\s+(?<anio>(?:19|20)\d{2})'
        ) {

            $edad = $matches["edad"].Trim()
            $temporadas = $matches["temporadas"].Trim()
            $anio = $matches["anio"].Trim()

            $temporadas = $temporadas -replace '(?i)temporadas?', 'Temporadas'

            return ("Serie " + [char]0x00B7 + " " + $edad + " " + [char]0x00B7 + " " + $anio + " " + [char]0x00B7 + " " + $temporadas)
        }


        # ====================================================
        # PELICULA
        #
        # Ejemplo:
        #
        # 15+ 1h 45min 2018
        #
        # Resultado:
        #
        # Película · 15+ · 1h 45min · 2018
        # ====================================================

        if (
            $meta -match
            '^(?<edad>\d+\+)\s+(?<duracion>.+?)\s+(?<anio>(?:19|20)\d{2})$'
        ) {

            $edad = $matches["edad"].Trim()
            $duracion = $matches["duracion"].Trim()
            $anio = $matches["anio"].Trim()

            return ("Pel" + [char]0x00ED + "cula " + [char]0x00B7 + " " + $edad + " " + [char]0x00B7 + " " + $duracion + " " + [char]0x00B7 + " " + $anio)
        }


        # ====================================================
        # SI NO PUDO CLASIFICAR
        #
        # Devuelve el contenido limpio sin Dob Lat.
        # ====================================================

        return $meta
    }

    return ""
}

# ============================================================
# CARGAR JSON
# ============================================================

Write-Host "Cargando swiper-data.json..." -ForegroundColor Yellow

try {

    $jsonTexto = Get-Content $JSON -Raw -Encoding UTF8

    $datos = $jsonTexto | ConvertFrom-Json

}
catch {

    Write-Host "ERROR leyendo swiper-data.json" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red

    exit
}

Write-Host "JSON cargado correctamente." -ForegroundColor Green
Write-Host ""


# ============================================================
# RESULTADOS
# ============================================================

$procesados = 0
$encontrados = 0
$noEncontrados = 0

$posters = 0
$backdrops = 0
$logos = 0
$descripciones = 0
$metas = 0

# ============================================================
# PROCESAR JSON
# ============================================================

foreach ($prop in $datos.PSObject.Properties) {

    $nombreConjunto = $prop.Name
    $listas = $prop.Value

    if ($null -eq $listas) {
        continue
    }

    foreach ($listaProp in $listas.PSObject.Properties) {

        $nombreLista = $listaProp.Name
        $lista = $listaProp.Value

        if ($null -eq $lista) {
            continue
        }

        if (
            $lista -isnot [System.Collections.IEnumerable] -or
            $lista -is [string]
        ) {
            continue
        }

        foreach ($item in $lista) {

            if ($null -eq $item) {
                continue
            }

            $procesados++

            $tituloJSON = [string]$item.titulo
            $archivoJSON = [string]$item.archivo

            if ([string]::IsNullOrWhiteSpace($archivoJSON)) {

                Write-Host ""
                Write-Host "SIN ARCHIVO:" -ForegroundColor Red
                Write-Host "  $tituloJSON"

                $noEncontrados++

                continue
            }


            # ====================================================
            # LA RUTA DEL JSON ES LA RUTA PRINCIPAL
            #
            # Ejemplo:
            #
            # Anime/Sailor Moon (1992).html
            #
            # -> www\Anime\Sailor Moon (1992).html
            # ====================================================

            $rutaRelativa = $archivoJSON -replace '/', '\'

            $rutaHTML = Join-Path $WWW $rutaRelativa


            Write-Host ""
            Write-Host "--------------------------------------------" -ForegroundColor DarkGray
            Write-Host "TITULO : $tituloJSON" -ForegroundColor Cyan
            Write-Host "RUTA   : $archivoJSON" -ForegroundColor DarkGray


            # ====================================================
            # 1. ARCHIVO EXACTO
            # ====================================================

            if (!(Test-Path $rutaHTML)) {

                Write-Host "NO ENCONTRADO" -ForegroundColor Red
                Write-Host "  $rutaHTML" -ForegroundColor Red

                $noEncontrados++

                continue
            }


            # ====================================================
            # LEER HTML
            #
            # SOLO LECTURA
            # ====================================================

            try {

                $contenido = Get-Content `
                    $rutaHTML `
                    -Raw `
                    -Encoding UTF8

            }
            catch {

                Write-Host "ERROR leyendo HTML" -ForegroundColor Red

                $noEncontrados++

                continue
            }


            if ([string]::IsNullOrWhiteSpace($contenido)) {

                Write-Host "HTML VACIO" -ForegroundColor Red

                $noEncontrados++

                continue
            }


            $encontrados++


            # ====================================================
            # EXTRAER INFORMACION
            # ====================================================

            $tituloHTML = Obtener-TituloHTML $contenido

            $posterHTML = Obtener-Poster $contenido

            $backdropHTML = Obtener-Backdrop $contenido

            $logoHTML = Obtener-Logo $contenido

            $descripcionHTML = Obtener-Descripcion $contenido

            $metaHTML = Obtener-Meta $contenido


            # ====================================================
            # MOSTRAR LO ENCONTRADO
            # ====================================================

            Write-Host "ENCONTRADO" -ForegroundColor Green

            if ($posterHTML) {

                Write-Host "  Poster       : OK" -ForegroundColor Green

                $item.poster = $posterHTML

                $posters++
            }
            else {

                Write-Host "  Poster       : NO" -ForegroundColor DarkYellow
            }


            if ($backdropHTML) {

                Write-Host "  Backdrop     : OK" -ForegroundColor Green

                $item.backdrop = $backdropHTML

                $backdrops++
            }
            else {

                Write-Host "  Backdrop     : NO" -ForegroundColor DarkYellow
            }


            if ($logoHTML) {

                Write-Host "  Logo         : OK" -ForegroundColor Green

                $item.logo = $logoHTML

                $logos++
            }
            else {

                Write-Host "  Logo         : NO" -ForegroundColor DarkYellow
            }


            if ($descripcionHTML) {

                Write-Host "  Descripcion  : OK" -ForegroundColor Green

                $item.descripcion = $descripcionHTML

                $descripciones++
            }
            else {

                Write-Host "  Descripcion  : NO" -ForegroundColor DarkYellow
            }

            # ====================================================
# META
# ====================================================

if ($metaHTML) {

    Write-Host "  Meta         : $metaHTML" -ForegroundColor Green

    $item.meta = $metaHTML

    $metas++
}
else {

    Write-Host "  Meta         : NO" -ForegroundColor DarkYellow
}


            # ====================================================
            # IMPORTANTE
            #
            # AQUI NO SE MODIFICA:
            #
            # $contenido
            # $rutaHTML
            #
            # EL HTML QUEDA INTACTO.
            #
            # ====================================================
        }
    }
}


# ============================================================
# GUARDAR SOLO swiper-data.json
# ============================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "GUARDANDO swiper-data.json..." -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan


try {

    # Crear respaldo antes de modificar JSON

    $backup = Join-Path $ROOT "swiper-data-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"

    Copy-Item $JSON $backup -Force

    Write-Host ""
    Write-Host "Backup creado:" -ForegroundColor Green
    Write-Host $backup -ForegroundColor DarkGray


    # Convertir nuevamente a JSON

    $nuevoJSON = $datos |
        ConvertTo-Json -Depth 100


    # Guardar SOLO swiper-data.json

    [System.IO.File]::WriteAllText(
        $JSON,
        $nuevoJSON,
        [System.Text.UTF8Encoding]::new($false)
    )


    Write-Host ""
    Write-Host "swiper-data.json actualizado correctamente." -ForegroundColor Green

}
catch {

    Write-Host ""
    Write-Host "ERROR GUARDANDO swiper-data.json" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}


# ============================================================
# REPORTE
# ============================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "       SINCRONIZACION TERMINADA" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Elementos procesados : $procesados"
Write-Host "Paginas encontradas  : $encontrados"
Write-Host "HTML no encontrados  : $noEncontrados"

Write-Host ""

Write-Host "Posters encontrados       : $posters"
Write-Host "Backdrops encontrados     : $backdrops"
Write-Host "Logos encontrados         : $logos"
Write-Host "Descripciones encontradas : $descripciones"
Write-Host "Metas encontradas         : $metas"

Write-Host ""

Write-Host "HTML MODIFICADOS : 0" -ForegroundColor Green
Write-Host "JSON MODIFICADO  : swiper-data.json" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "              FIN DEL PROCESO" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""