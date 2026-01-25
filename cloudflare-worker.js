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

// GANTI INI dengan IP External GCP VM kamu!
const GCP_VM_IP = "YOUR_GCP_EXTERNAL_IP";
const GCP_PORT = 3000;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (path === "/health" || path === "/") {
      return new Response("Worker OK", { 
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    }

    // Log incoming request
    console.log(`[${request.method}] ${path}`);

    // Hanya terima POST
    if (request.method !== "POST") {
      console.log("Rejected: Method not POST");
      return new Response("Method not allowed", { status: 405 });
    }

    // Cek path harus dimulai dengan /bot
    if (!path.startsWith("/bot")) {
      console.log("Rejected: Path doesn't start with /bot");
      return new Response("Not found", { status: 404 });
    }

    try {
      // Forward request ke GCP VM
      const gcpUrl = `http://${GCP_VM_IP}:${GCP_PORT}${path}`;
      console.log(`Forwarding to: ${gcpUrl}`);

      // Get request body
      const body = await request.text();
      console.log(`Body length: ${body.length} bytes`);

      // Forward ke GCP dengan timeout 15 detik
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(gcpUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "CloudflareWorker/1.0",
        },
        body: body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`GCP Response: ${response.status}`);

      // Return response dari GCP
      const responseBody = await response.text();
      return new Response(responseBody, {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "text/plain",
        },
      });
    } catch (error) {
      console.error(`Error: ${error.name} - ${error.message}`);

      // Jika timeout atau network error, return 200 ke Telegram
      // (supaya Telegram tidak retry terus)
      if (error.name === "AbortError") {
        console.log("Request timed out, returning 200 to Telegram");
        return new Response("OK", { status: 200 });
      }

      return new Response(`Error: ${error.message}`, { status: 502 });
    }
  }
};
