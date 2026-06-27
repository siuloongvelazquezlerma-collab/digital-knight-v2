/* ================= NOTIFICACIONES ================= */

const STORAGE_KEY = "notifications_data";
const CLEARED_KEY = "notifications_cleared";
const VERSION_KEY = "notifications_version";
const NOTIFICATIONS_VERSION = "2.3";

/* ================= ESTADO GLOBAL ================= */

// 🔥 AQUÍ estaba tu bug principal (faltaba esto)
let notifications =
  JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

/* ================= BADGE REUTILIZABLE ================= */

function updateNotificationBadge(id) {
  const badge = document.getElementById(id);
  if (!badge) return;

  const count =
    JSON.parse(localStorage.getItem(STORAGE_KEY))?.length || 0;

  badge.textContent = count;

  badge.style.display = count > 0 ? "flex" : "none";
}


/* ================= BADGE MENÚ (perfil) ================= */

function updateMenuNotificationBadge() {
  updateNotificationBadge("menuNotificationBadge");
}

/* ================= BADGE MAIN (campana) ================= */

function updateMainNotificationBadge() {
  updateNotificationBadge("notificationBadge");
}

/* ================= INICIALIZAR NOTIFICACIONES ================= */

function addNotification() {

  const savedVersion = localStorage.getItem(VERSION_KEY);

  if (savedVersion === NOTIFICATIONS_VERSION) return;

  notifications = [];

  notifications.push({
  href: "DC/supergirl.html",
  img: "https://image.tmdb.org/t/p/original/xOZPlGZfzwCgYEPevFK75SO957a.jpg",
  title: "🦸 Nueva película agregada",
  text: "Supergirl (2026) ya está disponible. Descubre el inicio de una nueva heroína en el universo DC.",
  seen: false
});

notifications.push({
  href: "peliculas/scary-movie-terrorificamente-incorrecta.html",
  img: "https://image.tmdb.org/t/p/original/9yhPMVzUXbKfMuW2Z8FDNeECDSh.jpg",
  title: "😂 Nueva comedia agregada",
  text: "Scary Movie: Terroríficamente incorrecta ya está disponible. Prepárate para una nueva ronda de parodias y humor absurdo.",
  seen: false
});

notifications.push({
  href: "peliculas/el-diablo-viste-a-la-moda-2.html",
  img: "https://image.tmdb.org/t/p/original/eBoGygGVWGBAENHILW33PFca4TT.jpg",
  title: "👠 Nuevo estreno agregado",
  text: "El diablo viste a la moda 2 ya llegó a Digital Knight. Miranda Priestly regresa con más estilo y exigencia que nunca.",
  seen: false
});

notifications.push({
  href: "Disney/toy-story-5.html",
  img: "https://image.tmdb.org/t/p/original/lRCpJxk94s6FdSlTstLk0rVoCDR.jpg",
  title: "🤠 Nueva aventura agregada",
  text: "Toy Story 5 ya está disponible. Woody, Buzz y sus amigos vuelven para una nueva aventura llena de emoción.",
  seen: false
});

notifications.push({
  href: "peliculas/amos-del-universo.html",
  img: "https://image.tmdb.org/t/p/original/pJYtvmKMXZVm2gz1DdgKuWTPF5r.jpg",
  title: "⚔️ Nueva película agregada",
  text: "Amos del Universo (2026) ya está disponible. He-Man regresa para enfrentar una nueva batalla por Eternia.",
  seen: false
});

  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  localStorage.setItem(VERSION_KEY, NOTIFICATIONS_VERSION);

  localStorage.removeItem(CLEARED_KEY);

  refreshUI();
}

/* ================= RENDER ================= */

function renderNotifications() {

  const container = document.getElementById("notificationsContainer");
  if (!container) return;

  container.innerHTML = "";

  if (notifications.length === 0) {
    const p = document.createElement("p");
    p.textContent =
      "No tienes ninguna notificación nueva. Te enviaremos una notificación cuando tengamos alguna novedad.";
    container.appendChild(p);
    return;
  }

  notifications.forEach((n, index) => {

    const a = document.createElement("a");
    a.className = `notification-item ${n.seen ? "seen" : "new"}`;
    a.href = n.href;

    a.innerHTML = `
      <img src="${n.img}" class="notification-image">
      <div class="notification-text">
        <h3>${n.title}</h3>
        <p>${n.text}</p>
      </div>
    `;

    a.addEventListener("click", () => {
      notifications[index].seen = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
      refreshUI();
    });

    container.appendChild(a);
  });
}

/* ================= LIMPIAR ================= */

function clearNotifications() {
  notifications = [];
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(CLEARED_KEY, "true");
  refreshUI();
}

/* ================= REFRESH GLOBAL ================= */

function refreshUI() {

  // 🔥 Sincronizar la variable global
  notifications =
    JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  updateMenuNotificationBadge();
  updateMainNotificationBadge();
  renderNotifications();
}

/* ================= INIT GLOBAL ================= */

function initNotifications() {
  addNotification();
  refreshUI();
}

