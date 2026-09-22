import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
    'https://wplyrhcszuoordgaphax.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbHlyaGNzenVvb3JkZ2FwaGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDg5NzAsImV4cCI6MjA4MTgyNDk3MH0.VctFmTaBMHkhbqDhezAvFoAT_QcC-bk7A3gH1MoMScU'
);

const stateBox   = document.getElementById("stateBox");
const stateTitle = document.getElementById("stateTitle");
const stateValue = document.getElementById("stateValue");
const emailValue = document.getElementById("emailValue");
const backBtn    = document.getElementById("backBtn");
const msg        = document.getElementById("msg");

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
        }
    }catch(e){ console.warn(e); }

    if(!profile){
        profile = JSON.parse(localStorage.getItem("dk_profile") || "null");
    }

    if(!profile){
        stateTitle.textContent = "Sesión no iniciada";
        stateValue.textContent = "—";
        msg.textContent = "Inicia sesión para consultar tu apoyo.";
        backBtn.textContent = "Iniciar sesión";
        backBtn.onclick = () => { window.location.href = "login.html"; };
        return;
    }

    emailValue.textContent = profile.email || "—";
    if(profile.premium){
        stateBox.classList.add("support-on");
        stateTitle.innerHTML = 'Gracias por tu apoyo <span class="badge">APOYO</span>';
        stateValue.textContent = "Apoyo activo";
    }else{
        stateTitle.textContent = "Apoya Digital Knight";
        stateValue.textContent = "Sin apoyo registrado";
        msg.textContent = "Tu apoyo ayuda a mantener la app y sus servidores en funcionamiento.";
    }
}

loadProfile();
