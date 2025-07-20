// Cloudflare Worker para el backend del chat vintage
// Nota: Los Workers no soportan WebSockets directamente, así que usaremos Server-Sent Events

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        // Configurar CORS
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        };

        // Manejar preflight requests
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        // Rutas de la API
        switch (path) {
            case "/api/auth/login":
                return handleLogin(request, env, corsHeaders);
            case "/api/auth/register":
                return handleRegister(request, env, corsHeaders);
            case "/api/auth/validate":
                return handleValidate(request, env, corsHeaders);
            case "/api/chat/messages":
                return handleMessages(request, env, corsHeaders);
            case "/api/chat/users":
                return handleUsers(request, env, corsHeaders);
            case "/api/chat/stream":
                return handleStream(request, env, corsHeaders);
            default:
                return new Response("Not Found", {
                    status: 404,
                    headers: corsHeaders,
                });
        }
    },
};

// Función para manejar login
async function handleLogin(request, env, corsHeaders) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // Aquí implementarías la lógica de autenticación
        // Por ahora, simulamos una respuesta exitosa
        const token = generateJWT({ username, userId: Date.now().toString() });

        return new Response(
            JSON.stringify({
                success: true,
                token,
                user: { username, userId: Date.now().toString() },
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        return new Response(JSON.stringify({ error: "Login failed" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
}

// Función para manejar registro
async function handleRegister(request, env, corsHeaders) {
    try {
        const body = await request.json();
        const { username, email, password } = body;

        // Aquí implementarías la lógica de registro
        const token = generateJWT({ username, userId: Date.now().toString() });

        return new Response(
            JSON.stringify({
                success: true,
                token,
                user: { username, userId: Date.now().toString() },
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        return new Response(JSON.stringify({ error: "Registration failed" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
}

// Función para validar token
async function handleValidate(request, env, corsHeaders) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return new Response(
                JSON.stringify({ error: "No token provided" }),
                {
                    status: 401,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                }
            );
        }

        const token = authHeader.split(" ")[1];
        // Aquí validarías el JWT
        const decoded = validateJWT(token, env.JWT_SECRET);

        return new Response(
            JSON.stringify({
                valid: true,
                user: decoded,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
}

// Función para manejar mensajes
async function handleMessages(request, env, corsHeaders) {
    try {
        if (request.method === "GET") {
            // Obtener mensajes
            const messages = await getMessages(env);
            return new Response(JSON.stringify(messages), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        } else if (request.method === "POST") {
            // Enviar mensaje
            const body = await request.json();
            await saveMessage(body, env);
            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
    } catch (error) {
        return new Response(
            JSON.stringify({ error: "Message operation failed" }),
            {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
}

// Función para manejar usuarios
async function handleUsers(request, env, corsHeaders) {
    try {
        const users = await getUsers(env);
        return new Response(JSON.stringify(users), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to get users" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
}

// Función para manejar stream de eventos
async function handleStream(request, env, corsHeaders) {
    const stream = new ReadableStream({
        start(controller) {
            // Enviar eventos cada 5 segundos
            const interval = setInterval(() => {
                const data = `data: ${JSON.stringify({
                    type: "ping",
                    timestamp: Date.now(),
                })}\n\n`;
                controller.enqueue(new TextEncoder().encode(data));
            }, 5000);

            // Limpiar cuando se cierre la conexión
            request.signal.addEventListener("abort", () => {
                clearInterval(interval);
                controller.close();
            });
        },
    });

    return new Response(stream, {
        headers: {
            ...corsHeaders,
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}

// Funciones auxiliares (implementaciones básicas)
function generateJWT(payload) {
    // Implementación básica de JWT
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload_b64 = btoa(JSON.stringify(payload));
    const signature = btoa("signature"); // En producción, usar una firma real
    return `${header}.${payload_b64}.${signature}`;
}

function validateJWT(token, secret) {
    // Implementación básica de validación JWT
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid token");

    const payload = JSON.parse(atob(parts[1]));
    return payload;
}

async function getMessages(env) {
    // Obtener mensajes desde KV
    const messages =
        (await env.CHAT_DATA.get("messages", { type: "json" })) || [];
    return messages;
}

async function saveMessage(message, env) {
    // Guardar mensaje en KV
    const messages = await getMessages(env);
    messages.push({
        ...message,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
    });
    await env.CHAT_DATA.put("messages", JSON.stringify(messages));
}

async function getUsers(env) {
    // Obtener usuarios desde KV
    const users = (await env.CHAT_DATA.get("users", { type: "json" })) || [];
    return users;
}
