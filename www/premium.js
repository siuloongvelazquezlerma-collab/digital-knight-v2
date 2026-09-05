import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';


const supabase = createClient(
'https://wplyrhcszuoordgaphax.supabase.co',
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbHlyaGNzenVvb3JkZ2FwaGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDg5NzAsImV4cCI6MjA4MTgyNDk3MH0.VctFmTaBMHkhbqDhezAvFoAT_QcC-bk7A3gH1MoMScU'
);


// Plan seleccionado. "monthly" = $40 MXN/mes, "promo3" = $15 MXN por 3 meses.
let selectedPlan = "monthly";
let currentUser = null;


async function loadPremium(){

const {
    data:{session}
}=await supabase.auth.getSession();

if(!session){

    document.getElementById("premiumAction").onclick = () => {
        window.location.href = "login.html";
    };

    // No hay sesión: el botón de Mercado Pago manda a login
    const mpBtn = document.getElementById("mercadoPagoBtn");
    if(mpBtn){
        mpBtn.onclick = () => {
            window.location.href = "login.html";
        };
    }

    return;

}


const user = session.user;
currentUser = user;


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


if(button){

button.onclick = () => {

    const profile = JSON.parse(
        localStorage.getItem("dk_profile") || "{}"
    );


    if(!profile.id){

        window.location.href = "login.html";

        return;

    }


    console.log("Usuario listo para elegir método de pago");

};

}
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


// Si volvimos del checkout con estado, limpiar caché y recargar perfil
const urlParams = new URLSearchParams(window.location.search);
const payStatus = urlParams.get("status");

if(payStatus){
    // Limpiar la caché local para que se vuelva a leer desde Supabase
    localStorage.removeItem("dk_profile");
    // Recargar el perfil (muestra premium si ya se activó en el webhook)
    loadPremium();
}


const mercadoPagoBtn = document.getElementById("mercadoPagoBtn");


if(mercadoPagoBtn){

    mercadoPagoBtn.onclick = async()=>{

        console.log("💳 Mercado Pago iniciado");

        // El botón se guarda para evitar doble click
        mercadoPagoBtn.disabled = true;

        try{

            let userId = null;

            // Leer la sesión actual de Supabase
            const { data: sessionData } = await supabase.auth.getSession();
            const session = sessionData.session;

            if(session){
                userId = session.user.id;
            }else{
                // Fallback a la caché local
                const profile = JSON.parse(
                    localStorage.getItem("dk_profile") || "{}"
                );
                userId = profile.id || null;
            }

            if(!userId){
                window.location.href = "login.html";
                return;
            }

            const response = await fetch(
                "/api/create-payment",
                {
                    method:"POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        userId: userId,
                        plan: selectedPlan
                    })
                }
            );

            // Leer la respuesta como texto y convertir a JSON de forma segura
            const rawText = await response.text();

            console.log(
                "Respuesta cruda del servidor:",
                response.status,
                rawText
            );

            let data = {};
            try {
                data = JSON.parse(rawText);
            } catch(e) {
                data = { error: { message: "El servidor no devolvió JSON (status " + response.status + "): " + rawText.slice(0,200) } };
            }

            mercadoPagoBtn.disabled = false;


            if(!response.ok){

                const errObj = data.error || data;

                const msg =
                    (errObj && errObj.message)
                    || (typeof errObj === "string" ? errObj : JSON.stringify(errObj));

                alert(
                    "Error del servidor: " + msg +
                    (data.__src ? " [src=" + data.__src + "]" : "")
                );
                return;

            }


            console.log(
                "Respuesta Mercado Pago:",
                data
            );


            if(data.init_point){

    window.location.href = data.init_point;

}else{

    console.error("Respuesta sin init_point:", data);

    alert(
        "No se pudo iniciar el pago: " + JSON.stringify(data)
    );

}


        }catch(error){

            mercadoPagoBtn.disabled = false;

            console.error(
                "Error Mercado Pago:",
                error
            );


            alert(
                "Error conectando con Mercado Pago: " +
                (error && error.message ? error.message : error)
            );

        }


    };

}