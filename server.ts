import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { citypulseDb } from './src/server/database';
import { hashPassword, comparePassword, signToken, verifyToken } from './src/server/auth';
import { analyzeIssueWithGemini } from './src/server/ai';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = 3000;

// Initialize Realtime Socket.IO
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Middleware for parsing JSON with limit for photo uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Auth Token Extractor Middleware
function authenticateUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      (req as any).user = decoded;
    }
  }
  next();
}

app.use(authenticateUser);

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Citypulse', timestamp: new Date().toISOString() });
});

// ==========================================
// AUTHENTICATION ROUTES (Section 26 & 27)
// ==========================================

// POST /api/auth/signup - Citizen registration
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, age, area } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existing = citypulseDb.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await hashPassword(password);
    const user = citypulseDb.createUser({
      email,
      passwordHash,
      name,
      role: 'CITIZEN',
      age: age ? Number(age) : undefined,
      area: area ? String(area) : undefined,
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        age: user.age,
        area: user.area,
      },
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Signup failed' });
  }
});

// POST /api/auth/login - Citizen or Authority Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, targetRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = citypulseDb.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. No account found with this email.' });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Role Verification: Never trust client-side role claims
    if (targetRole === 'AUTHORITY' && user.role !== 'AUTHORITY' && user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Access denied: This account does not possess municipal authority credentials.',
      });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.json({
      message: 'Authentication successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        age: user.age,
        area: user.area,
      },
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// GET /api/auth/me - Current user session
app.get('/api/auth/me', (req, res) => {
  const currentUser = (req as any).user;
  if (!currentUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = citypulseDb.findUserById(currentUser.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      age: user.age,
      area: user.area,
    },
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// ==========================================
// REPORTS ROUTES (Section 16, 17, 18, 19, 20)
// ==========================================

// Helper function to handle reports list
function handleGetReports(req: express.Request, res: express.Response) {
  try {
    const { search, category, status, severity, sort, userId } = req.query;
    const reports = citypulseDb.getAllReports({
      search: search ? String(search) : undefined,
      category: category ? String(category) : undefined,
      status: status ? String(status) : undefined,
      severity: severity ? String(severity) : undefined,
      sort: sort ? String(sort) : undefined,
      userId: userId ? String(userId) : undefined,
    });
    res.json(reports);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch reports' });
  }
}

// GET /api/reports & /api/issues
app.get('/api/reports', handleGetReports);
app.get('/api/issues', handleGetReports);

// GET /api/reports/:id & /api/issues/:id
function handleGetReportById(req: express.Request, res: express.Response) {
  const report = citypulseDb.getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(report);
}
app.get('/api/reports/:id', handleGetReportById);
app.get('/api/issues/:id', handleGetReportById);

// POST /api/reports & /api/issues - Submit new report with Realtime Broadcast
async function handleCreateReport(req: express.Request, res: express.Response) {
  try {
    const {
      title,
      description,
      category,
      severity,
      latitude,
      longitude,
      address,
      photo_url,
      is_anonymous,
      created_by,
      ai_summary,
      ai_severity,
      ai_confidence,
      ai_reason,
      recommended_action,
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required.' });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Valid latitude and longitude are required.' });
    }

    const currentUser = (req as any).user;

    const newReport = citypulseDb.createReport({
      title,
      description,
      category,
      severity: severity || 'medium',
      latitude: lat,
      longitude: lng,
      address: address || 'Current GPS Location',
      photo_url,
      is_anonymous: Boolean(is_anonymous),
      created_by: currentUser ? currentUser.name : created_by || 'Citizen',
      userId: currentUser ? currentUser.userId : undefined,
      ai_summary,
      ai_severity,
      ai_confidence,
      ai_reason,
      recommended_action,
    });

    // Realtime Broadcast to all connected clients (Section 18 & 19)
    io.emit('report.created', newReport);
    console.log(`[Realtime] Emitted report.created for #${newReport.id}: "${newReport.title}"`);

    res.status(201).json(newReport);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create report' });
  }
}
app.post('/api/reports', handleCreateReport);
app.post('/api/issues', handleCreateReport);

// PATCH /api/reports/:id/status & /api/issues/:id/status - Update Status with Realtime Broadcast
function handleUpdateStatus(req: express.Request, res: express.Response) {
  try {
    const { status, comment, updated_by } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const currentUser = (req as any).user;
    const authorName = currentUser?.name || updated_by || 'Authority Official';

    const updated = citypulseDb.updateReportStatus(
      req.params.id,
      status,
      comment || `Status updated to ${status.toUpperCase()}`,
      authorName
    );

    if (!updated) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Realtime Broadcast to all connected clients (Section 20)
    io.emit('report.updated', updated);
    console.log(`[Realtime] Emitted report.updated for #${updated.id} -> ${status}`);

    res.json({ ...updated, message: 'Status updated successfully', issue: updated, report: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update status' });
  }
}
app.patch('/api/reports/:id/status', handleUpdateStatus);
app.patch('/api/issues/:id/status', handleUpdateStatus);
app.patch('/api/reports/:id', handleUpdateStatus);

// POST /api/reports/:id/upvote & /api/issues/:id/upvote
function handleUpvote(req: express.Request, res: express.Response) {
  try {
    const updated = citypulseDb.addUpvote(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: 'Report not found' });
    }

    io.emit('report.updated', updated);
    res.json({ upvotes: updated.upvotes, priority_score: updated.priority_score, report: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to upvote' });
  }
}
app.post('/api/reports/:id/upvote', handleUpvote);
app.post('/api/issues/:id/upvote', handleUpvote);

// GET /api/reports/:id/history
app.get('/api/reports/:id/history', (req, res) => {
  const report = citypulseDb.getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(report.history || []);
});
app.get('/api/issues/:id/history', (req, res) => {
  const report = citypulseDb.getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(report.history || []);
});

// GET /api/analytics - Analytics & community intelligence
app.get('/api/analytics', (req, res) => {
  try {
    const data = citypulseDb.getAnalytics();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate analytics' });
  }
});

// POST /api/ai/analyze - Pre-submission Gemini AI analysis
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { title, description, category, location, photo } = req.body;
    if (!title && !description) {
      return res.status(400).json({ error: 'Title or description required for AI analysis' });
    }

    const analysis = await analyzeIssueWithGemini(
      title || 'Civic Issue',
      description || '',
      category,
      location,
      photo
    );

    res.json(analysis);
  } catch (err: any) {
    console.error('AI Analysis failed, returning fallback:', err);
    res.json({
      summary: `${req.body.title || 'Civic Issue'} reported.`,
      category: req.body.category || 'other',
      severity: 'medium',
      confidence: 0.85,
      reason: 'Citizen direct submission.',
      recommended_action: 'Dispatch field inspection squad.',
    });
  }
});

// Static serving for scroll animation frames
app.use('/scrollanimation', express.static(path.join(process.cwd(), 'public', 'scrollanimation')));

// Vite middleware / production static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Citypulse server running on http://0.0.0.0:${PORT} [Socket.IO Enabled]`);
  });
}

startServer();
