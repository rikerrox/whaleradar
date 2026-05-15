module.exports = {
  apps: [
    {
      name: 'whaleradar-app',
      script: 'server.js',
      cwd: '/home/deploy/whaleradar/.next/standalone',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
    {
      name: 'whaleradar-realtime',
      script: 'index.ts',
      cwd: '/home/deploy/whaleradar/mini-services/realtime-service',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
    },
  ],
};
