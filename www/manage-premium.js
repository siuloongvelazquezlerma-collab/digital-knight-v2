import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    'https://wplyrhcszuoordgaphax.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbHlyaGNzenVvb3JkZ2FwaGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDg5NzAsImV4cCI6MjA4MTgyNDk3MH0.VctFmTaBMHkhbqDhezAvFoAT_QcC-bk7A3gH1MoMScU'
);

const stateBox   = document.getElementById("stateBox");
const stateTitle = document.getElementById("stateTitle");
const stateValue = document.getElementById("stateValue");
const untilValue = document.getElementById("untilValue");
const devicesValue = document.getElementById("devicesValue");
const emailValue = document.getElementById("emailValue");
const backBtn    = document.getElementById("backBtn");
const cancelBtn  = document.getElementById("cancelBtn");
const msg        = document.getElementById("msg");
const cancelNote = document.getElementById("cancelNote");

let currentUserId = null;

backBtn.onclick = () => { window.location.href = "index.html"; };

async function loadProfile(){

    let profile = null;
    try{
        const { data } = await supabase.auth.getSession();
        if(data.session){
            const { data: fresh } = await supabase
                .from("profiles").select("*")
                .eq("id", data.session.user.id).maybeSingle();
            if(fresh){
                profile = fresh;
                localStorage.setItem("dk_profile", JSON.stringify(fresh));
            }
            currentUserId = data.session.user.id;
        }
    }catch(e){ console.warn(e); }

    if(!profile){
        profile = JSON.parse(localStorage.getItem("dk_profile") || "null");
        if(profile) currentUserId = profile.id;
    }

    if(!profile){
        stateTitle.textContent = "Sesión no iniciada";
        stateValue.textContent = "—";
        msg.textContent = "Inicia sesión para administrar tu Premium.";
        backBtn.textContent = "Iniciar sesión";
        backBtn.onclick = () => { window.location.href = "login.html"; };
        return;
    }

    emailValue.textContent = profile.email || "—";
    devicesValue.textContent = profile.devices_limit || 3;

    if(profile.premium){
        stateBox.classList.add("premium-on");
        stateTitle.innerHTML = 'Premium activo <span class="badge">PREMIUM</span>';
        stateValue.textContent = "Activo";
        untilValue.textContent = profile.premium_until
            ? new Date(profile.premium_until).toLocaleDateString()
            : "Sin fecha de vencimiento";
        cancelBtn.style.display = "block";
        cancelNote.style.display = "block";
    }else{
        stateTitle.textContent = "Sin Premium";
        stateValue.textContent = "Inactivo";
        untilValue.textContent = "—";
        msg.textContent = "Aún no tienes Premium activo.";
    }
}

cancelBtn.onclick = async () => {

    if(!confirm("¿Seguro que quieres cancelar tu suscripción Premium? Perderás los beneficios de inmediato.")){
        return;
    }

    cancelBtn.disabled = true;
    cancelBtn.textContent = "Cancelando…";
    msg.className = "msg";
    msg.textContent = "";

    try{

        const response = await fetch("/api/cancel-subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUserId })
        });

        const raw = await response.text();
        let data = {};
        try{ data = JSON.parse(raw); }
        catch(e){ data = { error: "Respuesta inválida del servidor: " + raw.slice(0,150) }; }

        if(response.ok && data.ok){
            msg.className = "msg ok";
            msg.textContent = data.mensaje || "✅ Suscripción cancelada. Ya no se te cobrará más.";
            cancelBtn.style.display = "none";
            cancelNote.style.display = "none";
            stateBox.classList.remove("premium-on");
            stateTitle.textContent = "Sin Premium";
            stateValue.textContent = "Cancelado";
        }else{
            msg.className = "msg err";
            msg.textContent = "No se pudo cancelar: " + (data.error || "error desconocido");
            cancelBtn.disabled = false;
            cancelBtn.textContent = "Cancelar suscripción Premium";
        }

    }catch(e){
        msg.className = "msg err";
        msg.textContent = "Error de conexión: " + e.message;
        cancelBtn.disabled = false;
        cancelBtn.textContent = "Cancelar suscripción Premium";
    }
};

loadProfile();
