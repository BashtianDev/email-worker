// Cloudflare Worker para procesar formularios de contacto y enviar emails con Resend
// Solo acepta peticiones desde https://alejandrocalvo.com

export default {
	async fetch(request, env, ctx) {
	  // Verificar el método HTTP
	  if (request.method !== "POST") {
		return new Response("Método no permitido", { status: 405 });
	  }
  
	  // Verificar el origen de la petición
	  const origin = request.headers.get("Origin");
	  if (origin !== "https://alejandrocalvo.com") {
		return new Response("Origen no autorizado", { status: 403 });
	  }
  
	  try {
		// Procesar los datos del formulario
		const formData = await request.formData();
		const name = formData.get("name") || "Sin nombre";
		const email = formData.get("email") || "Sin email";
		const message = formData.get("message") || "Sin mensaje";
		const subject = formData.get("subject") || "Sin asunto";
  
		// Configurar los headers para CORS
		const headers = {
		  "Access-Control-Allow-Origin": "https://alejandrocalvo.com",
		  "Access-Control-Allow-Methods": "POST, OPTIONS",
		  "Access-Control-Allow-Headers": "Content-Type",
		  "Content-Type": "application/json"
		};
  
		// Manejar la solicitud OPTIONS para CORS preflight
		if (request.method === "OPTIONS") {
		  return new Response(null, { headers, status: 204 });
		}
  
		// Enviar el email usando Resend
		const resendResponse = await fetch("https://api.resend.com/emails", {
		  method: "POST",
		  headers: {
			"Authorization": `Bearer ${env.RESEND_API_KEY}`,
			"Content-Type": "application/json"
		  },
		  body: JSON.stringify({
			from: "Formulario de Contacto <contacto@alejandrocalvo.com>",
			to: "alejandrocalvomartinez@gmail.com",
			subject: `Nuevo mensaje de contacto: ${subject}`,
			html: `
			  <h2>Nuevo mensaje de contacto</h2>
			  <p><strong>Nombre:</strong> ${name}</p>
			  <p><strong>Email:</strong> ${email}</p>
			  <p><strong>Asunto:</strong> ${subject}</p>
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
		  message: "Mensaje enviado correctamente" 
		}), { headers, status: 200 });
  
	  } catch (error) {
		// Manejar errores
		return new Response(JSON.stringify({ 
		  success: false, 
		  message: "Error al procesar la solicitud", 
		  error: error.message 
		}), { 
		  headers: {
			"Access-Control-Allow-Origin": "https://alejandrocalvo.com",
			"Content-Type": "application/json"
		  }, 
		  status: 500 
		});
	  }
	}
  };