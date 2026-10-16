import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// File-based shared database path
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Read database from disk
function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }
  return null;
}

// Write database to disk
function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

// ==========================================
// REAL-TIME WEBSOCKET & SSE BROADCAST ENGINE
// ==========================================

// 1. WebSocket Server on /ws
const wss = new WebSocketServer({ server, path: '/ws' });

// 2. SSE clients as fallback
const sseClients = new Set<express.Response>();

// Broadcast change to both WebSocket and SSE clients instantly
function broadcastDataChange(key: string, data: any, originClientId?: string, timestamp?: string) {
  const ts = timestamp || new Date().toISOString();

  // A. Broadcast to WebSocket clients
  const wsPayload = JSON.stringify({
    type: 'DATA_CHANGED',
    key,
    data,
    originClientId: originClientId || null,
    timestamp: ts,
  });

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(wsPayload);
      } catch (err) {
        console.error('WS send error:', err);
      }
    }
  }

  // B. Broadcast to SSE clients
  const ssePayload = JSON.stringify({
    type: 'DATA_UPDATED',
    key,
    originClientId: originClientId || null,
    timestamp: ts,
  });

  for (const client of sseClients) {
    try {
      client.write(`data: ${ssePayload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

// WebSocket connection lifecycle
wss.on('connection', (socket: WebSocket) => {
  // Send current authoritative data immediately on connection
  const db = readDb() || {};
  socket.send(
    JSON.stringify({
      type: 'INIT',
      data: db,
      timestamp: db.lastUpdated || new Date().toISOString(),
    })
  );

  socket.on('message', (rawMessage: string | Buffer) => {
    try {
      const messageStr = rawMessage.toString();
      const parsed = JSON.parse(messageStr);

      if (parsed.type === 'SYNC_UPDATE') {
        const { key, data, clientId } = parsed;
        if (key) {
          const db = readDb() || {};
          db.timestamps = db.timestamps || {};
          const now = new Date().toISOString();
          db[key] = data;
          db.timestamps[key] = now;
          db.lastUpdated = now;
          writeDb(db);
          broadcastDataChange(key, data, clientId, db.lastUpdated);
        }
      } else if (parsed.type === 'SYNC_ALL') {
        const { data, clientId } = parsed;
        if (data && typeof data === 'object') {
          const db = readDb() || {};
          db.timestamps = db.timestamps || {};
          const now = new Date().toISOString();
          for (const k of Object.keys(data)) {
            db[k] = data[k];
            db.timestamps[k] = now;
          }
          db.lastUpdated = now;
          writeDb(db);
          broadcastDataChange('all', db, clientId, db.lastUpdated);
        }
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  socket.on('error', (err) => {
    console.error('WebSocket client error:', err);
  });
});

// SSE Endpoint (Secondary Real-time fallback)
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', clients: sseClients.size + 1 })}\n\n`);
  sseClients.add(res);

  const keepAlive = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(keepAlive);
      sseClients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
});

// Get all shared clinical data
app.get('/api/data', (_req, res) => {
  const db = readDb();
  if (db) {
    return res.json(db);
  }
  return res.json({});
});

// Sync any single data section (patients, vitals, medications, handovers, etc.)
app.post('/api/sync', (req, res) => {
  const { key, data, clientId } = req.body;
  if (!key) {
    return res.status(400).json({ error: 'Missing key' });
  }

  const db = readDb() || {};
  db.timestamps = db.timestamps || {};
  const now = new Date().toISOString();
  db[key] = data;
  if (key === 'nurses') {
    db.nursesCustomized = true;
  }
  db.timestamps[key] = now;
  db.lastUpdated = now;
  writeDb(db);

  // Broadcast instantly to all users
  broadcastDataChange(key, data, clientId, db.lastUpdated);

  return res.json({ success: true, timestamp: db.lastUpdated, keyTimestamp: now });
});

// Dedicated endpoint to permanently clear demo / default nurses
app.post('/api/clear-demo-nurses', (req, res) => {
  const { clientId } = req.body;
  const db = readDb() || {};
  const demoNames = new Set([
    'Ns. Ratna Dewi, S.Kep',
    'Ns. Budi Santoso, S.Kep',
    'Ns. Siti Rahmah, S.Kep',
    'Ns. Dimas Pratama, S.Kep',
    'Ns. Hj. Mariana, S.Kep., M.Kep',
  ].map(s => s.toLowerCase()));

  const currentNurses = Array.isArray(db.nurses) ? db.nurses : [];
  const remaining = currentNurses.filter((n: any) => !demoNames.has((n.name || '').trim().toLowerCase()));

  const now = new Date().toISOString();
  db.nurses = remaining;
  db.nursesCustomized = true;
  db.timestamps = db.timestamps || {};
  db.timestamps['nurses'] = now;
  db.lastUpdated = now;
  writeDb(db);

  broadcastDataChange('nurses', remaining, clientId, db.lastUpdated);
  return res.json({ success: true, nurses: remaining });
});

// Bulk sync all data
app.post('/api/sync-all', (req, res) => {
  const payload = req.body;
  const clientId = payload.clientId;
  delete payload.clientId;

  const db = readDb() || {};
  db.timestamps = db.timestamps || {};
  const now = new Date().toISOString();
  for (const k of Object.keys(payload)) {
    db[k] = payload[k];
    db.timestamps[k] = now;
  }
  db.lastUpdated = now;
  writeDb(db);

  // Broadcast instantly to all users
  broadcastDataChange('all', db, clientId, db.lastUpdated);

  return res.json({ success: true, timestamp: db.lastUpdated });
});

// Full reset endpoint
app.post('/api/reset', (_req, res) => {
  if (fs.existsSync(DB_FILE)) {
    try {
      fs.unlinkSync(DB_FILE);
    } catch {}
  }
  broadcastDataChange('reset', {}, undefined, new Date().toISOString());
  return res.json({ success: true, message: 'Database reset' });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    system: 'ETAM CARE Real-Time Server',
    connectedWsClients: wss.clients.size,
    time: new Date().toISOString(),
  });
});

// ==========================================
// VITE DEV MIDDLEWARE / STATIC PRODUCTION
// ==========================================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[ETAM CARE] Real-Time Server running on http://0.0.0.0:${PORT} (WS on /ws)`);
  });
}

startServer();
