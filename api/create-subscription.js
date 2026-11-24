
const SITE_URL = "https://digitalknightapp.com";
const MP_API = "https://api.mercadopago.com";

const PLAN = {
  id: "monthly",
  title: "Digital Knight Premium - Mensual",
  amount: 40,
  currency: "MXN",
};

async function getAuthenticatedUser(req) {
  const authorization = req.headers.authorization || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return null;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Falta SUPABASE_URL o SUPABASE_ANON_KEY en Vercel");
  }

  const response = await fetch(
    `${supabaseUrl}/auth/v1/user`,
    {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${match[1]}`,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

export default async function handler(req, res) {
  console.log("API CREATE SUBSCRIPTION FUNCIONANDO");

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método no permitido",
    });
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    return res.status(500).json({
      error: "Falta MP_ACCESS_TOKEN en Vercel",
    });
  }

  try {
    // Verificar la sesión directamente con Supabase.
    const user = await getAuthenticatedUser(req);

    if (!user || !user.id) {
      return res.status(401).json({
        error: "Sesión no válida. Inicia sesión nuevamente.",
      });
    }

    const body = req.body || {};

    if (body.plan !== PLAN.id) {
      return res.status(400).json({
        error: "Este endpoint solamente acepta el plan mensual.",
      });
    }

    const userId = user.id;
    const payerEmail = String(user.email || "").trim();

    const subscriptionData = {
      reason: PLAN.title,

      external_reference: userId,

      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: PLAN.amount,
        currency_id: PLAN.currency,
      },

      back_url: `${SITE_URL}/premium.html?status=success`,

      notification_url: `${SITE_URL}/api/webhook`,

      metadata: {
        plan: PLAN.id,
        user_id: userId,
      },
    };

    if (payerEmail) {
      subscriptionData.payer_email = payerEmail;
    }

    const response = await fetch(
      `${MP_API}/preapproval`,
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
      return res.status(response.status).json({
        error: "Mercado Pago rechazó la creación de la suscripción",
        details: data,
      });
    }

    if (!data.init_point) {
      throw new Error("Mercado Pago no devolvió el enlace de suscripción");
    }

    return res.status(200).json({
      init_point: data.init_point,
      id: data.id,
      plan: PLAN.id,
      amount: PLAN.amount,
      currency: PLAN.currency,
    });

  } catch (error) {
    console.error("ERROR SUSCRIPCION MERCADO PAGO:", error);

    return res.status(500).json({
      error: "Error creando la suscripción",
      details: error.message,
    });
  }
}
