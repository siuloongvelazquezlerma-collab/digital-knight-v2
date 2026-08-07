export default async function handler(req, res) {

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
                success: "https://digital-knight-v2.vercel.app/perfil.html",
                failure: "https://digital-knight-v2.vercel.app/perfil.html",
                pending: "https://digital-knight-v2.vercel.app/perfil.html"
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


        return res.status(200).json({
            init_point: data.init_point
        });


    } catch(error) {

        console.error(error);

        return res.status(500).json({
            error: "Error creando pago"
        });

    }

}