window.addEventListener('load', function () {
  const overlay = document.getElementById("overlay");
  const loader = document.getElementById('loader');

  // Se mantiene el loader visible por 1 segundo
setTimeout(() => {

    loader.style.opacity = '0';

    setTimeout(() => {

        loader.style.display = 'none';

        if (overlay) {
            overlay.classList.add('hidden');
        }

    }, 300);

}, 1000);
});



/* ================= DEFAULTS ================= */
const DEFAULT_AVATAR = 'avatar.jpg';
const DEFAULT_COVER = 'cover.jpg';
const DEFAULT_NAME = 'Usuario';

let selectedAvatar = null;
let selectedCover = null;
let lastView = 'profile-view';
let profileChanged = false;

/* ================= INIT ================= */
function initProfileDefaults() {
  if (!localStorage.getItem('profileAvatar')) {
    localStorage.setItem('profileAvatar', DEFAULT_AVATAR);
  }

  if (!localStorage.getItem('profileCover')) {
    localStorage.setItem('profileCover', DEFAULT_COVER);
  }

  if (!localStorage.getItem('profileName')) {
    localStorage.setItem('profileName', DEFAULT_NAME);
  }
}

function openView(id) {
  document.querySelectorAll('.view').forEach(v =>
    v.classList.remove('active')
  );

  const view = document.getElementById(id);
  if (view) {
    view.classList.add('active');
    lastView = id;
  }
}


/* ================= VISTAS ================= */
function showView(id) {
  document.querySelectorAll('.view').forEach(v =>
    v.classList.remove('active')
  );

  const view = document.getElementById(id);
  if (view) {
    view.classList.add('active');
    lastView = id;
  }
}





function openManageProfile() {
  syncPreviewData();
  showView('manage-profile-view');
}

function openAvatarEdit() {
  syncPreviewData();
  showView('edit-avatar-view');
}

function openCoverEdit() {
  syncPreviewData();
  showView('edit-cover-view');
}

function openProfileEdit() {
  syncPreviewData();
  showView('edit-profile-view');
}

function closeEdit() {
  if (
    lastView === 'edit-avatar-view' ||
    lastView === 'edit-cover-view' ||
    lastView === 'edit-profile-view'
  ) {
    showView('manage-profile-view');
  } else {
    showView('profile-view');
  }
}

/* ================= AVATAR ================= */
function selectAvatar(img) {
  document
    .querySelectorAll('#edit-avatar-view .avatar-grid img')
    .forEach(i => i.classList.remove('selected'));

  img.classList.add('selected');
  selectedAvatar = img.src;

  if (window.avatarPreview) avatarPreview.src = img.src;

  markProfileAsChanged();
}

async function saveAvatar() {
  const avatar =
    selectedAvatar ||
    localStorage.getItem('profileAvatar') ||
    DEFAULT_AVATAR;

  localStorage.setItem('profileAvatar', avatar);

  await window.saveProfileToSupabase();

  selectedAvatar = null;

  syncPreviewData();
  showView('manage-profile-view');
}

/* ================= FONDO ================= */
function selectCover(img) {
  document
    .querySelectorAll('#edit-cover-view .avatar-grid img')
    .forEach(i => i.classList.remove('selected'));

  img.classList.add('selected');
  selectedCover = img.src;

  if (window.coverPreviewTemp)
    coverPreviewTemp.style.backgroundImage = `url(${img.src})`;

  markProfileAsChanged();
}

async function saveCover() {
  const cover =
    selectedCover ||
    localStorage.getItem('profileCover') ||
    DEFAULT_COVER;

  localStorage.setItem('profileCover', cover);

  await window.saveProfileToSupabase();

  selectedCover = null;

  syncPreviewData();
  showView('manage-profile-view');
}

/* ================= PERFIL ================= */
async function saveFullProfile() {
  const nameInput = document.querySelector(
    '#manage-profile-view #profileNameInput'
  );

  const name = nameInput?.value.trim() || DEFAULT_NAME;

  const avatar =
    selectedAvatar ||
    localStorage.getItem('profileAvatar') ||
    DEFAULT_AVATAR;

  const cover =
    selectedCover ||
    localStorage.getItem('profileCover') ||
    DEFAULT_COVER;

  localStorage.setItem('profileName', name);
  localStorage.setItem('profileAvatar', avatar);
  localStorage.setItem('profileCover', cover);

  await window.saveProfileToSupabase();

  selectedAvatar = null;
  selectedCover = null;
  profileChanged = false;

  const btn = document.getElementById('saveProfileBtn');
  if (btn) {
    btn.disabled = true;
    btn.classList.remove('active', 'btn-light');
    btn.classList.add('btn-secondary');
  }

  syncPreviewData();
  showView('profile-view');
}

