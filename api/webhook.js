// ---------------------------------------------------------------------------
// Vercel Serverless Function: WEBHOOK de Mercado Pago
// ---------------------------------------------------------------------------
// Mercado Pago notifica a esta URL cuando hay cambios de pago o de
// SUSCRIPCION: https://digitalknightapp.com/api/webhook
//
// Variables de entorno necesarias en Vercel:
//   MP_ACCESS_TOKEN      -> Access Token de Mercado Pago (PRODUCCION "APP_USR-...")
//   SUPABASE_URL         -> https://wplyrhcszuoordgaphax.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY -> Service Role Key de tu proyecto Supabase
//
// Flujo:
//   A) Notificacion de PAGO: si esta APPROVED se activa premium = true.
//      Si viene de una SUSCRIPCION (preapproval), se extiende premium_until
//      un mes mas (renovacion automatica).
//   B) Notificacion de SUSCRIPCION (preapproval): si esta "authorized" se
//      activa premium y se fija premium_until con la fecha del proximo cobro.
// ---------------------------------------------------------------------------

const supabaseUrl =
  process.env.SUPABASE_URL || "https://wplyrhcszuoordgaphax.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function mpHeaders() {
  return { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` };
}

async function getProfile(userId) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
    }
  );
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function patchProfile(userId, fields) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`,
    {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(fields),
    }
  );
  console.log("Supabase PATCH status:", res.status, "campos:", fields);
  return res.ok;
}

// Suma "n" meses a una fecha (ISO string o Date) -> ISO string
function addMonths(dateLike, n) {
  const d = dateLike ? new Date(dateLike) : new Date();
  if (isNaN(d.getTime())) return addMonths(null, n);
  d.setMonth(d.getMonth() + n);
  return d.toISOString();
}

export default async function handler(req, res) {
  console.log("WEBHOOK Mercado Pago recibido:", req.method);

  // Tipo de notificacion: "payment" o "preapproval" (suscripcion)
  const topic =
    req.body?.type || req.body?.topic ||
    req.query?.type || req.query?.topic || "payment";

  const dataId = req.body?.data?.id || req.query?.id || req.query?.data_id || "";

  console.log("topic:", topic, "| dataId:", dataId);

  // Responder rapido (200) para que Mercado Pago no reintente.
  if (!dataId) {
    return res.status(200).json({ received: true });
  }

  if (!serviceKey) {
    console.error("Falta SUPABASE_SERVICE_ROLE_KEY");
    return res.status(500).json({ error: "Falta service key" });
  }

  try {
    // ================================================================
    // B) SUSCRIPCION (preapproval)
    // ================================================================
    if (String(topic).includes("preapproval") || String(topic).includes("subscription")) {
      const mpRes = await fetch(
        `https://api.mercadopago.com/preapproval/${dataId}`,
        { headers: mpHeaders() }
      );
      const sub = await mpRes.json();
      console.log("Detalle de la suscripcion:", sub);

      const userId = String(sub.external_reference || "").trim();
      if (!userId) {
        console.warn("Suscripcion sin external_reference (no activamos).");
        return res.status(200).json({ received: true });
      }

      if (sub.status === "authorized") {
        const until =
          sub.next_payment_date || sub.auto_recurring?.next_payment_date;

        await patchProfile(userId, {
          premium: true,
          premium_since: sub.start_date || new Date().toISOString(),
          premium_until: until || addMonths(null, 1),
        });
        return res.status(200).json({ received: true, ok: true });
      }

      // Suscripcion pausada/cancelada: se apaga el premium
      if (["cancelled", "paused"].includes(sub.status)) {
        await patchProfile(userId, { premium: false });
        console.log("Suscripcion", sub.status, "-> premium desactivado.");
      }

      return res.status(200).json({ received: true, state: sub.status });
    }

    // ================================================================
    // A) PAGO (unico o mensual de una suscripcion)
    // ================================================================
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${dataId}`,
      { headers: mpHeaders() }
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
    const profile = await getProfile(userId);
    const currentDevices = profile?.devices_limit || 3;

    const fields = {
      premium: true,
      devices_limit: currentDevices,
    };

    // Si el pago viene de una SUSCRIPCION (cobro mensual automatico),
    // extendemos el vencimiento un mes mas (desde el vencimiento actual
    // si aun no expira, para no perder dias).
    if (payment.preapproval_id) {
      const base =
        profile?.premium_until && new Date(profile.premium_until) > new Date()
          ? profile.premium_until
          : null;
      fields.premium_since = profile?.premium_since || new Date().toISOString();
      fields.premium_until = addMonths(base, 1);
    }

    await patchProfile(userId, fields);

    return res.status(200).json({ received: true, ok: true });
  } catch (error) {
    console.error("Error en webhook:", error);
    return res.status(500).json({ error: error.message });
  }
}