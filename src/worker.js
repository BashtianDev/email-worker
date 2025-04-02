export default {
  async fetch(request, env, ctx) {
    // Verificar el método HTTP
    if (request.method !== "POST" && request.method !== "OPTIONS") {
      return new Response("Método no permitido", { status: 405 });
    }

    // Verificar el origen de la petición. Sustituir por orígenes permitidos
    const origin = request.headers.get("Origin");

    const allowedOrigins = [
      "https://alejandrocalvo.com",
      "https://alejandrocalvo-com.pages.dev",
    ];

    function isAllowedOrigin(origin) {
      if (!origin) {
        return false;
      }

      if (allowedOrigins.includes(origin)) {
        return true;
      }

      return origin.endsWith(".vercel.app");
    }

    if (!isAllowedOrigin(origin)) {
      return new Response("Origen no autorizado", { status: 403 });
    }

    try {
      // Configurar los headers para CORS
      const headers = {
        "Access-Control-Allow-Origin": "*", // Permitir todos los orígenes para test. 
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
      };

      // Manejar la solicitud OPTIONS para CORS preflight
      if (request.method === "OPTIONS") {
        return new Response(null, { headers, status: 204 });
      }

      // Procesar los datos del formulario (JSON)
      const contentType = request.headers.get("Content-Type");
      if (!contentType || !contentType.includes("application/json")) {
        return new Response("Formato de solicitud no válido", { status: 400 });
      }

      const body = await request.json();
      const { name, email, subject, message } = body;

      // Validar que los datos requeridos estén presentes
      if (!name || !email || !message) {
        return new Response("Faltan campos obligatorios", { status: 400 });
      }

      // Enviar el email usando Resend
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ // Configuración del formato del correo entrante. 
          from: "Formulario Web <contacto@alejandrocalvo.com>",
          to: "alejandrocalvomartinez@gmail.com",
          subject: `Mensaje: ${email} - ${subject || "Sin asunto"}`,
          html: `
            <h2>Nuevo mensaje de contacto</h2>
            <p><strong>Nombre:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Asunto:</strong> ${subject || "Sin asunto"}</p>
            <p><strong>Mensaje:</strong></p>
            <p>${message}</p>
          `
        })
      });

      const resendData = await resendResponse.json();

      if (!resendResponse.ok) {
        throw new Error(`Error al enviar email: ${JSON.stringify(resendData)}`);
      }

      // Responder al cliente
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Mensaje enviado correctamente. Responderemos lo antes posible." 
      }), { headers, status: 200 });

    } catch (error) {
      // Manejar errores
      console.error("Error en el worker:", error.message, error.stack);
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Error al procesar la solicitud", 
        error: error.message 
      }), { 
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Content-Type": "application/json"
        }, 
        status: 500 
      });
    }
  }
};