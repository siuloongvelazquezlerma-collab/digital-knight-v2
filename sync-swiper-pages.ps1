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
$metasEncontradas = 0
$archivoActualizados = 0
$titulosActualizados = 0

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

function Convertir-AClaveArchivo {
    param([string]$Texto)

    if ([string]::IsNullOrWhiteSpace($Texto)) {
        return ""
    }

    $sinAcentos = $Texto.Normalize([System.Text.NormalizationForm]::FormD) `
        -replace '\p{Mn}', ''

    return ($sinAcentos.ToLowerInvariant() -replace '[^a-z0-9]+', '-').Trim('-')
}

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

            # Tras sincronizar, titulo y el archivo tienen el mismo nombre
            # base. Esto permite recuperar una página aunque archivo tenga una
            # ruta antigua o se haya movido de carpeta.
            if (-not $archivoEncontrado -and -not [string]::IsNullOrWhiteSpace([string]$item.titulo)) {

                $nombrePorTitulo = ([string]$item.titulo).Trim()

                if ($nombrePorTitulo -notmatch '(?i)\.html$') {
                    $nombrePorTitulo += ".html"
                }

                $archivoEncontrado = $todosLosHtml |
                    Where-Object {
                        $_.Name -ieq $nombrePorTitulo
                    } |
                    Select-Object -First 1

                if ($archivoEncontrado) {
                    Write-Host "    HTML encontrado por TITULO: $nombrePorTitulo" -ForegroundColor DarkYellow
                }
            }

            # Último recurso: título correcto, pero archivo guardado con otro
            # nombre. Se busca solo este título (no se recorren todos los HTML
            # en memoria) y se exige coincidencia única.
            if (-not $archivoEncontrado) {

                $tituloBuscado = ([string]$item.titulo).Trim()

                $rutasPorTitulo = @()

                if ($tituloBuscado -and (Get-Command rg -ErrorAction SilentlyContinue)) {

                    $patronTitulo = '<title\b[^>]*>\s*' +
                        [regex]::Escape($tituloBuscado) +
                        '\s*</title>'

                    $rutasPorTitulo = @(
                        & rg --files-with-matches --ignore-case --glob "*.html" `
                            -- $patronTitulo $ProjectRoot 2>$null
                    )
                }

                # WALL·E y wall-e son el mismo nombre para buscar; la ruta
                # guardada sigue saliendo del href exacto de la página.
                if ($rutasPorTitulo.Count -eq 0 -and $tituloBuscado) {

                    $claveBuscada = Convertir-AClaveArchivo $tituloBuscado

                    if ($claveBuscada) {
                        $rutasPorTitulo = @(
                            $todosLosHtml | Where-Object {
                                (Convertir-AClaveArchivo (
                                    [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
                                )) -ceq $claveBuscada
                            } | Select-Object -ExpandProperty FullName
                        )
                    }
                }

                if ($rutasPorTitulo.Count -eq 1) {
                    $archivoEncontrado = Get-Item -LiteralPath $rutasPorTitulo[0]
                    Write-Host "    HTML encontrado por titulo: $($archivoEncontrado.Name)" -ForegroundColor DarkYellow
                }
                elseif ($rutasPorTitulo.Count -gt 1) {
                    Write-Host "    TITULO ambiguo; se omite: $($item.titulo)" -ForegroundColor Yellow
                }
            }

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

                # favoritoEnlace contiene el nombre real del archivo. Los
                # parámetros y anclas no deben guardarse en swiper-data.json.
                $href = $hrefMatch.Groups[1].Value.Trim() -replace '[?#].*$', ''

                # =================================================
                # RESOLVER RUTA REAL SIN GetRelativePath
                # =================================================

                $projectRootNormalizado = $ProjectRoot.TrimEnd("\","/")
                $esEnlaceLocal = $href -and
                    $href -notmatch '^(?i:https?:|//|mailto:|tel:|javascript:)'

                if ($esEnlaceLocal) {

                    # Resuelve también ../series/serie.html sin dejar ../
                    # dentro de la ruta que se guarda en el JSON.
                    if ($href.StartsWith("/")) {
                        $rutaDestino = Join-Path $ProjectRoot $href.TrimStart("/", "\")
                    }
                    else {
                        $rutaDestino = Join-Path (Split-Path $htmlPath -Parent) $href
                    }

                    $rutaDestino = [System.IO.Path]::GetFullPath($rutaDestino)

                    if ($rutaDestino.StartsWith(
                        $projectRootNormalizado + "\",
                        [System.StringComparison]::OrdinalIgnoreCase
                    )) {

                        $nuevoArchivo = $rutaDestino.Substring(
                            $projectRootNormalizado.Length
                        ).TrimStart("\", "/") -replace "\\", "/"

                        # -cne conserva también las mayúsculas reales de la
                        # carpeta; esto evita enlaces rotos en servidores Linux.
                        if ($item.archivo -cne $nuevoArchivo) {
                            $item.archivo = $nuevoArchivo
                            $archivoActualizados++
                        }

                        # El generador puede dar un título distinto al nombre
                        # guardado. Usamos el href para que ambos queden ligados
                        # al mismo archivo: SMALLVILLEnew.html -> SMALLVILLEnew.
                        $nuevoTitulo = [System.IO.Path]::GetFileNameWithoutExtension(
                            [System.IO.Path]::GetFileName($href.Replace("/", "\"))
                        )

                        # -cne distingue mayúsculas/minúsculas: el título debe
                        # quedar exactamente igual al nombre del archivo.
                        if ($nuevoTitulo -and $item.titulo -cne $nuevoTitulo) {
                            $item.titulo = $nuevoTitulo
                            $titulosActualizados++
                        }

                        Write-Host "    ARCHIVO: $nuevoArchivo" -ForegroundColor Green
                        Write-Host "    TITULO: $nuevoTitulo" -ForegroundColor Green
                    }
                    else {
                        Write-Host "    ARCHIVO fuera de www; se omite: $href" -ForegroundColor Yellow
                    }
                }
                else {
                    Write-Host "    ARCHIVO no es un enlace local; se omite: $href" -ForegroundColor Yellow
                }
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
            # META
            # =================================================

            $meta = ""

            $metaMatch = [regex]::Match(
                $html,
                '(?is)<(?:div|span)\b[^>]*\bclass\s*=\s*["''][^"'']*\bmeta\b[^"'']*["''][^>]*>(.*?)</(?:div|span)>'
            )

            if ($metaMatch.Success) {

                $meta = [regex]::Replace($metaMatch.Groups[1].Value, '(?is)<[^>]+>', '')
                $meta = [regex]::Replace($meta, '\s+', ' ').Trim()
            }

            if ($meta) {

                $item.meta = $meta
                $metasEncontradas++

                Write-Host "    META: $meta" -ForegroundColor Green
            }
            else {

                Write-Host "    META no encontrada" -ForegroundColor Yellow
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
# COMPROBAR MI_LISTA
# =========================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "      COMPROBACION DE MI_LISTA" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow

if ($json.conjunto3 -and $json.conjunto3.mi_lista) {

    Write-Host "OK: conjunto3.mi_lista EXISTE" -ForegroundColor Green
    Write-Host "Elementos en mi_lista: $($json.conjunto3.mi_lista.Count)" -ForegroundColor Green

    foreach ($itemLista in $json.conjunto3.mi_lista) {
        Write-Host "  - $($itemLista.titulo)" -ForegroundColor White
    }

}
else {

    Write-Host "ERROR: conjunto3.mi_lista NO EXISTE" -ForegroundColor Red

}

Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

# =========================================================
# GUARDAR JSON
# =========================================================

Write-Host ""
Write-Host "Guardando swiper-data.json..." -ForegroundColor Cyan

try {

    $jsonFinal = $json | ConvertTo-Json -Depth 50

    if ($jsonFinal -match '"mi_lista"') {
    Write-Host "OK: mi_lista ESTA PRESENTE EN EL JSON FINAL" -ForegroundColor Green
}
else {
    Write-Host "ERROR: mi_lista NO ESTA EN EL JSON FINAL" -ForegroundColor Red
}

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
Write-Host "Archivos actualizados     : $archivoActualizados" -ForegroundColor Green
Write-Host "Títulos actualizados      : $titulosActualizados" -ForegroundColor Green
Write-Host ""
Write-Host "Posters encontrados       : $posterEncontrados" -ForegroundColor Green
Write-Host "Backdrops encontrados     : $backdropEncontrados" -ForegroundColor Green
Write-Host "Logos encontrados         : $logoEncontrados" -ForegroundColor Green
Write-Host "Metas encontradas         : $metasEncontradas" -ForegroundColor Green
Write-Host "Descripciones encontradas : $descripcionEncontradas" -ForegroundColor Green

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "      SINCRONIZACION TERMINADA" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
