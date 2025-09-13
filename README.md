# Juancito API

A Spanish language learning chatbot API using Google Gemini.

## Deployment Guide

### Prerequisites

- Docker installed on the server
- Git for repository cloning
- Nginx configured for reverse proxy
- API key for Google Gemini stored securely

### Deployment Steps

1. Clone the repository on your server:
   ```bash
   cd /home/owl1/Projects
   git clone https://github.com/sanchezle/juancito-node.git juancito-api
   cd juancito-api
   ```

2. Create a secrets file for the API key:
   ```bash
   mkdir -p /home/owl1/secrets
   echo "GEMINI_API_KEY=your-gemini-api-key" > /home/owl1/secrets/juancito_api_key.env
   ```

3. Update Nginx configuration:
   Add the following to `/etc/nginx/http.d/reverse-proxy.conf` in the luis-dev-lab.com server block:
   ```nginx
   # Juancito API application
   location /projects/juancito/ {
       proxy_pass http://127.0.0.1:5006/;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_set_header X-Forwarded-Host $host;
       proxy_set_header X-Forwarded-Port $server_port;

       # WebSocket support (if needed)
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection $connection_upgrade;

       # Timeouts
       proxy_connect_timeout 60s;
       proxy_send_timeout 60s;
       proxy_read_timeout 60s;
   }
   ```

4. Reload Nginx to apply changes:
   ```bash
   sudo nginx -t && sudo nginx -s reload
   ```

5. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

6. Verify deployment:
   - Check container status: `docker ps | grep juancito-api`
   - View logs: `docker logs juancito-api`
   - Test API: `curl https://luis-dev-lab.com/projects/juancito/health`

### Integration with Frontend

The API will be accessible at: `https://luis-dev-lab.com/projects/juancito`

The frontend is hosted at: `https://zingy-baklava-d1f0ae.netlify.app`

CORS is configured to allow requests from this Netlify domain.

### Container Management

- View logs: `docker logs juancito-api`
- Restart container: `docker restart juancito-api`
- Stop container: `docker stop juancito-api`
- Remove container: `docker rm juancito-api`

### Updating the API

To update the API with the latest code:

1. Pull the latest changes: `git pull`
2. Run the deployment script: `./deploy.sh`

The script will automatically rebuild the Docker image and restart the container.