import './config/env.js';   // ← must be first (loads .env before anything else)

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { db } from './firebase-admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: [
    'https://smartbook-cafe.onrender.com',
    'https://smartbook-cafe-staff-portal.onrender.com',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:3000',
  ],
  allowedHeaders: ['Content-Type', 'x-staff-token'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));

app.use(express.json());
app.use(express.static(join(__dirname, '..', 'public')));

// ============================================================
// STAFF AUTHENTICATION
// ============================================================

const sessions = new Map();

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function authMiddleware(req, res, next) {
  const token = req.headers['x-staff-token'];
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.staffSession = sessions.get(token);
  next();
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const expectedUser = process.env.STAFF_USERNAME || 'staff';
  const expectedPass = process.env.STAFF_PASSWORD || 'smartbook2024';

  if (username === expectedUser && password === expectedPass) {
    const token = generateToken();
    sessions.set(token, { username, loggedInAt: new Date().toISOString() });
    return res.json({ token, username });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  sessions.delete(req.headers['x-staff-token']);
  res.json({ success: true });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.staffSession });
});

// ============================================================
// KITCHEN ORDERS
// ============================================================

app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const snapshot = await db.collection('orders').orderBy('timestamp', 'desc').get();
    const orders = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((o) => o.status === 'pending' || o.status === 'preparing');
    res.json({ orders });
  } catch (err) {
    console.error('[ORDERS]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/orders/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'preparing', 'ready', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await db.collection('orders').doc(id).update({
      status,
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[ORDERS]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// LIBRARY MONITORING
// ============================================================

app.get('/api/library', authMiddleware, async (req, res) => {
  try {
    const snapshot = await db.collection('library_checkins').orderBy('checkedInAt', 'desc').get();
    const checkins = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        docId: doc.id,
        ...data,
        checkedInAt: data.checkedInAt?.toDate?.() || null,
      };
    });
    res.json({ checkins });
  } catch (err) {
    console.error('[LIBRARY]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/library/:docId', authMiddleware, async (req, res) => {
  try {
    await db.collection('library_checkins').doc(req.params.docId).delete();
    res.json({ success: true });
  } catch (err) {
    console.error('[LIBRARY]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// CATALOG MANAGEMENT
// ============================================================

app.get('/api/catalog', authMiddleware, async (req, res) => {
  try {
    const snapshot = await db.collection('book_catalog').orderBy('addedAt', 'desc').get();
    const books = snapshot.docs.map((doc) => ({
      isbn: doc.id,
      ...doc.data(),
      addedAt: doc.data().addedAt?.toDate?.() || null,
    }));
    res.json({ books });
  } catch (err) {
    console.error('[CATALOG]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/catalog', authMiddleware, async (req, res) => {
  try {
    const book = req.body;
    if (!book.isbn) return res.status(400).json({ error: 'ISBN is required' });

    await db.collection('book_catalog').doc(book.isbn).set(
      { ...book, addedAt: new Date().toISOString() },
      { merge: true }
    );
    res.json({ success: true, isbn: book.isbn });
  } catch (err) {
    console.error('[CATALOG]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/catalog/:isbn', authMiddleware, async (req, res) => {
  try {
    await db.collection('book_catalog').doc(req.params.isbn).delete();
    res.json({ success: true });
  } catch (err) {
    console.error('[CATALOG]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// DASHBOARD STATS
// ============================================================

app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const [ordersSnap, librarySnap, catalogSnap] = await Promise.all([
      db.collection('orders').get(),
      db.collection('library_checkins').get(),
      db.collection('book_catalog').get(),
    ]);

    const activeOrders = ordersSnap.docs.filter((d) => {
      const s = d.data().status;
      return s === 'pending' || s === 'preparing';
    }).length;

    res.json({
      activeOrders,
      booksAtTables: librarySnap.size,
      catalogSize: catalogSnap.size,
    });
  } catch (err) {
    console.error('[STATS]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  SmartBook Staff Portal — Port ${PORT}     ║`);
  console.log(`║  http://localhost:${PORT}                   ║`);
  console.log(`╚══════════════════════════════════════════╝\n`);
});