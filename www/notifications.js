/* ================= NOTIFICACIONES ================= */

const STORAGE_KEY = "notifications_data";
const CLEARED_KEY = "notifications_cleared";
const VERSION_KEY = "notifications_version";
const NOTIFICATIONS_VERSION = "2.1";

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
  href: "peliculas/scary-movie-3.html",
  img: "https://image.tmdb.org/t/p/original/psOEFCvuz6JOc1ZzZNml9bDHh2v.jpg",
  title: "Nueva comedia agregada",
  text: "Scary Movie 3 ya está disponible. Prepárate para risas, parodias y caos total en la app.",
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

