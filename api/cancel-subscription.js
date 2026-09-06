// ---------------------------------------------------------------------------
// Vercel Serverless Function: cancela la SUSCRIPCION (Preapproval) del usuario
// ---------------------------------------------------------------------------
// Recibe:  POST { "userId": "<uuid del perfil>" }
// Hace:
//   1. Busca el perfil en Supabase y toma su subscription_id.
//   2. Llama a Mercado Pago (PUT /preapproval/{id}) con status "cancelled".
//   3. Apaga premium en el perfil (premium = false).
// ---------------------------------------------------------------------------

const supabaseUrl =
  process.env.SUPABASE_URL || "https://wplyrhcszuoordgaphax.supabase.co";

function serviceHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    return res.status(500).json({ error: "Falta MP_ACCESS_TOKEN en Vercel" });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY en Vercel" });
  }

  try {
    let body = {};
    if (req.body && typeof req.body === "object") {
      body = req.body;
    } else if (req.body) {
      try { body = JSON.parse(req.body); } catch (e) { /* ignorado */ }
    }

    const userId = String(body.userId || "").trim();
    if (!userId) {
      return res.status(400).json({ ok: false, error: "Falta el id de usuario (userId)" });
    }

    // 1. Buscar el perfil en Supabase
    const getRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
      { headers: serviceHeaders() }
    );
    const rows = await getRes.json();
    const profile = Array.isArray(rows) ? rows[0] : null;

    if (!profile) {
      return res.status(404).json({ ok: false, error: "No se encontró tu perfil" });
    }

    const subId = profile.subscription_id;

    // Sin suscripción registrada (ej. pago único viejo): solo apagamos premium
    if (!subId) {
      await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
        method: "PATCH",
        headers: { ...serviceHeaders(), Prefer: "return=minimal" },
        body: JSON.stringify({ premium: false }),
      });
      return res.status(200).json({
        ok: true,
        cancelado: false,
        mensaje: "No había suscripción activa registrada; premium desactivado.",
      });
    }

    // 2. Cancelar en Mercado Pago
    const mpRes = await fetch(
      `https://api.mercadopago.com/preapproval/${subId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ status: "cancelled" }),
      }
    );

    const mpData = await mpRes.json();
    console.log("RESPUESTA CANCELACION MERCADO PAGO:", mpRes.status, mpData);

    if (!mpRes.ok) {
      return res.status(mpRes.status).json({
        ok: false,
        error: "Mercado Pago rechazó la cancelación",
        detalle: mpData,
      });
    }

    // 3. Apagar premium en el perfil
    await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      method: "PATCH",
      headers: { ...serviceHeaders(), Prefer: "return=minimal" },
      body: JSON.stringify({ premium: false, subscription_id: null }),
    });

    return res.status(200).json({
      ok: true,
      cancelado: true,
      mensaje: "Suscripción cancelada. Ya no se te cobrará más.",
    });
  } catch (error) {
    console.error("ERROR CANCELANDO SUSCRIPCION:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
