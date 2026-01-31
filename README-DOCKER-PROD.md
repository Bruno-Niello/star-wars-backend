# NestJS Star Wars API - Personal Project

Simple Docker setup for personal development.

## Quick Start

1. **Clone and run:**
   ```bash
   git clone <your-repo>
   cd nest-starwars
   npm run docker:up
   ```

2. **Access:**
   - API: http://localhost:3000
   - Docs: http://localhost:3000/api

3. **Stop:**
   ```bash
   npm run docker:down
   ```

## Commands

- `npm run docker:up` - Start everything
- `npm run docker:down` - Stop everything  
- `npm run docker:logs` - View logs

## What's included

- NestJS API on port 3000
- PostgreSQL database on port 5432
- Automatic JWT authentication
- Swagger API documentation

That's it! 🚀