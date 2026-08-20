/* =========================================================
   DIGITAL KNIGHT — SCRIPT DISEÑO NUEVO (2025)
   Funcionalidad mejorada para el nuevo diseño visual
============================================================ */

import { supabase } from './js/supabaseClient.js';

/* Variables globales — mismas que el original */
const swiperInstances = {};
const tabs = document.querySelectorAll('.tab');
const sections = document.querySelectorAll('.mySwiper');
const overlay = document.getElementById('transitionOverlay');
const sectionContents = document.querySelectorAll('.section-content');
const header = document.querySelector('.dk-header');
const tabsContainer = document.querySelector('.tabs');
const footer = document.querySelector('.footer');

const SELECTORES_CARRUSEL = [
    '.scroll-container', '.scrollable',
    '.horizontal-scroll-container', '.genre-scroll',
    '.mexicanas-scroll-container', '.upcoming-scroll'
];

/* =========================================================
   PANTALLA DE APERTURA
============================================================ */
(function initOpening() {
    const intro = document.getElementById('opening');
    if (!intro) return;
    if (sessionStorage.getItem("intro_shown")) {
        setTimeout(() => {
            intro.classList.add("fade-out");
            setTimeout(() => intro.remove(), 1200);
        }, 500);
    }
})();

/* =========================================================
   HEADER & TABS — Ocultar al hacer scroll hacia abajo
============================================================ */
(function initScrollHide() {
    let lastScroll = 0;
    const onScroll = () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > lastScroll && currentScroll > 80) {
            header?.classList.add('hidden');
            tabsContainer?.classList.add('hidden');
        } else {
            header?.classList.remove('hidden');
            tabsContainer?.classList.remove('hidden');
        }
        lastScroll = currentScroll;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('orientationchange', () => {
        setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    });
})();

