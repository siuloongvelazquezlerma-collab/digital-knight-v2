/* =============================
   🔥 SISTEMA WAKELOCK MEJORADO
============================= */

let wakeLock = null;

// Solicitar WakeLock 
async function requestWakeLock() {
  try {
    if (!wakeLock) {
      wakeLock = await navigator.wakeLock.request("screen");
      console.log("🔋 WakeLock activado");

      wakeLock.addEventListener("release", () => {
        console.log("⚠️ WakeLock liberado automáticamente");
        wakeLock = null;
      });
    }
  } catch (err) {
    console.log("❌ Error WakeLock:", err);
  }
}

// Liberar WakeLock
function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
    console.log("🛑 WakeLock liberado manualmente");
  }
}

// Reintentar cuando vuelve la pestaña
document.addEventListener("visibilitychange", () => {
  if (wakeLock !== null && document.visibilityState === "visible") {
    requestWakeLock();
  }
});

// Compatibilidad global
window.WakeLockManager = {
  enable: requestWakeLock,
  disable: releaseWakeLock
};
