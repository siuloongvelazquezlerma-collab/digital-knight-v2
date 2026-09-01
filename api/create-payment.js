export default async function handler(req, res) {

    console.log("API CREATE PAYMENT FUNCIONANDO");

    console.log(
        "TOKEN EXISTE:",
        process.env.MP_ACCESS_TOKEN ? "SI" : "NO"
    );


    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Método no permitido"
        });
    }


    try {

        const paymentData = {
            items: [
                {
                    title: "Digital Knight Premium",
                    quantity: 1,
                    unit_price: 30
                }
            ],

            back_urls: {
                success: "https://digitalknightapp.com/perfil.html",
                failure: "https://digitalknightapp.com/perfil.html",
                pending: "https://digitalknightapp.com/perfil.html"
            },

            auto_return: "approved"
        };


        const response = await fetch(
            "https://api.mercadopago.com/checkout/preferences",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization":
                    `Bearer ${process.env.MP_ACCESS_TOKEN}`
                },

                body: JSON.stringify(paymentData)
            }
        );


        const data = await response.json();


        console.log("RESPUESTA MERCADO PAGO:", data);


        if (!response.ok) {

            return res.status(response.status).json({
                error: data
            });

        }


        return res.status(200).json({
            init_point: data.init_point
        });


    } catch (error) {

        console.error("ERROR MERCADO PAGO:", error);

        return res.status(500).json({
            error: error.message
        });

    }

}