module.exports = {
  apps : [
    {
      name: "interface",
      script: "server/app.js",
      env: {
        NODE_ENV: "production"
      },
      instances: 0,
      exec_mode: "cluster",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      max_memory_restart: "1024M"
    }
  ]
};