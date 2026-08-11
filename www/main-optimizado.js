/* =========================================================
   DIGITAL KNIGHT — OPTIMIZADOR DE IMÁGENES TMDB
   Optimización agresiva pero segura
========================================================= */

(() => {

    const TMDB_REGEX =
        /https?:\/\/(?:image\.tmdb\.org|www\.themoviedb\.org)\/t\/p\/original\//i;

    const isMobile =
        window.matchMedia('(max-width: 767px)').matches;


    /* =====================================================
       TAMAÑO TMDB
    ===================================================== */

    function getTmdbSize(img) {

        /* HERO / BANNER */

        if (
            img.closest(
                '.hero, .banner, .featured, .swiper'
            )
        ) {
            return isMobile ? 'w780' : 'w1280';
        }


        /* IMÁGENES GRANDES */

        if (
            img.closest('.movie-item')
        ) {
            return isMobile ? 'w300' : 'w500';
        }


        /* TARJETAS NORMALES */

        if (
            img.closest(
                '.continue-watching,' +
                '.top-10,' +
                '.card,' +
                '.scroll-container,' +
                '.scroll-wrapper,' +
                '.horizontal-scroll-container,' +
                '.movie-section,' +
                '.poster-wrapper,' +
                '.genre-scroll,' +
                '.mexicanas-scroll-container'
            )
        ) {
            return isMobile ? 'w185' : 'w300';
        }


        return isMobile ? 'w185' : 'w300';
    }


    /* =====================================================
       CONVERTIR URL TMDB
    ===================================================== */

    function optimizeUrl(url, size) {

        if (
            typeof url !== 'string' ||
            !TMDB_REGEX.test(url)
        ) {
            return url;
        }

        return url.replace(
            TMDB_REGEX,
            `https://image.tmdb.org/t/p/${size}/`
        );
    }


    /* =====================================================
       OPTIMIZAR IMAGEN
    ===================================================== */

    function optimizeImage(img, index = 999) {

        if (!(img instanceof HTMLImageElement)) {
            return;
        }

        if (img.dataset.dkOptimized === '1') {
    return;
}

img.dataset.dkOptimized = '1';

        const src =
    img.getAttribute('src') ||
    img.getAttribute('data-src') ||
    '';

const isOpenDrive =
    /opendrive\.com/i.test(src);

if (isOpenDrive) {

    const openDriveImages =
        document.querySelectorAll(
            'img[src*="opendrive"], img[data-src*="opendrive"]'
        );

    const openDriveIndex =
        Array.from(openDriveImages).indexOf(img);

    if (openDriveIndex === 0) {

        img.loading = 'eager';
        img.fetchPriority = 'high';

    } else {

        img.loading = 'lazy';
        img.fetchPriority = 'low';

    }

    img.decoding = 'async';

    return;
}


        const size =
            getTmdbSize(img);


        /* SRC */

        const srcActual =
    img.getAttribute('src');

if (srcActual) {

            const optimized =
    optimizeUrl(srcActual, size);

if (optimized !== srcActual) {

                img.setAttribute(
                    'src',
                    optimized
                );

            }

        }


        /* DATA-SRC */

        const dataSrc =
            img.getAttribute('data-src');

        if (dataSrc) {

            const optimized =
                optimizeUrl(
                    dataSrc,
                    size
                );

            if (optimized !== dataSrc) {

                img.setAttribute(
                    'data-src',
                    optimized
                );

            }

        }

        


        /* SRCSET */

        const srcset =
            img.getAttribute('srcset');

        if (srcset) {

            const optimized =
                srcset.replace(
                    /https?:\/\/(?:image\.tmdb\.org|www\.themoviedb\.org)\/t\/p\/original\//gi,
                    `https://image.tmdb.org/t/p/${size}/`
                );

            if (optimized !== srcset) {

                img.setAttribute(
                    'srcset',
                    optimized
                );

            }

        }


        /* =================================================
           LAZY LOADING
        ================================================= */

       


        const isHero =
    !!img.closest(
        '.hero, .banner, .featured, .swiper'
    );

const isFirstHero =
    isHero &&
    img.closest('.swiper, .hero, .banner, .featured')
        ?.querySelector('img') === img;


if (isFirstHero) {

    img.loading = 'eager';
    img.fetchPriority = 'high';

} else {

    img.loading = 'lazy';

}


        img.decoding = 'async';


/* Evitar que imágenes grandes bloqueen la carga */

if (!isHero) {

    img.loading = 'lazy';

}


/* Evita arrastres */

img.draggable = false;

    }


    /* =====================================================
       OPTIMIZAR IMÁGENES EXISTENTES
    ===================================================== */

    const images =
    document.querySelectorAll(
        'img[src], img[data-src], img[srcset]'
    );


requestAnimationFrame(() => {

    images.forEach(
        (img, index) => {

            optimizeImage(
                img,
                index
            );

        }
    );

});


    /* =====================================================
   BACKGROUNDS TMDB
===================================================== */

document
    .querySelectorAll('[style]')
    .forEach(element => {

        const style =
            element.getAttribute('style');

        if (!style || !TMDB_REGEX.test(style)) {
            return;
        }

        let size =
            isMobile
                ? 'w300'
                : 'w500';


        /* HERO / BANNER */

        if (
            element.closest(
                '.hero, .banner, .featured, .swiper'
            )
        ) {

            size =
                isMobile
                    ? 'w780'
                    : 'w1280';

        }


        /* SECCIONES GRANDES */

        else if (
            element.closest(
                '.special-section, .top-10'
            )
        ) {

            size =
                isMobile
                    ? 'w500'
                    : 'w780';

        }


        element.setAttribute(
            'style',
            optimizeUrl(
                style,
                size
            )
        );

    });


/* =====================================================
   DATA-BACKGROUNDS TMDB
===================================================== */

document
    .querySelectorAll(
        '[data-background], [data-bg], [data-background-image]'
    )
    .forEach(element => {

        const atributos = [
            'data-background',
            'data-bg',
            'data-background-image'
        ];


        atributos.forEach(atributo => {

            const value =
                element.getAttribute(atributo);

            if (!value || !TMDB_REGEX.test(value)) {
                return;
            }


            let size =
                isMobile
                    ? 'w500'
                    : 'w780';


            if (
                element.closest(
                    '.hero, .banner, .featured, .swiper'
                )
            ) {

                size =
                    isMobile
                        ? 'w780'
                        : 'w1280';

            }


            element.setAttribute(
                atributo,
                optimizeUrl(
                    value,
                    size
                )
            );

        });

    });


    /* =====================================================
       IMÁGENES QUE APAREZCAN DESPUÉS
    ===================================================== */

   const observer =
    new MutationObserver(
        mutations => {

            const imagesToOptimize = new Set();

            for (const mutation of mutations) {

                if (mutation.type !== 'childList') {
                    continue;
                }

                for (const node of mutation.addedNodes) {

                    if (node.nodeType !== 1) {
    continue;
}


/* =================================================
   BACKGROUNDS TMDB DINÁMICOS
================================================= */

/* =================================================
   BACKGROUNDS TMDB DINÁMICOS
================================================= */

const backgrounds = new Set();

/* El propio elemento */

if (
    node.matches?.(
        '[data-background], [data-bg], [data-background-image]'
    )
) {
    backgrounds.add(node);
}

/* Elementos dentro */

node
    .querySelectorAll?.(
        '[data-background], [data-bg], [data-background-image]'
    )
    .forEach(element => {

        backgrounds.add(element);

    });


/* Procesar backgrounds */

backgrounds.forEach(element => {

    const atributos = [
        'data-background',
        'data-bg',
        'data-background-image'
    ];

    atributos.forEach(atributo => {

        const value =
            element.getAttribute(atributo);

        if (
            value &&
            TMDB_REGEX.test(value)
        ) {

            const size =
                element.closest(
                    '.hero, .banner, .featured, .swiper'
                )
                    ? (
                        isMobile
                            ? 'w780'
                            : 'w1280'
                    )
                    : (
                        isMobile
                            ? 'w500'
                            : 'w780'
                    );

            element.setAttribute(
                atributo,
                optimizeUrl(
                    value,
                    size
                )
            );

        }

    });

});




/* Imagen agregada directamente */

if (node.tagName === 'IMG') {

    imagesToOptimize.add(node);

    continue;
}

                    /* Imagen agregada directamente */

                    if (node.tagName === 'IMG') {

                        imagesToOptimize.add(node);

                        continue;
                    }

                    /* Imágenes dentro del elemento */

                    const images =
    node.querySelectorAll?.(
        'img[src], img[data-src], img[srcset]'
    );

images?.forEach(img => {

    imagesToOptimize.add(img);

});

                }

            }

            /* Procesar una sola vez por imagen */

            if (imagesToOptimize.size) {

                requestAnimationFrame(() => {

                    imagesToOptimize.forEach(img => {

                        optimizeImage(img);

                    });

                });

            }

        }
    );


    observer.observe(
        document.body,
        {
            childList: true,
            subtree: true
        }
    );


})();