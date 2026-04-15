module.exports = {
  apps: [
    {
      name: 'the-scene',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      cwd: '/var/www/theScene/html',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
}
