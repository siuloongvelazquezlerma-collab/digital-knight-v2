import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';


const supabase = createClient(
'https://wplyrhcszuoordgaphax.supabase.co',
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbHlyaGNzenVvb3JkZ2FwaGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDg5NzAsImV4cCI6MjA4MTgyNDk3MH0.VctFmTaBMHkhbqDhezAvFoAT_QcC-bk7A3gH1MoMScU'
);


async function loadPremium(){

const {
    data:{session}
}=await supabase.auth.getSession();

if(!session){

    document.getElementById("premiumAction").onclick = () => {
        window.location.href = "login.html";
    };

    return;

}


const user = session.user;


const { data: profile, error } = await supabase
.from("profiles")
.select("*")
.eq("id", user.id)
.maybeSingle();


console.log("PERFIL SUPABASE:", profile);


if(error){

console.error("ERROR:",error);
return;

}


if(!profile){

console.log("No existe perfil");
return;

}


// Guardar cache nuevamente
localStorage.setItem(
"dk_profile",
JSON.stringify(profile)
);


// Actualizar pantalla

const status = document.getElementById("premiumStatus");
const devices = document.getElementById("devicesText");
const button = document.getElementById("premiumAction");
button.onclick = () => {
    window.location.href = "perfil.html#premium";
};
const offer = document.getElementById("premiumOffer");

console.log("STATUS:", status);
console.log("DEVICES:", devices);
console.log("BUTTON:", button);


if(profile.premium){

    status.textContent = "⭐ Ya eres Digital Knight Premium";

    devices.textContent =
    `Dispositivos permitidos: ${profile.devices_limit}`;

    button.textContent = "Administrar Premium";

}else{

    status.textContent = "🚀 Apoya Digital Knight Premium";

    devices.textContent =
    "Administra tu suscripción desde tu perfil.";

    button.textContent = "Abrir perfil";

}


}


loadPremium();