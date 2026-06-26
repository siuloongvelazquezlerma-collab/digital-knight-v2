const fs = require("fs");
const path = require("path");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Método no permitido" };
    }

    const body = JSON.parse(event.body);
    const base64 = body.image;

    const buffer = Buffer.from(base64.split(",")[1], "base64");

    const fileName = `share_${Date.now()}.jpg`;
    const filePath = path.join("www/shares", fileName);

    fs.writeFileSync(filePath, buffer);

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: `${process.env.URL}/shares/${fileName}`,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: "Error subiendo imagen: " + error.toString(),
    };
  }
};
