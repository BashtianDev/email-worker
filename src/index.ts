//worker.ts
addEventListener('fetch', (event: FetchEvent) => {
	event.respondWith(handleRequest(event.request, (event as any).env)); // Cast para acceder a `env`
});

async function handleRequest(request: Request, env: { RESEND_API_KEY: string }) {
	const url = new URL(request.url);

	// Manejar solicitudes OPTIONS (preflight)
	if (request.method === 'OPTIONS') {
	  return new Response(null, {
		status: 204, // No Content
		headers: {
		  'Access-Control-Allow-Origin': 'https://alejandrocalvo.com',
		  'Access-Control-Allow-Methods': 'POST, OPTIONS',
		  'Access-Control-Allow-Headers': 'Content-Type',
		},
	  });
	}

	// Solo permitir solicitudes POST a /api/contact
	if (request.method === 'POST') {
	  try {
		console.log('Solicitud POST recibida:', request.url);

		// Validar Content-Type
		const contentType = request.headers.get('Content-Type');
		if (!contentType?.includes('application/json')) {
		  console.error('Content-Type inválido:', contentType);
		  return new Response(JSON.stringify({ success: false, message: 'Content-Type debe ser application/json' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://alejandrocalvo.com' },
		  });
		}

		 // Definir tipo para los datos del formulario
		type FormData = {
			name: string;
			email: string;
			subject: string;
			message: string;
		};

		// Parsear datos del cuerpo de la solicitud
		let formData: FormData;
		try {
		  formData = await request.json() as FormData; // Cast explícito
		  console.log('Datos del formulario recibidos:', formData);
		} catch (parseError) {
		  console.error('Error al parsear JSON:', parseError);
		  return new Response(JSON.stringify({ success: false, message: 'Cuerpo de la solicitud no es un JSON válido' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://alejandrocalvo.com' },
		  });
		}

		const { name, email, subject, message } = formData;

		// Validar campos obligatorios
		if (!name || !email || !subject || !message) {
		  console.error('Campos obligatorios faltantes:', { name, email, subject, message });
		  return new Response(JSON.stringify({ success: false, message: 'Todos los campos son obligatorios' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://alejandrocalvo.com' },
		  });
		}

		// Validar formato del email
		if (!/^\S+@\S+\.\S+$/.test(email)) {
		  console.error('Formato de email inválido:', email);
		  return new Response(JSON.stringify({ success: false, message: 'Formato de email inválido' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://alejandrocalvo.com' },
		  });
		}

		// Verificar la clave API de Resend
		const resendApiKey = env.RESEND_API_KEY; // Acceder a la variable de entorno
		if (!resendApiKey) {
		  console.error('RESEND_API_KEY no está configurada');
		  return new Response(JSON.stringify({ success: false, message: 'Error de configuración del servidor' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://alejandrocalvo.com' },
		  });
		}
		console.log('RESEND_API_KEY configurada correctamente');

		// Enviar correo usando la API de Resend
		console.log('Enviando correo con Resend...');
		const response = await fetch('https://api.resend.com/emails', {
		  method: 'POST',
		  headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${resendApiKey}`,
		  },
		  body: JSON.stringify({
			from: 'Formulario Web <contacto@alejandrocalvo.com>',
			to: ['tu-correo@example.com'], // Reemplaza con tu correo
			subject: `AlejandroCalvo.com - Nuevo mensaje: ${subject}`,
			html: `
			  <h3>Nuevo mensaje</h3>
			  <p><strong>Nombre:</strong> ${name}</p>
			  <p><strong>Email:</strong> ${email}</p>
			  <p><strong>Mensaje:</strong> ${message}</p>
			`,
		  }),
		});

		// Manejar errores de la API de Resend
		if (!response.ok) {
		  const errorData: { message?: string } = await response.json(); // Especificar tipo esperado
		  console.error('Error de Resend:', errorData);
		  return new Response(JSON.stringify({ success: false, message: errorData.message || 'Error al enviar el correo' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://alejandrocalvo.com' },
		  });
		}

		console.log('Correo enviado correctamente.');
		return new Response(JSON.stringify({ success: true, message: 'Correo enviado. Contactaré contigo lo antes posible.' }), {
		  status: 200,
		  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://alejandrocalvo.com' },
		});
	  } catch (error) {
		console.error('Error inesperado:', error);
		return new Response(JSON.stringify({ success: false, message: 'Error interno del servidor' }), {
		  status: 500,
		  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'https://alejandrocalvo.com' },
		});
	  }
	}

	// Método no permitido
	return new Response('Método no permitido', { status: 405 });
}