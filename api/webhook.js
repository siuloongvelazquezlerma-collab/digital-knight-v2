
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

    if (key && value) {
      parts[key] = value;
    }
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

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(parts.v1, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
}

// =====================================================
// CONSULTAR MERCADO PAGO
// =====================================================

async function mpGet(path) {
  const response = await fetch(`${MP_API}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    },
  });

  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `Mercado Pago devolvió una respuesta no JSON. HTTP ${response.status}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Mercado Pago HTTP ${response.status}: ${JSON.stringify(data)}`
    );
  }

  return data;
}

// =====================================================
// ACTUALIZAR PERFIL
// =====================================================

async function supabasePatch(userId, fields) {
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

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

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Error actualizando perfil: ${text}`
    );
  }

  const rows = text ? JSON.parse(text) : [];

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(
      "No se encontró el perfil del usuario."
    );
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
      status: payment.status || null,
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

  // PLAN MENSUAL DE $40

  if (payment.preapproval_id) {
    subscriptionId = String(payment.preapproval_id);

    const subscription = await mpGet(
      `/preapproval/${encodeURIComponent(subscriptionId)}`
    );

    const subscriptionUserId = String(
      subscription.external_reference || ""
    ).trim();

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
    // PLAN DE $15 POR DOS MESES

    if (amount !== 15) {
      throw new Error(
        `Pago único no reconocido: ${amount} MXN`
      );
    }

    planId = "promo2";
  }

  if (!userId) {
    throw new Error(
      "El pago no tiene una referencia de usuario válida."
    );
  }

  // ACTIVAR MEDIANTE LA RPC DE SUPABASE

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

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

  const text = await response.text();

  let result;

  try {
    result = text ? JSON.parse(text) : null;
  } catch {
    result = text;
  }

  if (!response.ok) {
    throw new Error(
      `Error procesando pago en Supabase: ${JSON.stringify(result)}`
    );
  }

  console.log("PAGO PROCESADO:", {
    paymentId,
    planId,
    userId,
    result,
  });

  return {
    ok: true,
    payment_id: paymentId,
    plan: planId,
    result,
  };
}

// =====================================================
// PROCESAR RENOVACIÓN AUTOMÁTICA
// =====================================================

async function processAuthorizedPayment(invoiceId) {
  const invoice = await mpGet(
    `/authorized_payments/${encodeURIComponent(invoiceId)}`
  );

  if (invoice.payment?.status !== "approved") {
    return {
      ignored: true,
      reason: "La renovación todavía no está aprobada.",
      payment_status: invoice.payment?.status || null,
    };
  }

  const actualPaymentId = invoice.payment?.id;

  if (!actualPaymentId) {
    throw new Error(
      "La factura no contiene un ID de pago."
    );
  }

  const payment = await mpGet(
    `/v1/payments/${encodeURIComponent(actualPaymentId)}`
  );

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

  // COMPROBACIÓN DE LA URL
  // Abrir la dirección en un navegador no procesa pagos.

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      service: "DigitalKnight Webhook",
      message: "Webhook funcionando. Esperando notificaciones.",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método no permitido.",
    });
  }

  // VARIABLES NECESARIAS

  if (
    !process.env.MP_ACCESS_TOKEN ||
    !process.env.MP_WEBHOOK_SECRET ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error("Faltan variables de entorno.");

    return res.status(500).json({
      error: "Faltan variables de entorno necesarias.",
    });
  }

  try {
    const body = req.body || {};
    const query = req.query || {};

    const dataId = String(
      query["data.id"] ||
      query.data?.id ||
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

    console.log("NOTIFICACIÓN RECIBIDA:", {
      method: req.method,
      topic,
      dataId,
      action: body.action || null,
    });

    // VALIDAR FIRMA

    if (!validateSignature(req, dataId)) {
      console.warn(
        "Notificación rechazada: firma no válida."
      );

      return res.status(401).json({
        error: "Firma no válida.",
      });
    }

    // PAGOS

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

    // RENOVACIONES AUTOMÁTICAS

    if (topic === "subscription_authorized_payment") {
      const result = await processAuthorizedPayment(dataId);

      return res.status(200).json({
        received: true,
        event: "subscription_authorized_payment",
        result,
      });
    }

    // ACTUALIZACIONES DE SUSCRIPCIÓN

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

      await supabasePatch(userId, {
        subscription_id: dataId,
      });

      return res.status(200).json({
        received: true,
        event: "subscription_preapproval",
        subscription_status: subscription.status,
      });
    }

    // OTROS EVENTOS

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
      detail: error.message || "Error desconocido.",
    });
  }
}
