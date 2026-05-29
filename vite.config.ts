import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiPlugin = () => ({
  name: 'api-plugin',
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url?.startsWith('/api/gerar-plano')) {
        if (!process.env.GOOGLE_API_KEY) {
          try {
            const fs = await import('fs');
            const path = await import('path');
            const envPath = path.join(process.cwd(), '.env');
            if (fs.existsSync(envPath)) {
              const envContent = fs.readFileSync(envPath, 'utf8');
              envContent.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                  const key = parts[0].trim();
                  const val = parts.slice(1).join('=').trim();
                  if (key === 'GOOGLE_API_KEY' || key === 'VITE_GOOGLE_API_KEY') {
                    process.env[key] = val;
                  }
                }
              });
            }
          } catch (e) {
            console.error('Erro ao carregar .env no plugin Vite:', e);
          }
        }

        let body = {};
        if (req.method === 'POST') {
          body = await new Promise((resolve) => {
            let chunkStr = '';
            req.on('data', (chunk: any) => {
              chunkStr += chunk.toString();
            });
            req.on('end', () => {
              try {
                resolve(JSON.parse(chunkStr));
              } catch {
                resolve({});
              }
            });
          });
        }

        req.body = body;

        res.status = (statusCode: number) => {
          res.statusCode = statusCode;
          return res;
        };
        res.json = (data: any) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return res;
        };

        try {
          const handler = (await import('./api/gerar-plano')).default;
          await handler(req, res);
        } catch (err: any) {
          console.error('Erro ao processar chamada local da API:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message || 'Erro interno no middleware do Vite.' }));
        }
        return;
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin()],
})

