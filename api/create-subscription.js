// ---------------------------------------------------------------------------
// Vercel Serverless Function: crea una SUSCRIPCION (Preapproval) en Mercado Pago.
// ---------------------------------------------------------------------------
// El usuario autoriza una sola vez y Mercado Pago le cobra automaticamente
// cada mes (debito automatico). No necesita volver a pagar manualmente.
//
// Variable de entorno necesaria en Vercel:
//   MP_ACCESS_TOKEN -> Access Token de PRODUCCION ("APP_USR-...")
//
// La activación del premium y la renovación mensual las hace webhook.js
// (ruta: /api/webhook), que recibe las notificaciones de la suscripción.
// ---------------------------------------------------------------------------

// Planes disponibles (montos en MXN). El cobro se repite cada 1 mes.
const PLANS = {
  monthly: { title: "Digital Knight Premium (Mensual)", amount: 40 },
  promo3: { title: "Digital Knight Premium (Promo)", amount: 15 },
};

// URL pública de tu sitio (sin barra final). Ajusta si cambia tu dominio.
const SITE_URL = "https://digitalknightapp.com";

export default async function handler(req, res) {
  console.log("API CREATE SUBSCRIPTION FUNCIONANDO");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    return res.status(500).json({
      error: "Falta la variable de entorno MP_ACCESS_TOKEN en Vercel",
    });
  }

  try {
    // --- Leer datos que envía premium.js -------------------------------
    let body = {};
    if (req.body && typeof req.body === "object") {
      body = req.body;
    } else if (req.body) {
      try {
        body = typeof req.body === "string" ? JSON.parse(req.body) : {};
      } catch (e) {
        /* body inválido: se usan los valores por defecto */
      }
    }

    const userId = String(body.userId || body.external_reference || "").trim();
    const payerEmail = String(body.email || "").trim();
    const planId = body.plan && PLANS[body.plan] ? body.plan : "monthly";
    const plan = PLANS[planId];

    // Un usuario sin sesión no debe crear suscripciones
    if (!userId) {
      return res.status(400).json({ error: "Falta el id de usuario (userId)" });
    }

    const subscriptionData = {
      reason: plan.title,

      // Identifica al usuario dueño de la suscripción. webhook.js la usará.
      external_reference: userId,

      // El cobro se repite automáticamente cada 1 mes
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: plan.amount,
        currency_id: "MXN",
      },

      // A dónde vuelve el usuario después de autorizar la suscripción
      back_url: `${SITE_URL}/premium.html?status=success`,

      // Webhook que recibe las notificaciones de la suscripción
      notification_url: `${SITE_URL}/api/webhook`,

      metadata: {
        plan: planId,
      },
    };

    // El email del payer ayuda a que el checkout venga pre-completado
    if (payerEmail) {
      subscriptionData.payer_email = payerEmail;
    }

    const response = await fetch(
      "https://api.mercadopago.com/preapproval",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(subscriptionData),
      }
    );

    const data = await response.json();

    console.log("RESPUESTA SUSCRIPCION MERCADO PAGO:", data);

    if (!response.ok) {
      // Se devuelve TODO el body que Mercado Pago envió, para diagnosticar
      return res.status(response.status).json({
        error: {
          status: response.status,
          mercado_pago_raw: data,
          message:
            (data && (data.message || data.error || JSON.stringify(data))) ||
            ("HTTP " + response.status),
        },
        __src: "V2-SUBSCRIPTION",
      });
    }

    return res.status(200).json({
      init_point: data.init_point,
      id: data.id,
      __src: "V2-SUBSCRIPTION",
    });
  } catch (error) {
    console.error("ERROR SUSCRIPCION MERCADO PAGO:", error);
    return res.status(500).json({ error: error.message });
  }
}