/**
 * Cloudflare Worker - Webhook Proxy untuk Telegram Bot
 *
 * Setup:
 * 1. Login ke dash.cloudflare.com/workers
 * 2. Buat Worker baru
 * 3. Copy paste script ini
 * 4. Ganti GCP_VM_IP dengan IP External GCP kamu
 * 5. Deploy!
 *
 * URL Worker: https://your-worker.workers.dev
 * Set ke Telegram: /setWebhook?url=https://your-worker.workers.dev/bot<TOKEN>
 */

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

// GANTI INI dengan IP External GCP VM kamu!
const GCP_VM_IP = "34.56.112.197";
const GCP_PORT = 3000;

async function handleRequest(request) {
  const url = new URL(request.url);

  // Health check
  if (url.pathname === "/health") {
    return new Response("OK", { status: 200 });
  }

  // Hanya terima POST dari Telegram
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Cek path harus dimulai dengan /bot
  if (!url.pathname.startsWith("/bot")) {
    return new Response("Not found", { status: 404 });
  }

  try {
    // Forward request ke GCP VM (HTTP, bukan HTTPS!)
    const gcpUrl = `http://${GCP_VM_IP}:${GCP_PORT}${url.pathname}`;

    // Clone request body
    const body = await request.text();

    // Forward ke GCP
    const response = await fetch(gcpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": request.headers.get("CF-Connecting-IP") || "",
        "X-Forwarded-Proto": "https",
      },
      body: body,
      // Timeout 10 detik
      signal: AbortSignal.timeout(10000),
    });

    // Return response dari GCP
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error forwarding to GCP:", error);

    // Jika GCP down, tetap return 200 ke Telegram
    // (biar Telegram tidak retry terus-menerus)
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
