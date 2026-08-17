
# ============================================================
#       SINCRONIZADOR DE SWIPERS V6
#       HTML -> swiper-data.json
#
#       NUEVO:
#       - Detecta .badge-estreno en el HTML
#       - Guarda estreno: true en swiper-data.json
#       - Si se elimina el badge del HTML, elimina estreno
#       - Los estrenos tienen prioridad dentro de su lista
#
#       IMPORTANTE:
#       - NUNCA modifica archivos HTML
#       - swiper-data.json es el UNICO archivo que se modifica
# ============================================================

$ErrorActionPreference = "SilentlyContinue"

$ROOT = "G:\digital-knight-v2"
$WWW  = Join-Path $ROOT "www"
$JSON = Join-Path $WWW "swiper-data.json"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "       SINCRONIZADOR DE SWIPERS V6" -ForegroundColor Cyan
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
# BUSCAR PAGINA HTML
# ============================================================

function Buscar-PaginaHTML {

    param(
        [string]$TituloJSON,
        [string]$ArchivoJSON
    )

    # ========================================================
    # 1. RUTA EXACTA DEL JSON
    # ========================================================

    if (-not [string]::IsNullOrWhiteSpace($ArchivoJSON)) {

        $rutaRelativa = $ArchivoJSON -replace '/', '\'
        $rutaExacta = Join-Path $WWW $rutaRelativa

        if (Test-Path $rutaExacta -PathType Leaf) {

            Write-Host "  Ruta exacta encontrada." -ForegroundColor Green

            return $rutaExacta
        }
    }


    # ========================================================
    # 2. BUSQUEDA POR <TITLE>
    # ========================================================

    if ([string]::IsNullOrWhiteSpace($TituloJSON)) {
        return $null
    }

    $tituloNormalizado = Normalizar-Texto $TituloJSON

    if ([string]::IsNullOrWhiteSpace($tituloNormalizado)) {
        return $null
    }

    Write-Host "  Ruta no encontrada. Buscando por <title>..." -ForegroundColor Yellow
    Write-Host "  Titulo buscado: $TituloJSON" -ForegroundColor DarkGray


    $archivosHTML = Get-ChildItem `
        -Path $WWW `
        -Filter "*.html" `
        -File `
        -Recurse `
        -ErrorAction SilentlyContinue


    foreach ($archivoHTML in $archivosHTML) {

        try {

            $contenidoHTML = Get-Content `
                $archivoHTML.FullName `
                -Raw `
                -Encoding UTF8 `
                -ErrorAction Stop

        }
        catch {
            continue
        }

        if ([string]::IsNullOrWhiteSpace($contenidoHTML)) {
            continue
        }

        $tituloHTML = Obtener-TituloHTML $contenidoHTML

        if ([string]::IsNullOrWhiteSpace($tituloHTML)) {
            continue
        }

        $tituloHTMLNormalizado = Normalizar-Texto $tituloHTML


        if ($tituloHTMLNormalizado -eq $tituloNormalizado) {

            Write-Host "  ENCONTRADO POR <title>:" -ForegroundColor Green
            Write-Host "  $($archivoHTML.FullName)" -ForegroundColor Green
            Write-Host "  <title>: $tituloHTML" -ForegroundColor DarkGray

            return $archivoHTML.FullName
        }
    }

    Write-Host "  No se encontro ninguna pagina por <title>." -ForegroundColor Red

    return $null
}


# ============================================================
# POSTER
# ============================================================

function Obtener-Poster {

    param([string]$Contenido)

    if (
        $Contenido -match
        '(?is)\.cover\s*\{.*?background\s*:\s*.*?url\(\s*["'']([^"'']+)["'']\s*\)'
    ) {

        return $matches[1].Trim()
    }

    return ""
}


# ============================================================
# BACKDROP
# ============================================================

function Obtener-Backdrop {

    param([string]$Contenido)

    if (
        $Contenido -match
        '(?is)\.cover-landscape\s*\{.*?background\s*:\s*.*?url\(\s*["'']([^"'']+)["'']\s*\)'
    ) {

        return $matches[1].Trim()
    }

    return ""
}


# ============================================================
# LOGO
# ============================================================

function Obtener-Logo {

    param([string]$Contenido)

    if (
        $Contenido -match
        '(?is)<div[^>]*class\s*=\s*["''][^"'']*\bcover-content\b[^"'']*["''][^>]*>(.*?)</div>'
    ) {

        $coverContent = $matches[1]

        if (
            $coverContent -match
            '(?is)<img[^>]*class\s*=\s*["''][^"'']*\blogo\b[^"'']*["''][^>]*src\s*=\s*["'']([^"'']+)["'']'
        ) {

            return $matches[1].Trim()
        }

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
# ============================================================

function Obtener-Meta {

    param([string]$Contenido)

    if (
        $Contenido -match
        '(?is)<div[^>]*class\s*=\s*["''][^"'']*\bmeta\b[^"'']*["''][^>]*>\s*(.*?)\s*</div>'
    ) {

        $meta = $matches[1]

        $meta = $meta -replace '(?is)<span[^>]*class\s*=\s*["''][^"'']*\bbadge-estreno\b[^"'']*["''][^>]*>.*?</span>', ''

        $meta = $meta -replace '<[^>]+>', ' '

        $meta = [System.Net.WebUtility]::HtmlDecode($meta)

        $meta = $meta -replace '[\u00A0\u2007\u202F]', ' '

        $meta = $meta -replace '(?i)\s*Dob\s+Lat\s*$', ''

        $meta = $meta -replace '(?i)\s+(Dob|Lat)\s*$', ''

        $meta = $meta -replace '\s+', ' '
        $meta = $meta.Trim()

        if ([string]::IsNullOrWhiteSpace($meta)) {
            return ""
        }


        # ====================================================
        # SERIE
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


        return $meta
    }

    return ""
}


# ============================================================
# NUEVO: DETECTAR ESTRENO
#
# El HTML es la fuente.
#
# Detecta:
#
# <span class="badge-estreno">Estreno</span>
#
# También funciona si la clase tiene otras clases:
#
# class="algo badge-estreno otra-clase"
#
# Si existe:
#     estreno = true
#
# Si NO existe:
#     estreno se elimina del JSON.
# ============================================================

function Obtener-Estreno {

    param([string]$Contenido)

    if (
        $Contenido -match
        '(?is)class\s*=\s*["''][^"'']*\bbadge-estreno\b[^"'']*["'']'
    ) {

        return $true
    }

    return $false
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

$estrenos = 0
$estrenosQuitados = 0


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
            # LOCALIZAR HTML
            # ====================================================

            $rutaHTML = Buscar-PaginaHTML `
                -TituloJSON $tituloJSON `
                -ArchivoJSON $archivoJSON


            Write-Host ""
            Write-Host "--------------------------------------------" -ForegroundColor DarkGray
            Write-Host "TITULO : $tituloJSON" -ForegroundColor Cyan
            Write-Host "RUTA   : $archivoJSON" -ForegroundColor DarkGray


            if ([string]::IsNullOrWhiteSpace($rutaHTML)) {

                Write-Host "NO ENCONTRADO" -ForegroundColor Red
                Write-Host "  No se pudo localizar la pagina." -ForegroundColor Red

                $noEncontrados++

                continue
            }


            # ====================================================
            # LEER HTML
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

            $estrenoHTML = Obtener-Estreno $contenido


            # ====================================================
            # MOSTRAR LO ENCONTRADO
            # ====================================================

            Write-Host "ENCONTRADO" -ForegroundColor Green


            # ====================================================
            # POSTER
            # ====================================================

            if ($posterHTML) {

                Write-Host "  Poster       : OK" -ForegroundColor Green

                $item.poster = $posterHTML

                $posters++
            }
            else {

                Write-Host "  Poster       : NO" -ForegroundColor DarkYellow
            }


            # ====================================================
            # BACKDROP
            # ====================================================

            if ($backdropHTML) {

                Write-Host "  Backdrop     : OK" -ForegroundColor Green

                $item.backdrop = $backdropHTML

                $backdrops++
            }
            else {

                Write-Host "  Backdrop     : NO" -ForegroundColor DarkYellow
            }


            # ====================================================
            # LOGO
            # ====================================================

            if ($logoHTML) {

                Write-Host "  Logo         : OK" -ForegroundColor Green

                $item.logo = $logoHTML

                $logos++
            }
            else {

                Write-Host "  Logo         : NO" -ForegroundColor DarkYellow
            }


            # ====================================================
            # DESCRIPCION
            # ====================================================

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
            # ESTRENO
            # ====================================================

            if ($estrenoHTML) {

                Write-Host "  ESTRENO      : SI" -ForegroundColor Magenta

                # Se crea/actualiza la propiedad
                $item | Add-Member `
                    -MemberType NoteProperty `
                    -Name "estreno" `
                    -Value $true `
                    -Force

                $estrenos++

            }
            else {

                Write-Host "  ESTRENO      : NO" -ForegroundColor DarkGray

                # Si antes era estreno, se elimina.
                # Esto hace que el badge NO permanezca para siempre.
                if ($item.PSObject.Properties.Name -contains "estreno") {

                    $item.PSObject.Properties.Remove("estreno")

                    $estrenosQuitados++
                }
            }
        }
    }
}


# ============================================================
# PRIORIDAD DE ESTRENOS
#
# Los elementos con:
#
#     "estreno": true
#
# se colocan primero dentro de CADA LISTA.
#
# NO se mezclan conjuntos.
# NO se modifican otras listas.
# ============================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "APLICANDO PRIORIDAD DE ESTRENOS..." -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan


foreach ($prop in $datos.PSObject.Properties) {

    $listas = $prop.Value

    if ($null -eq $listas) {
        continue
    }

    foreach ($listaProp in $listas.PSObject.Properties) {

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


        # Convertimos temporalmente a array
        $itemsArray = @($lista)


        # Si no hay elementos, continuar
        if ($itemsArray.Count -eq 0) {
            continue
        }


        # ====================================================
        # IMPORTANTE:
        #
        # Estrenos primero.
        # El resto conserva su orden relativo.
        # ====================================================

        $ordenados = @(
            $itemsArray | Where-Object {
                $_.PSObject.Properties.Name -contains "estreno" -and
                $_.estreno -eq $true
            }
        )

        $normales = @(
            $itemsArray | Where-Object {
                -not (
                    $_.PSObject.Properties.Name -contains "estreno" -and
                    $_.estreno -eq $true
                )
            }
        )


        $nuevoOrden = @($ordenados + $normales)


        # ====================================================
        # REEMPLAZAR CONTENIDO DE LA LISTA
        # ====================================================

        $listaProp.Value = $nuevoOrden
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

    $backup = Join-Path `
        $ROOT `
        "swiper-data-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"


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

Write-Host "Estrenos detectados       : $estrenos" -ForegroundColor Magenta
Write-Host "Estrenos quitados         : $estrenosQuitados" -ForegroundColor Yellow

Write-Host ""

Write-Host "HTML MODIFICADOS : 0" -ForegroundColor Green
Write-Host "JSON MODIFICADO  : swiper-data.json" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "              FIN DEL PROCESO" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

