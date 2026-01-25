/**
 * PM2 Ecosystem Configuration
 * Optimized for low-memory VPS/VM (256MB-512MB RAM)
 */

module.exports = {
  apps: [
    {
      name: "renungan-bot",
      script: "src/index.js",

      // Node.js memory optimization - Max 480MB (safe under 500MB)
      node_args: "--expose-gc --max-old-space-size=480 --optimize-for-size",

      // Auto restart jika memory > 480MB
      max_memory_restart: "480M",

      // Environment
      env: {
        NODE_ENV: "production",
      },

      // Logging
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      merge_logs: true,

      // Restart behavior
      autorestart: true,
      max_restarts: 10,
      min_uptime: "30s",
      restart_delay: 5000,

      // Watch disabled (save CPU)
      watch: false,

      // Cron restart (opsional - restart setiap hari jam 3 pagi)
      // cron_restart: "0 3 * * *",

      // Kill timeout
      kill_timeout: 10000,

      // Single instance only
      instances: 1,
      exec_mode: "fork",
    },
  ],
};
