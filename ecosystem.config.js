// PM2 Ecosystem Configuration for VPS Deployment
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'shamlai-frontend',
      script: 'node',
      args: 'server.js',
      cwd: process.cwd(),
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster', // Cluster mode for load balancing
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Auto-restart
      autorestart: true,
      watch: false,
      max_memory_restart: '1G', // Restart if memory exceeds 1GB

      // Advanced settings
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
    },
  ],
};
