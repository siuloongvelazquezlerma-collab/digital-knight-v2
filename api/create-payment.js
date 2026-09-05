// ---------------------------------------------------------------------------
// Vercel Serverless Function: crea una preferencia de pago en Mercado Pago.
// ---------------------------------------------------------------------------
// Variable de entorno necesaria en Vercel:
//   MP_ACCESS_TOKEN -> Access Token de Mercado Pago
//                       - Produccion: empieza con "APP_USR-"
//                       - Prueba:      empieza con "TEST-"
//
// Este endpoint SOLO crea la preferencia. La confirmación del pago y la
// activación del premium las hace webhook.js
// (ruta: /api/webhook).
// ---------------------------------------------------------------------------

// Planes disponibles (montos en MXN). Aquí defines los precios oficiales.
const PLANS = {
  promo3: { title: "Digital Knight Premium - Promo 3 meses", amount: 15 },
  monthly: { title: "Digital Knight Premium - 1 mes", amount: 40 },
};

// URL pública de tu sitio (sin barra final). Ajusta si cambia tu dominio.
const SITE_URL = "https://digitalknightapp.com";

export default async function handler(req, res) {
  console.log("API CREATE PAYMENT FUNCIONANDO");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    return res.status(500).json({
      error:
        "Falta la variable de entorno MP_ACCESS_TOKEN en Vercel",
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
    const planId = body.plan && PLANS[body.plan] ? body.plan : "monthly";
    const plan = PLANS[planId];

    // Un cliente premium o sin sesión no debe crear pagos
    if (!userId) {
      return res
        .status(400)
        .json({ error: "Falta el id de usuario (userId)" });
    }

    const paymentData = {
      items: [
        {
          id: "digital-knight-premium",
          title: plan.title,
          quantity: 1,
          unit_price: plan.amount,
          currency_id: "MXN",
        },
      ],

      // Identifica al usuario que pagó. webhook.js la usará para activarlo.
      external_reference: userId,

      back_urls: {
        success: `${SITE_URL}/premium.html?status=success`,
        failure: `${SITE_URL}/premium.html?status=failure`,
        pending: `${SITE_URL}/premium.html?status=pending`,
      },

      auto_return: "approved",

      // Webhook que recibe la notificación del pago y activa el premium.
      notification_url: `${SITE_URL}/api/webhook`,

      metadata: {
        plan: planId,
      },
    };

    const response = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(paymentData),
      }
    );

    const data = await response.json();

    console.log("RESPUESTA MERCADO PAGO:", data);

    if (!response.ok) {
      // Se devuelve TODO el body que Mercado Pago envió, para diagnosticar
      return res.status(response.status).json({
        error: {
          status: response.status,
          mercado_pago_raw: data,        // body completo de Mercado Pago
          message:
            (data && (data.message || data.error || JSON.stringify(data))) ||
            ("HTTP " + response.status),
        },
        __src: "V2-NO-SUPABASE", // ← marca de versión para debug
      });
    }

    return res.status(200).json({
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
      id: data.id,
      __src: "V2-NO-SUPABASE", // ← marca de versión para debug
    });
  } catch (error) {
    console.error("ERROR MERCADO PAGO:", error);
    return res.status(500).json({ error: error.message });
  }
}