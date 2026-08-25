# InterviewAI Deployment Guide

## Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm start
```

## Environment Variables

### Required
- `GEMINI_API_KEY`: Your Gemini API key for AI features
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `APP_URL`: Your application URL (e.g., https://interviewai.yourdomain.com)

### Optional
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `LOG_LEVEL`: Logging level (debug/info/warn/error)

## Deployment Options

### 1. Docker Deployment
```bash
# Build Docker image
docker build -t interviewai .

# Run container
docker run -p 3000:3000 \
  -e GEMINI_API_KEY=your_key \
  -e GOOGLE_CLIENT_ID=your_id \
  -e GOOGLE_CLIENT_SECRET=your_secret \
  -e APP_URL=https://your-domain.com \
  interviewai
```

### 2. Docker Compose
```bash
# Create .env file with your values
cp .env.example .env

# Start services
docker-compose up -d
```

### 3. Platform Deployment (Render, Railway, Fly.io)
1. Connect your GitHub repository
2. Set environment variables in the platform dashboard
3. Deploy automatically on push to main branch

## Health Checks

The application includes two health check endpoints:

### `/health`
Basic health check for load balancers:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "production"
}
```

### `/monitor`
Detailed monitoring endpoint:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "memory": {
    "rss": "50 MB",
    "heapTotal": "30 MB",
    "heapUsed": "20 MB",
    "external": "5 MB"
  },
  "cpu": { "user": 12345, "system": 6789 },
  "environment": "production",
  "nodeVersion": "v20.11.0"
}
```

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push:

1. **Lint**: ESLint checks
2. **TypeCheck**: TypeScript compilation
3. **Test**: Unit tests
4. **Build**: Production build
5. **Deploy**: Automatic deployment on main/develop branches

### Pipeline Stages
- `develop` branch → Staging deployment
- `main` branch → Production deployment

## Monitoring and Logging

### Logging
The application uses a structured logger with levels:
- `debug`: Detailed debugging information
- `info`: General operational events
- `warn`: Warning messages
- `error`: Error conditions

### Request Logging
All requests (except health checks) are logged with:
- Method and path
- Response status code
- Response time
- Client IP

### Error Handling
Global error handler catches unhandled errors and returns:
- 500 status code
- Generic error message in production
- Detailed error in development

## Backup Strategy

### JSON Data Backup
Run the backup script:
```bash
node scripts/backup.js
```

This creates timestamped backups in the `backups/` directory and keeps the last 7 backups.

### Automated Backups
For production, set up automated backups:
```bash
# Add to crontab (daily at 2 AM)
0 2 * * * cd /path/to/interviewai && node scripts/backup.js
```

## Security Considerations

### Production Checklist
- [ ] Environment variables set securely (not in code)
- [ ] HTTPS enabled (via hosting platform)
- [ ] CORS configured for your domain
- [ ] Rate limiting implemented (if needed)
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (if using database)
- [ ] XSS protection enabled

### Cookie Security
Production cookies use:
- `HttpOnly`: Prevents JavaScript access
- `Secure`: HTTPS only
- `SameSite=None`: Required for cross-site OAuth

## Performance Optimization

### Build Optimization
- Vite for fast frontend builds
- esbuild for server bundling
- Tree shaking and code splitting

### Runtime Optimization
- Gzip compression (via hosting platform)
- Static asset caching
- Efficient JSON store for small datasets

## Troubleshooting

### Common Issues

1. **OAuth callback fails**
   - Ensure `APP_URL` matches your production domain
   - Check Google OAuth redirect URI settings

2. **AI features not working**
   - Verify `GEMINI_API_KEY` is set correctly
   - Check API quota and billing

3. **Build fails**
   - Run `npm run typecheck` to identify TypeScript errors
   - Ensure all dependencies are installed

4. **Server won't start**
   - Check port availability
   - Verify environment variables are set

### Logs
Check application logs for errors:
```bash
# Docker logs
docker logs <container_id>

# System logs (if using systemd)
journalctl -u interviewai
```

## Scaling Considerations

### Current Limitations
- JSON file storage (single instance only)
- No horizontal scaling
- Limited concurrent users

### Future Improvements
- Database migration (PostgreSQL)
- Load balancing
- Session store (Redis)
- CDN for static assets

## Support

For issues or questions:
1. Check the README.md
2. Review this deployment guide
3. Check application logs
4. Open an issue on GitHub