/* ================= SINCRONIZAR ================= */
function syncPreviewData() {
  const avatar = localStorage.getItem('profileAvatar') || DEFAULT_AVATAR;
  const cover  = localStorage.getItem('profileCover')  || DEFAULT_COVER;
  const name   = localStorage.getItem('profileName')   || DEFAULT_NAME;

  // AVATAR
  if (window.avatarMain) avatarMain.src = avatar;
  if (window.avatarPreview) avatarPreview.src = avatar;
  if (window.avatarCoverPreview) avatarCoverPreview.src = avatar;
  if (window.manageAvatar) manageAvatar.src = avatar;

  // FONDOS
  if (window.mainCover)
    mainCover.style.backgroundImage = `url(${cover})`;

  if (window.manageCover)
    manageCover.style.backgroundImage = `url(${cover})`;

  if (window.coverPreviewTemp)
    coverPreviewTemp.style.backgroundImage = `url(${cover})`;

  if (window.avatarEditCover)
    avatarEditCover.style.backgroundImage = `url(${cover})`;

  // NOMBRE
  if (window.profileName) profileName.textContent = name;
  if (window.manageProfileName) manageProfileName.textContent = name;
  if (window.editName) editName.textContent = name;
  if (window.editNameCover) editNameCover.textContent = name;

  // INPUTS
  const input = document.querySelector(
    '#manage-profile-view #profileNameInput, #edit-profile-view #profileNameInput'
  );
  if (input) input.value = name;

  // FOOTER ICON
const footerIcon = document.getElementById('footerIconImg');
if (footerIcon) footerIcon.src = avatar;

}

const footer = document.querySelector(".footer");

let lastScrollTop = 0;

function handleScroll(currentScroll) {
    if (currentScroll > lastScrollTop) {
        footer.classList.add("hidden"); // bajando
    } else {
        footer.classList.remove("hidden"); // subiendo
    }

    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
}

/* 1️⃣ Detectar scroll en la página principal (window) */
window.addEventListener("scroll", function () {
    handleScroll(window.scrollY);
});

/* 2️⃣ Detectar scroll en contenedores internos */
document.querySelectorAll(".scroll-content, .scroll-view").forEach(container => {
    container.addEventListener("scroll", function () {
        handleScroll(container.scrollTop);
    });
});


/* ================= CAMBIOS ================= */
function markProfileAsChanged() {
  profileChanged = true;

  const btn = document.getElementById('saveProfileBtn');
  if (!btn) return;

  btn.disabled = false;
  btn.classList.add('active');
  btn.classList.remove('btn-secondary');
  btn.classList.add('btn-light');
}

/* ================= LOAD ================= */
window.addEventListener('load', () => {
  initProfileDefaults();
  syncPreviewData();

  const nameInput = document.querySelector(
    '#manage-profile-view #profileNameInput'
  );

  if (nameInput) {
    nameInput.addEventListener('input', markProfileAsChanged);
  }
});

window.addEventListener('load', () => {
  initProfileDefaults();
  syncPreviewData();

  const nameInput = document.querySelector(
    '#manage-profile-view #profileNameInput'
  );

  if (nameInput) {
    nameInput.addEventListener('input', markProfileAsChanged);
  }

  // 🔔 Actualizar badge
  if (typeof initNotifications === "function") {
  initNotifications();
}
});


function openDeleteProgressModal() {
  document.getElementById("deleteProgressOverlay").classList.remove("hidden");
}

function closeDeleteProgressModal() {
  document.getElementById("deleteProgressOverlay").classList.add("hidden");
}

function confirmDeleteProgress() {
  Object.keys(localStorage).forEach(key => {
    if (
      key.startsWith("progress_") ||
      key.startsWith("movie_") ||
      key.startsWith("series_") ||
      key.includes("-serie") ||
      key.includes("-bebop") ||
      key.includes("cowboy") ||
      key.includes("-") // 🔥 esto atrapará ids como cowboy-bebop
    ) {
      localStorage.removeItem(key);
    }
  });

  closeDeleteProgressModal();
  showToast("Progreso de reproducción eliminado");
}

/* ===== TOAST ===== */
function showToast(text) {
  const toast = document.getElementById("notificacion");
  const texto = document.getElementById("notificacionTexto");

  texto.textContent = text;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}




const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.classList.add("loaded");
      observer.unobserve(img);
    }
  });
}, {
  rootMargin: "100px" // carga antes de que aparezca
});

document.querySelectorAll(".lazy-img").forEach(img => {
  observer.observe(img);
});

const grids = document.querySelectorAll('.avatar-grid');

grids.forEach(grid => {
  const imgs = grid.querySelectorAll('.lazy-img');

  imgs.forEach((img, i) => {
    if (i < 6) {
      img.src = img.dataset.src; // primeras cargan de inmediato
    } else {
      observer.observe(img);
    }
  });
});


