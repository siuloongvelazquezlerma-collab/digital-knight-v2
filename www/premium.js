import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';


const supabase = createClient(
'https://wplyrhcszuoordgaphax.supabase.co',
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbHlyaGNzenVvb3JkZ2FwaGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDg5NzAsImV4cCI6MjA4MTgyNDk3MH0.VctFmTaBMHkhbqDhezAvFoAT_QcC-bk7A3gH1MoMScU'
);


// Referencia interna del apoyo seleccionado.
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

    // No hay sesión: el botón de Tarjeta manda a login
    const tarjetaBtnNoSession = document.getElementById("tarjetaBtn");
    if(tarjetaBtnNoSession){
        tarjetaBtnNoSession.onclick = () => {
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

const offer = document.getElementById("premiumOffer");

console.log("STATUS:", status);
console.log("DEVICES:", devices);
console.log("BUTTON:", button);


if(profile.premium){

    status.textContent = "❤️ Gracias por apoyar Digital Knight";

    devices.textContent =
    "Tu apoyo ayuda a mantener la app y sus servidores en funcionamiento.";

    button.textContent = "Administrar apoyo";

    // El botón lleva a la pantalla de administración del apoyo.
    button.onclick = () => {
        window.location.href = "manage-premium.html";
    };

}else{

    status.textContent = "🤍 Apoya Digital Knight";
    devices.textContent =
    "Tu apoyo ayuda a mantener la app, los servidores y la atención de reportes de fallas.";

    button.textContent = "Abrir perfil";

    // Sin Premium: a la app si ya hay sesión, o al login si no
    button.onclick = () => {
        window.location.href = profile.id ? "index.html" : "login.html";
    };

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

    // Tras terminar el pago, llevarlo automáticamente a la aplicación:
    //  - con sesión iniciada -> la app
    //  - sin sesión          -> al login
    if(payStatus === "success"){

        const button = document.getElementById("premiumAction");
        if(button) button.textContent = "✅ Pago exitoso · Redirigiendo…";

        setTimeout(async () => {

            try{
                const { data } = await supabase.auth.getSession();
                window.location.href = data.session
                    ? "index.html"
                    : "login.html";
            }catch(e){
                window.location.href = "login.html";
            }

        }, 4000);
    }
}



const tarjetaBtn = document.getElementById("tarjetaBtn");
const promo2Btn = document.getElementById("promo2Btn");

// =====================================================
// PROCESAR PAGOS DE MERCADO PAGO
// =====================================================

async function iniciarPago(plan, boton) {

    if (boton.disabled) return;

    console.log("Pago iniciado:", plan);

    boton.disabled = true;

    try {

        // Obtener la sesión real de Supabase.
        const { data: sessionData, error: sessionError } =
            await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        const session = sessionData.session;

        // Comprobar que el usuario inició sesión.
        if (!session || !session.user || !session.access_token) {
            window.location.href = "login.html";
            return;
        }

        // Seleccionar el endpoint según el plan.
        const endpoint = plan === "promo2"
            ? "/api/create-payment"
            : "/api/create-subscription";

        // Enviar solicitud al servidor.
        const response = await fetch(endpoint, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`
            },

            body: JSON.stringify({
                userId: session.user.id,
                email: session.user.email || "",
                plan: plan
            })
        });

        const rawText = await response.text();

        console.log(
            "Respuesta del servidor:",
            response.status,
            rawText
        );

        let data;

        try {
            data = JSON.parse(rawText);
        } catch {
            throw new Error(
                "El servidor no devolvió JSON: " +
                rawText.slice(0, 200)
            );
        }

        // Comprobar errores del servidor.
        if (!response.ok) {

            const detail = data.details ||
                data.error ||
                data.message ||
                JSON.stringify(data);

            throw new Error(
                typeof detail === "string"
                    ? detail
                    : JSON.stringify(detail)
            );
        }

        // Comprobar que Mercado Pago devolvió el enlace.
        if (!data.init_point) {
            throw new Error(
                "Mercado Pago no devolvió el enlace de pago."
            );
        }

        console.log("Redirigiendo a Mercado Pago:", data);

        // Redirigir al checkout.
        window.location.href = data.init_point;

    } catch (error) {

        console.error("ERROR EN EL PAGO:", error);

        alert(
            "No se pudo iniciar el pago:\n" +
            error.message
        );

    } finally {

        boton.disabled = false;

    }
}

// =====================================================
// BOTÓN DE $15 MXN - PREMIUM POR 2 MESES
// =====================================================

if (promo2Btn) {

    promo2Btn.addEventListener("click", () => {
        iniciarPago("promo2", promo2Btn);
    });

}

// =====================================================
// BOTÓN DE $40 MXN - SUSCRIPCIÓN MENSUAL
// =====================================================

if (tarjetaBtn) {

    tarjetaBtn.addEventListener("click", () => {
        iniciarPago("monthly", tarjetaBtn);
    });

}