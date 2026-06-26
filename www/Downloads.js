function cargarDescargas() {

  const cont = document.getElementById("downloadsContainer");
  const storageCont = document.getElementById("storageContainer");

  if (!cont) {
    console.error("downloadsContainer no existe");
    return;
  }

  console.log("Android bridge:", typeof Android);

  if (typeof Android === "undefined") {
    cont.innerHTML = "<p style='color:white'>Abre esta sección desde la app</p>";
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

document.addEventListener("DOMContentLoaded", () => {
  cargarDescargas();
});