function cargarDescargas() {

  const cont = document.getElementById("downloadsContainer");
  const storageCont = document.getElementById("storageContainer");

  if (typeof Android === "undefined") {
    cont.innerHTML = "<p>Abre esta sección desde la app</p>";
    return;
  }

  // 🔥 STORAGE
  if (storageCont) {
    const dataStorage = Android.getStorageInfo();

    if (dataStorage) {
      const parts = dataStorage.split("|");
      const used = parseInt(parts[0]);
      const total = parseInt(parts[1]);

      if (total > 0) {
        const percent = Math.round((used / total) * 100);

        const format = (bytes) => {
          const gb = bytes / (1024 * 1024 * 1024);
          return gb.toFixed(1) + " GB";
        };

        storageCont.innerHTML = `
          <div style="background:#1c1c1c;padding:16px;border-radius:14px;margin-bottom:16px;">
            <p style="margin:0 0 10px 0;font-size:14px;font-weight:600;color:white;">
              Almacenamiento del dispositivo
            </p>

            <div style="width:100%;height:6px;background:#333;border-radius:10px;overflow:hidden;">
              <div style="height:100%;width:${percent}%;background:#e50914;"></div>
            </div>

            <p style="margin-top:8px;font-size:12px;color:#aaa;">
              ${format(used)} de ${format(total)} usados
            </p>
          </div>
        `;
      }
    }
  }

  const data = Android.getDownloads();

  console.log("DATA:", data);

  cont.innerHTML = ""; // ✅ SOLO UNA VEZ AQUÍ

  if (!data) {
    cont.innerHTML = "<p>No hay descargas</p>";
    return;
  }

  data.split(";").forEach(item => {

    if (!item || !item.includes("|")) return;

    const parts = item.split("|");

    const fileName = parts[0];
    const path = parts[1];

    const serie = parts[2] || "";
    const title = parts[3] || fileName;
    const img = parts[4] || "";
    const tipo = parts[5] || "movie";

    const div = document.createElement("div");

    div.innerHTML = `
      <div style="display:flex;gap:12px;background:#1c1c1c;padding:12px;border-radius:14px;margin-bottom:12px;align-items:center;">
        
        <div onclick="ver('${path.replace(/'/g, "\\'")}')"
          style="position:relative;width:160px;height:90px;cursor:pointer;">

          <img src="${img || 'https://via.placeholder.com/160x90'}"
            style="width:100%;height:100%;object-fit:cover;border-radius:10px;">

          <div style="
            position:absolute;
            top:50%;
            left:50%;
            transform:translate(-50%, -50%);
            background:rgba(0,0,0,0.5);
            border-radius:50%;
            width:40px;
            height:40px;
            display:flex;
            align-items:center;
            justify-content:center;
            color:white;">
            ▶
          </div>
        </div>

        <div style="flex:1;position:relative;height:90px;">
          
          <p style="margin:0;font-size:12px;color:#9aa0a6;">${serie}</p>

          <p style="margin:2px 0 0 0;font-size:14px;font-weight:600;color:white;">
            ${title}
          </p>

          <button onclick="handleDelete(event, '${path.replace(/'/g, "\\'")}')"
            style="position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,0.6);border:none;color:#ff5252;font-size:11px;padding:3px 8px;border-radius:6px;cursor:pointer;">
            eliminar
          </button>

        </div>
      </div>
    `;

    cont.appendChild(div);
  });
}

function ver(path) {
  if (typeof Android !== "undefined") {
    Android.playOffline(path);
  }
}

function eliminar(path) {
  if (typeof Android !== "undefined") {
    Android.deleteDownload(path);
    cargarDescargas(); // 🔥 refresca lista
  }
}

function handleDelete(e, path) {
  e.stopPropagation();
  e.preventDefault();

  eliminar(path);
}

function cargarStorage() {

  if (typeof Android === "undefined") return;

  const data = Android.getStorageInfo();
  if (!data) return;

  const parts = data.split("|");

  const used = parseInt(parts[0]);
  const total = parseInt(parts[1]);

  if (!total) return;

  const percent = Math.round((used / total) * 100);

  function format(bytes) {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(1) + " GB";
  }

  const usado = format(used);
  const totalStr = format(total);

  const barra = document.getElementById("storageBar");
  const texto = document.getElementById("storageText");

  if (barra) barra.style.width = percent + "%";
  if (texto) texto.textContent = `${usado} de ${totalStr} usados`;
}

if (document.getElementById("downloadsContainer")) {
  initDownloads();
}

window.addEventListener("load", () => {
  if (typeof initNotifications === "function") {
    initNotifications();
  }
});