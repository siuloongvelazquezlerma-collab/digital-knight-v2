// ---------------------------------------------------------------------------
// Vercel Serverless Function: WEBHOOK de Mercado Pago
// ---------------------------------------------------------------------------
// Mercado Pago (o el Checkout) notifica a esta URL cuando hay cambios de
// pago: https://digitalknightapp.com/api/webhook
//
// Variables de entorno necesarias en Vercel:
//   MP_ACCESS_TOKEN      -> Access Token de Mercado Pago (MODO TEST "TEST-...")
//   SUPABASE_URL         -> https://wplyrhcszuoordgaphax.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY -> Service Role Key de tu proyecto Supabase
//
// Flujo:
//   1) Se recibe la notificacion (payment approved/rejected...).
//   2) Se consulta el pago a la API de Mercado Pago para verificarlo.
//   3) Si esta APPROVED, se actualiza la tabla "profiles" de Supabase
//      poniendo premium = true.
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  console.log("WEBHOOK Mercado Pago recibido:", req.method);

  // Mercado Pago puede mandar la notificacion por POST (JSON) o por GET (query)
  const paymentId =
    req.body?.data?.id || req.query?.id || req.query?.data_id || "";

  console.log("paymentId obtenido:", paymentId);

  // Responder rapido (200) para que Mercado Pago no reintente.
  if (!paymentId) {
    return res.status(200).json({ received: true });
  }

  try {
    // --- Verificar el pago con la API de Mercado Pago ------------------
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    const payment = await mpRes.json();
    console.log("Detalle del pago:", payment);
    console.log("status:", payment.status);
    console.log("external_reference:", payment.external_reference);

    // Solo activamos cuando el pago fue aprobado
    if (payment.status !== "approved") {
      console.log("Pago aun no aprobado, no se activa premium.");
      return res.status(200).json({ received: true, state: payment.status });
    }

    const userId = String(payment.external_reference || "").trim();

    if (!userId) {
      console.warn("Pago directo sin external_reference (no activamos).");
      return res.status(200).json({ received: true });
    }

    // --- Activar premium en Supabase -----------------------------------
    const supabaseUrl =
      process.env.SUPABASE_URL || "https://wplyrhcszuoordgaphax.supabase.co";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceKey) {
      console.error("Falta SUPABASE_SERVICE_ROLE_KEY");
      return res.status(500).json({ error: "Falta service key" });
    }

    // Se calcula el nuevo devices_limit (ya era premium? se respeta)
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
    });

    const existing = await profileRes.json();
    const currentDevices =
      Array.isArray(existing) && existing[0]?.devices_limit
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
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          premium: true,
          devices_limit: currentDevices,
        }),
      }
    );

    console.log("Supabase PATCH status:", updateRes.status);

    // Eliminamos cache local para que el cliente recargue con el nuevo estado
    // (opcional: el frontend borra su localStorage al volver).

    return res.status(200).json({ received: true, ok: true });
  } catch (error) {
    console.error("Error en webhook:", error);
    return res.status(500).json({ error: error.message });
  }
}