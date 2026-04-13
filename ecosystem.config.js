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
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
    },
  ],
}
