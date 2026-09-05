// ---------------------------------------------------------------------------
// Vercel Serverless Function: VERIFICAR PAGO / FORZAR ACTIVACION DE PREMIUM
// ---------------------------------------------------------------------------
// Endpoint de diagnostico y respaldo del webhook:
//   GET /api/verify-payment?payment_id=123456
//
// 1) Consulta el pago a la API de Mercado Pago.
// 2) Si esta APPROVED y trae external_reference (userId), activa el premium
//    en Supabase (igual que hace webhook.js).
//
// Util cuando la notificacion del webhook no llego o llego antes de que las
// variables de entorno estuvieran listas. El ID de pago se encuentra en el
// panel de Mercado Pago -> Actividad.
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  // Solo GET para facil uso desde el navegador
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const paymentId = String(req.query.payment_id || "").trim();

  if (!paymentId) {
    return res.status(400).json({
      error:
        "Falta payment_id. Úsalo así: /api/verify-payment?payment_id=123456",
    });
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    return res.status(500).json({ error: "Falta MP_ACCESS_TOKEN en Vercel" });
  }

  try {
    // --- Consultar el pago a Mercado Pago --------------------------------
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } }
    );

    const payment = await mpRes.json();

    if (!mpRes.ok) {
      return res.status(200).json({
        ok: false,
        paso: "consulta_pago",
        mercado_pago_status: mpRes.status,
        detalle: payment,
      });
    }

    if (payment.status !== "approved") {
      return res.status(200).json({
        ok: false,
        paso: "estado_pago",
        status: payment.status,
        detalle: "El pago no está aprobado, no se activa premium.",
      });
    }

    const userId = String(payment.external_reference || "").trim();

    if (!userId) {
      return res.status(200).json({
        ok: false,
        paso: "external_reference",
        detalle:
          "El pago no tiene external_reference (userId). No se puede activar.",
      });
    }

    // --- Activar premium en Supabase (service role, salta RLS) -----------
    const supabaseUrl =
      process.env.SUPABASE_URL || "https://wplyrhcszuoordgaphax.supabase.co";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey) {
      return res
        .status(500)
        .json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY en Vercel" });
    }

    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const existing = await profileRes.json();

    if (!Array.isArray(existing) || existing.length === 0) {
      return res.status(200).json({
        ok: false,
        paso: "buscar_perfil",
        detalle:
          "No existe un perfil en Supabase con id=" + userId + ".",
      });
    }

    const currentDevices = existing[0]?.devices_limit
      ? existing[0].devices_limit
      : 3;

    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
      {
        method: "PATCH",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          premium: true,
          devices_limit: currentDevices,
        }),
      }
    );

    const updated = await updateRes.json();

    return res.status(200).json({
      ok: updateRes.ok,
      pago: {
        id: payment.id,
        status: payment.status,
        external_reference: userId,
        monto: payment.transaction_amount,
      },
      perfil_actualizado: updateRes.ok ? updated : null,
    });
  } catch (error) {
    console.error("Error en verify-payment:", error);
    return res.status(500).json({ error: error.message });
  }
}