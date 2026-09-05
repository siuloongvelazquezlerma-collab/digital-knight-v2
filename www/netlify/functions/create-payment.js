// Netlify Function: crea una preferencia de pago en Mercado Pago (Modo Test).
//
// Variables de entorno necesarias en Netlify:
//   MP_ACCESS_TOKEN   -> Access Token de Mercado Pago (en modo test empieza con "TEST-")
//   MP_DEFAULT_PLAN   -> (opcional) plan por defecto: "promo3" (15 MXN) o "monthly" (40 MXN)
//
// El Access Token es secreto: esta función es la única que lo usa, NUNCA debe
// ir en el código del cliente (premium.js).

const MP_API = "https://api.mercadopago.com";

// Planes disponibles (montos en MXN)
const PLANS = {
  promo3: { title: "Digital Knight Premium - Promo 3 meses", amount: 15 },
  monthly: { title: "Digital Knight Premium - 1 mes", amount: 40 },
};

exports.handler = async (event) => {
  try {
    // Solo aceptamos POST
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Método no permitido" }) };
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Falta la variable de entorno MP_ACCESS_TOKEN" }),
      };
    }

    // Leer (de forma segura) el body que envía premium.js
    let body = {};
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (e) {
      return { statusCode: 400, body: JSON.stringify({ error: "Body JSON inválido" }) };
    }

    const defaultPlan = process.env.MP_DEFAULT_PLAN || "promo3";
    const planId = body.plan && PLANS[body.plan] ? body.plan : defaultPlan;
    const plan = PLANS[planId];

    // Valor enviado por el cliente (permite ajustar por campaña), con tope mínimo
    const amount = Number(body.amount) > 0 ? Number(body.amount) : plan.amount;
    const userId = String(body.userId || "");

    // URL base del sitio (Netlify la inyecta en process.env.URL / DEPLOY_PRIME_URL)
    const site = (process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:8888").replace(/\/$/, "");

    const preference = {
      items: [
        {
          id: "digital-knight-premium",
          title: plan.title,
          quantity: 1,
          unit_price: amount,
          currency_id: "MXN",
        },
      ],
      // Identifica qué usuario pagó (se usa en el webhook para activar premium)
      external_reference: userId,
      back_urls: {
        success: `${site}/premium.html?status=success`,
        pending: `${site}/premium.html?status=pending`,
        failure: `${site}/premium.html?status=failure`,
      },
      auto_return: "approved",
      // Webhook que recibir? la notificación del pago
      notification_url: `${site}/.netlify/functions/webhook`,
      metadata: { plan: planId },
    };

    const res = await fetch(`${MP_API}/checkout/preferences`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preference),
    });

    const data = await res.json();

    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify(data) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point,
        id: data.id,
      }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.toString() }) };
  }
};