/* Oculta footer al hacer scroll */
(function initFooterHide() {
    if (!footer) return;
    let lastScrollBottom = 0;
    const onScroll = () => {
        const currentScroll = window.scrollY;
        if (currentScroll > lastScrollBottom) {
            footer.classList.add('hidden');


/* =========================================================
   TABS — Navegación con overlay
============================================================ */

// Oculta los swipers que no son "inicio" al cargar
sections.forEach(swiperEl => {
    if (swiperEl.id !== 'inicio') {
        swiperEl.style.display = 'none';
    }
});

let lastTabId = null;

/* --- Función central para activar tab con overlay --- */
async function activateTab(targetId, options = {}) {
    const { skipScroll = false, skipOverlay = false } = options;

    if (!skipOverlay) {
        overlay.classList.remove('hidden');
        overlay.classList.add('show');
    }

    setTimeout(() => {
        // Activar tab visualmente
        tabs.forEach(t => t.classList.remove('active'));
        const targetTab = document.querySelector(`.tab[data-tab="${targetId}"]`);
        if (targetTab) targetTab.classList.add('active');

        // Ocultar todos los swipers
        sections.forEach(sec => {
            sec.style.display = 'none';
            const inst = swiperInstances[sec.id];
            if (inst) inst.autoplay.stop();
        });

        // Mostrar swiper correspondiente
        const targetSwiperEl = document.getElementById(targetId);
        if (targetSwiperEl) {
            targetSwiperEl.style.display = 'block';
            if (!swiperInstances[targetId]) {
                swiperInstances[targetId] = createSwiper(targetSwiperEl);
            }
            const swiper = swiperInstances[targetId];
            if (swiper) {
                swiper.slideTo(0, 0, false);
                swiper.update(); swiper.updateSize();
                swiper.updateSlides(); swiper.updateProgress();
                swiper.params.autoplay.delay = 7000;
                swiper.autoplay.start();
            }
            updateBackground(targetSwiperEl);
        }

        // Mostrar sección de contenido
        sectionContents.forEach(sectionContent => {
            sectionContent.style.display =
                sectionContent.dataset.section === targetId ? 'block' : 'none';
        });

        // Scroll suave hacia la tab
        if (!skipScroll && targetTab) {
            targetTab.scrollIntoView({
                behavior: 'smooth', inline: 'center', block: 'nearest'
            });
        }

        // Ocultar overlay


/* =========================================================
   CARGA DE DATOS DEL SWIPER DESDE JSON
============================================================ */
async function cargarSwiperInicio() {
    console.log("🔵 Cargando swiper-data.json...");
    try {
        const respuesta = await fetch('swiper-data.json');
        if (!respuesta.ok) throw new Error('No se pudo cargar swiper-data.json');
        const datos = await respuesta.json();
        console.log("🟢 JSON cargado:", datos);

        /* --- Selección inteligente de conjunto --- */
        const nombresConjuntos = Object.keys(datos);
        const STORAGE_CONJUNTO = 'dk_swiper_conjunto';
        const STORAGE_TIEMPO = 'dk_swiper_conjunto_time';
        const TREINTA_MINUTOS = 30 * 60 * 1000;
        const ahora = Date.now();

        let conjuntoElegido = localStorage.getItem(STORAGE_CONJUNTO);
        const tiempoGuardado = parseInt(localStorage.getItem(STORAGE_TIEMPO) || '0', 10);

        /* Buscar conjuntos con estreno */
        const conjuntosConEstreno = [];
        nombresConjuntos.forEach(nombreConjunto => {
            const c = datos[nombreConjunto];
            if (!c) return;
            let tiene = false;
            Object.keys(c).forEach(sid => {
                (c[sid] || []).forEach(item => { if (item.estreno) tiene = true; });
            });
            if (tiene) conjuntosConEstreno.push(nombreConjunto);
        });

        let conjuntoValido = false;
        if (conjuntoElegido && nombresConjuntos.includes(conjuntoElegido)) {
            if (conjuntosConEstreno.length === 0 &&
                tiempoGuardado && (ahora - tiempoGuardado < TREINTA_MINUTOS)) {
                conjuntoValido = true;
            } else if (conjuntosConEstreno.length > 0) {
                conjuntoValido = true;
            }
        }

        if (!conjuntoValido) {
            conjuntoElegido = conjuntosConEstreno.length > 0
                ? conjuntosConEstreno[Math.floor(Math.random() * conjuntosConEstreno.length)]
                : nombresConjuntos[Math.floor(Math.random() * nombresConjuntos.length)];
            localStorage.setItem(STORAGE_CONJUNTO, conjuntoElegido);
            localStorage.setItem(STORAGE_TIEMPO, ahora.toString());
        }

        if (!conjuntoElegido || !nombresConjuntos.includes(conjuntoElegido)) {
            conjuntoElegido = nombresConjuntos[0];
            localStorage.setItem(STORAGE_CONJUNTO, conjuntoElegido);
            localStorage.setItem(STORAGE_TIEMPO, ahora.toString());
        }

        const conjunto = datos[conjuntoElegido];

        /* Cargar las secciones del conjunto elegido */
        Object.keys(conjunto).forEach(sectionId => {
            const wrapper = document.querySelector(`#${sectionId} .swiper-wrapper`);
            if (!wrapper) return;
            wrapper.innerHTML = '';

            conjunto[sectionId].forEach(item => {
                const slide = document.createElement('div');
                slide.className = 'swiper-slide';

                if (item.poster) slide.style.setProperty('--bg', `url("${item.poster}")`);
                if (item.backdrop) {
                    slide.style.setProperty('--bg-land', `url("${item.backdrop}")`);
                } else if (item.poster) {
                    slide.style.setProperty('--bg-land', `url("${item.poster}")`);
                }

                slide.innerHTML = `
                    <div class="slide-overlay-top"></div>
                    <div class="overlay"></div>
                    <div class="content">
                        <div class="title">
                            ${item.logo
                                ? `<img src="${item.logo}" alt="${item.titulo}" class="title-logo ${item.logoClass || ''}" loading="eager">`
                                : `<div class="swiper-title-fallback">${item.titulo}</div>`
                            }
                        </div>
                        <div class="meta">
                            ${item.estreno ? '<span class="badge-estreno">Estreno</span>' : ''}
                            ${item.meta || ''}
                        </div>
                        <div class="description">${item.descripcion || ''}</div>
                        <div class="button-wrapper">
                            <a href="${item.archivo}" class="cta-button swiper-content-link"
                               onclick="event.stopPropagation();">
                                Ir a ${item.tipo === 'movie' ? 'la película' : 'la serie'}
                            </a>
                        </div>
                    </div>
                `;

                if (slide.querySelector('.title-logo')) {
                    const logo = slide.querySelector('.title-logo');
                    const ajustar = () => {
                        const p = logo.naturalWidth / logo.naturalHeight;
                        if (p < 0.75) logo.classList.add('logo-auto-vertical');
                        else if (p <= 1.25) logo.classList.add('logo-auto-square');
                        else logo.classList.add('logo-auto-horizontal');
                    };
                    if (logo.complete) ajustar();
                    else logo.addEventListener('load', ajustar, { once: true });
                }

                slide.addEventListener('click', function(e) {


/* =========================================================
   CREAR SWIPER
============================================================ */
function createSwiper(swiperEl) {
    return new Swiper(swiperEl, {
        loop: false, slidesPerView: 1,
        resistance: false, resistanceRatio: 0,
        speed: 700, effect: 'fade',
        fadeEffect: { crossFade: true },
        touchRatio: 1, touchAngle: 45, threshold: 5,
        followFinger: true, longSwipes: true,
        longSwipesRatio: 0.15, longSwipesMs: 200,
        shortSwipes: true, allowTouchMove: true,
        autoplay: { delay: 7000, disableOnInteraction: false, stopOnLastSlide: true },
        navigation: {
            nextEl: swiperEl.querySelector('.swiper-button-next'),
            prevEl: swiperEl.querySelector('.swiper-button-prev')
        },
        pagination: {
            el: swiperEl.querySelector('.swiper-pagination'),
            clickable: true
        },
        observer: true, observeParents: true,
        watchSlidesProgress: true,
        on: {
            init(s) {
                updateBackground(swiperEl);
                if (swiperEl.id !== 'inicio' && s.slides.length > 1) {
                    s.slideTo(Math.floor(Math.random() * s.slides.length), 0, false);
                }
                console.log(`🟢 Swiper inicializado: ${swiperEl.id}`);
            },
            slideChangeTransitionStart() { updateBackground(swiperEl); },
            reachEnd() {
                if (swiper.autoplay) swiper.autoplay.stop();
            }
        }
    });
}

/* =========================================================
   ACTUALIZAR FONDO SEGÚN SLIDE ACTIVO
============================================================ */
function updateBackground(swiperEl) {
    const activeSlide = swiperEl.querySelector('.swiper-slide-active');
    if (!activeSlide) return;
    const isLandscape = window.matchMedia("(orientation: landscape)").matches;
    const bg = isLandscape
        ? activeSlide.style.getPropertyValue('--bg-land')
        : activeSlide.style.getPropertyValue('--bg');
    if (!bg) return;
    document.body.style.backgroundImage = bg;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
}

/* --- Cambio de orientación y resize --- */
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        const sw = document.querySelector('.mySwiper[style*="display: block"]');
        if (sw) updateBackground(sw);
    }, 300);
});

window.addEventListener('resize', () => {
    clearTimeout(window._dkResizeTimer);
    window._dkResizeTimer = setTimeout(() => {
        const sw = document.querySelector('.mySwiper[style*="display: block"]');
        if (sw) updateBackground(sw);
    }, 200);
});
                    if (e.target.closest('.cta-button')) return;
                    e.preventDefault(); e.stopPropagation();
                    window.location.assign(item.archivo);
                });
                wrapper.appendChild(slide);
            });
            console.log(`🟢 ${sectionId}: ${conjunto[sectionId].length} slides`);
        });
        return true;
    } catch (error) {
        console.error('🔴 Error cargando swiper-data.json:', error);
        return false;
    }
}
        if (!skipOverlay) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.classList.add('hidden'), 400);
        }

        lastTabId = targetId;

        const cleanHash = targetId === 'inicio' ? '' : `#${targetId}`;
        history.replaceState(null, '', cleanHash);
    }, skipOverlay ? 0 : 200);
}

