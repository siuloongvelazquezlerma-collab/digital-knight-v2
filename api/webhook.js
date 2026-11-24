
import crypto from "crypto";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  "https://wplyrhcszuoordgaphax.supabase.co";

const MP_API = "https://api.mercadopago.com";

// =====================================================
// VALIDAR FIRMA DE MERCADO PAGO
// =====================================================

function validateSignature(req, dataId) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  const signature = req.headers["x-signature"];
  const requestId = req.headers["x-request-id"];

  if (!secret || !signature || !requestId || !dataId) {
    return false;
  }

  const parts = {};

  signature.split(",").forEach((part) => {
    const [key, value] = part.trim().split("=");
    if (key && value) parts[key] = value;
  });

  if (!parts.ts || !parts.v1) return false;

  const manifest =
    `id:${String(dataId).toLowerCase()};` +
    `request-id:${requestId};` +
    `ts:${parts.ts};`;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  if (!/^[a-f0-9]{64}$/i.test(parts.v1)) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(parts.v1, "hex")
  );
}

// =====================================================
// CONSULTAR MERCADO PAGO
// =====================================================

async function mpGet(path) {
  const response = await fetch(`${MP_API}${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Mercado Pago HTTP ${response.status}: ${JSON.stringify(data)}`
    );
  }

  return data;
}

// =====================================================
// ACTUALIZAR PERFIL EN SUPABASE
// =====================================================

async function supabasePatch(userId, fields) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(fields),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Error actualizando perfil: ${await response.text()}`
    );
  }

  const rows = await response.json();

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("No se encontró el perfil del usuario.");
  }

  return rows[0];
}

// =====================================================
// PROCESAR PAGO APROBADO
// =====================================================

async function processApprovedPayment(payment) {
  if (payment.status !== "approved") {
    return {
      ignored: true,
      reason: "El pago todavía no está aprobado.",
    };
  }

  const paymentId = String(payment.id || "");
  const amount = Number(payment.transaction_amount);
  const currency = payment.currency_id;

  if (!paymentId) {
    throw new Error("Falta el ID del pago.");
  }

  if (currency !== "MXN") {
    throw new Error("La moneda del pago no es MXN.");
  }

  let userId = String(
    payment.external_reference || ""
  ).trim();

  let planId = "";
  let subscriptionId = null;

  // -------------------------------------------------
  // SUSCRIPCIÓN MENSUAL DE $40
  // -------------------------------------------------

  if (payment.preapproval_id) {
    subscriptionId = String(payment.preapproval_id);

    const subscription = await mpGet(
      `/preapproval/${encodeURIComponent(subscriptionId)}`
    );

    const subscriptionUserId = String(
      subscription.external_reference || ""
    ).trim();

    // La cuenta del pago y la de la suscripción
    // deben coincidir.
    if (
      userId &&
      subscriptionUserId &&
      userId !== subscriptionUserId
    ) {
      throw new Error(
        "El usuario del pago no coincide con la suscripción."
      );
    }

    userId = userId || subscriptionUserId;

    const recurringAmount = Number(
      subscription.auto_recurring?.transaction_amount
    );

    const recurringCurrency =
      subscription.auto_recurring?.currency_id;

    if (
      recurringAmount !== 40 ||
      recurringCurrency !== "MXN" ||
      amount !== 40
    ) {
      throw new Error(
        "La suscripción no corresponde al plan mensual de $40 MXN."
      );
    }

    planId = "monthly";

  } else {
    // -------------------------------------------------
    // PROMOCIÓN DE $15 POR DOS MESES
    // -------------------------------------------------

    if (amount !== 15) {
      throw new Error(
        `Pago único no reconocido: ${amount} MXN`
      );
    }

    planId = "promo2";
  }

  if (!userId || !paymentId) {
    throw new Error(
      "El pago no tiene una referencia de usuario válida."
    );
  }

  // -------------------------------------------------
  // REGISTRAR Y ACTIVAR MEDIANTE RPC
  // -------------------------------------------------

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/process_dk_payment`,
    {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_payment_id: paymentId,
        p_user_id: userId,
        p_plan_id: planId,
        p_amount: amount,
        p_currency_id: currency,
        p_subscription_id: subscriptionId,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      `Error procesando pago en Supabase: ${JSON.stringify(result)}`
    );
  }

  console.log("Resultado de activación:", result);

  return {
    ok: true,
    payment_id: paymentId,
    user_id: userId,
    plan: planId,
    result,
  };
}

// =====================================================
// PROCESAR RENOVACIÓN AUTOMÁTICA
// =====================================================

