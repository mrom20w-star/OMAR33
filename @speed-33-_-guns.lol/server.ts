import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Persistent data directory
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'visitors.json');

interface VisitorStore {
  count: number;
}

function initStore(): VisitorStore {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const initial: VisitorStore = { count: 1 };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }

  try {
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    return {
      count: typeof parsed.count === 'number' ? parsed.count : 1,
    };
  } catch (err) {
    console.error('Error reading visitor store:', err);
    return { count: 1 };
  }
}

function saveStore(store: VisitorStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving visitor store:', err);
  }
}

// Ensure store is initialized on start
let visitorStore = initStore();

// API endpoint to fetch current view count
app.get('/api/views', (_req: Request, res: Response) => {
  visitorStore = initStore();
  res.json({ count: visitorStore.count });
});

// API endpoint to record visit (increments every time someone visits/enters the site)
app.post('/api/views', (_req: Request, res: Response) => {
  visitorStore = initStore();
  visitorStore.count += 1;
  saveStore(visitorStore);
  res.json({ count: visitorStore.count });
});

// Start Express + Vite (in dev) or static files (in prod)
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