// Click en tabs (evento pasivo)
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetId = tab.dataset.tab;
        if (targetId === lastTabId) return;
        activateTab(targetId);
    }, { passive: true });
});

// Cargar página → ir a "inicio"
window.addEventListener('DOMContentLoaded', () => {


/* =========================================================
   CONTINUAR VIENDO
============================================================ */
let continueWatchingSection = document.querySelector('.movie-section.continue-watching');
let container = document.getElementById('continueWatchingContainer');
if (continueWatchingSection) continueWatchingSection.style.display = 'none';

function normalizeKey(item) {
    if (item.key) return item.key;
    if (item.data?.videoUrl && item.data?.seriesId)
        return `continue_${item.data.seriesId}_${item.data.videoUrl}`;
    if (item.data?.link) return item.data.link;
    return Math.random().toString();
}

function loadContinueWatchingLocal() {
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const d = JSON.parse(raw);
            if (!d || typeof d !== 'object') continue;
            if (key.startsWith('movie_')) {
                if (typeof d.progress === 'number' && typeof d.duration === 'number'
                    && d.progress < d.duration * 0.9)
                    items.push({ key, data: d, type: 'movie' });
            }
            if (key.startsWith('continue_')) {
                const prog = parseFloat(localStorage
                    .getItem(`progress_${d.seriesId}_${d.videoUrl}`)) || 0;
                const dur = parseFloat(localStorage
                    .getItem(`duration_${d.seriesId}_${d.videoUrl}`)) || d.duration || 1;
                if (prog < dur * 0.9) {
                    d.progress = prog; d.duration = dur;
                    items.push({ key, data: d, type: 'series' });
                }
            }
        } catch (e) { console.warn("Skip:", key); }
    }
    return items;
}

async function loadContinueWatchingFromSupabase() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        const { data, error } = await supabase
            .from('progresos').select('*')
            .eq('id', user.id)
            .order('visto_en', { ascending: false });
        if (error) { console.error(error); return []; }
        return data.map(item => ({
            key: `continue_${item.series_id}_${item.video_url}`,
            data: {
                seriesTitle: item.series_id, episodeTitle: item.episodio,
                poster: item.poster || '', link: item.link || '',
                progress: item.progreso || 0, duration: item.duration || 1,
                videoUrl: item.video_url || ''
            }, type: 'series'
        }));
    } catch (e) { console.error("Supabase:", e); return []; }
}
    activateTab('inicio', { skipScroll: true, skipOverlay: true });
});

// Atrás/Adelante del navegador
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1);
    if (hash && hash !== lastTabId) {
        activateTab(hash, { skipOverlay: true });
    }
});
        } else {
            footer.classList.remove('hidden');
        }
        lastScrollBottom = currentScroll;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
})();