async function processAuthorizedPayment(invoiceId) {
  // El ID recibido es el ID de la factura.
  const invoice = await mpGet(
    `/authorized_payments/${encodeURIComponent(invoiceId)}`
  );

  console.log("Factura de suscripción:", invoice);

  // La factura puede estar pendiente aunque ya exista.
  if (invoice.payment?.status !== "approved") {
    return {
      ignored: true,
      reason: "La renovación todavía no está aprobada.",
      invoice_status: invoice.status,
      payment_status: invoice.payment?.status || null,
    };
  }

  const actualPaymentId = invoice.payment?.id;

  if (!actualPaymentId) {
    throw new Error(
      "La factura no contiene un ID de pago."
    );
  }

  // Consultar el pago real para comprobar todos sus datos.
  const payment = await mpGet(
    `/v1/payments/${encodeURIComponent(actualPaymentId)}`
  );

  // Usar también los datos de la factura si algún campo
  // no aparece en el objeto del pago.
  payment.preapproval_id =
    payment.preapproval_id || invoice.preapproval_id;

  payment.external_reference =
    payment.external_reference || invoice.external_reference;

  return await processApprovedPayment(payment);
}

// =====================================================
// HANDLER PRINCIPAL
// =====================================================

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método no permitido.",
    });
  }

  if (
    !process.env.MP_ACCESS_TOKEN ||
    !process.env.MP_WEBHOOK_SECRET ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return res.status(500).json({
      error: "Faltan variables de entorno necesarias.",
    });
  }

  try {
    const body = req.body || {};
    const query = req.query || {};

    const dataId = String(
      query["data.id"] ||
      query.id ||
      body.data?.id ||
      ""
    ).trim();

    const topic = String(
      query.type ||
      query.topic ||
      body.type ||
      body.topic ||
      ""
    ).toLowerCase();

    if (!dataId || !topic) {
      return res.status(400).json({
        error: "Faltan el ID o el tipo de notificación.",
      });
    }

    // -------------------------------------------------
    // VALIDACIÓN DE FIRMA
    // -------------------------------------------------

    if (!validateSignature(req, dataId)) {
      console.warn("Webhook rechazado: firma no válida.");

      return res.status(401).json({
        error: "Firma no válida.",
      });
    }

    console.log("=================================");
    console.log("WEBHOOK MERCADO PAGO");
    console.log("Evento:", topic);
    console.log("ID:", dataId);
    console.log("=================================");

    // -------------------------------------------------
    // 1. PAGO NORMAL O PAGO DE SUSCRIPCIÓN
    // -------------------------------------------------

    if (topic === "payment") {
      const payment = await mpGet(
        `/v1/payments/${encodeURIComponent(dataId)}`
      );

      const result = await processApprovedPayment(payment);

      return res.status(200).json({
        received: true,
        event: "payment",
        result,
      });
    }

    // -------------------------------------------------
    // 2. RENOVACIÓN AUTOMÁTICA
    // -------------------------------------------------

    if (topic === "subscription_authorized_payment") {
      const result = await processAuthorizedPayment(dataId);

      return res.status(200).json({
        received: true,
        event: "subscription_authorized_payment",
        result,
      });
    }

    // -------------------------------------------------
    // 3. CREACIÓN O ACTUALIZACIÓN DE SUSCRIPCIÓN
    // -------------------------------------------------

    if (topic === "subscription_preapproval") {
      const subscription = await mpGet(
        `/preapproval/${encodeURIComponent(dataId)}`
      );

      const userId = String(
        subscription.external_reference || ""
      ).trim();

      if (!userId) {
        return res.status(200).json({
          received: true,
          ignored: "Suscripción sin external_reference.",
        });
      }

      // Guardamos el ID de la suscripción.
      // No activamos Premium hasta confirmar el cobro.
      await supabasePatch(userId, {
        subscription_id: dataId,
      });

      console.log(
        "Suscripción actualizada:",
        subscription.status
      );

      // Una cancelación no elimina los días ya pagados.
      // El vencimiento existente se conserva.

      return res.status(200).json({
        received: true,
        event: "subscription_preapproval",
        subscription_status: subscription.status,
      });
    }

    // -------------------------------------------------
    // 4. EVENTOS NO UTILIZADOS
    // -------------------------------------------------

    console.log("Evento ignorado:", topic);

    return res.status(200).json({
      received: true,
      ignored: true,
      topic,
    });

  } catch (error) {
    console.error("ERROR WEBHOOK:", error);

    return res.status(500).json({
      error: "Error procesando la notificación.",
    });
  }
}
