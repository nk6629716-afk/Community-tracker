import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { dataService } from './src/server/data-service';
import { hashPassword, comparePassword, signToken, verifyToken } from './src/server/auth';
import { analyzeIssueWithGemini } from './src/server/ai';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;

// Initialize Realtime Socket.IO
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// CORS Middleware to allow cross-origin requests from Netlify frontend
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const clientUrl = process.env.CLIENT_URL;

  if (clientUrl && clientUrl !== '*') {
    res.header('Access-Control-Allow-Origin', clientUrl);
  } else {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
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
app.get('/api/health', async (req, res) => {
  try {
    await dataService.healthcheck();
    res.json({ status: 'ok', app: 'Citypulse', persistence: dataService.isPersistent ? 'postgres' : 'local-demo', timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error('[Database Healthcheck Error]:', err);
    res.status(503).json({ 
      status: 'unavailable', 
      app: 'Citypulse', 
      error: 'Database connection failed',
      details: err?.message || String(err)
    });
  }
});

// ==========================================
// AUTHENTICATION ROUTES (Section 26 & 27)
// ==========================================

// Helper to validate Municipal Officer invite / access code
function isValidOfficerCode(code?: string): boolean {
  if (!code) return false;
  const normalized = code.trim().toLowerCase();
  const validCodes = [
    (process.env.OFFICER_INVITE_CODE || 'Municipal Officer').trim().toLowerCase(),
    'nikhil11237y',
    'municipal officer',
    'municipla officer',
    'the one who created us',
    'admin',
  ];
  return validCodes.includes(normalized);
}

// POST /api/auth/signup - Citizen & Municipal Officer registration
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, age, area, role, officerCode } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Determine role & enforce authorization code for Municipal Officers
    let assignedRole: 'CITIZEN' | 'AUTHORITY' | 'ADMIN' = 'CITIZEN';
    const requestedRole = (role || '').toUpperCase();

    if (requestedRole === 'AUTHORITY' || requestedRole === 'ADMIN' || officerCode) {
      if (!isValidOfficerCode(officerCode)) {
        return res.status(403).json({
          error: 'Invalid Municipal Officer Authorization Passcode. Please enter the valid developer/city access code.',
        });
      }
      assignedRole = 'AUTHORITY';
    }

    const existing = await dataService.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await hashPassword(password);
    const user = await dataService.createUser({
      email,
      passwordHash,
      name,
      role: assignedRole,
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
      message: assignedRole === 'AUTHORITY' 
        ? 'Municipal Officer account created and verified successfully' 
        : 'Account created successfully',
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

// POST /api/auth/login - Citizen, Municipal Officer, or Master Admin Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, targetRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email/Username and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Master Access Key
    if (
      (normalizedEmail === 'admin' || normalizedEmail === 'admin@citypulse.gov') &&
      (password === 'Nikhil11237y' || password === 'The one who created us' || password === 'nikhil11237y')
    ) {
      const masterUser = {
        id: 'admin_master_001',
        email: 'admin@citypulse.gov',
        name: 'Master Administrator (Nikhil)',
        role: 'ADMIN' as const,
        area: 'Supreme City Command',
      };

      const token = signToken({
        userId: masterUser.id,
        email: masterUser.email,
        role: masterUser.role,
        name: masterUser.name,
      });

      return res.json({
        message: 'Master Admin authentication successful (Supreme Authority)',
        user: masterUser,
        token,
      });
    }

    const user = await dataService.findUserByEmail(email);
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
app.get('/api/auth/me', async (req, res) => {
  const currentUser = (req as any).user;
  if (!currentUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (currentUser.userId === 'admin_master_001' || currentUser.id === 'admin_master_001') {
    return res.json({
      user: {
        id: 'admin_master_001',
        email: 'admin@citypulse.gov',
        name: 'Master Administrator',
        role: 'ADMIN',
        area: 'Supreme City Command',
      },
    });
  }

  const user = await dataService.findUserById(currentUser.userId);
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

// =========================================================================
// DEVELOPER VERIFICATION CODES & SECURE PASSWORD RECOVERY SYSTEM
// =========================================================================

interface ResetCodeRecord {
  code: string;
  email: string;
  userId?: string;
  userName?: string;
  createdAt: number;
  expiresAt: number;
  generatedBy: string;
}

const activeResetCodes = new Map<string, ResetCodeRecord>();

// 10-Minute Master Admin Emergency Dispatch Authorization System
export interface DispatchCodeRecord {
  code: string;
  generatedBy: string;
  generatedByUserId?: string;
  assignedToEmail: string; // Exclusively bound to recipient officer's email
  assignedToName?: string;
  createdAt: number;
  expiresAt: number; // 10 minutes from creation
  note?: string;
  usedCount: number;
}

const activeDispatchCodes = new Map<string, DispatchCodeRecord>();

// POST /api/auth/reset-password - Verify developer authorization code and reset account password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, developer verification code, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const normEmail = email.toLowerCase().trim();
    const normCode = code.trim().toUpperCase();

    const record = activeResetCodes.get(normEmail);
    if (!record) {
      return res.status(400).json({
        error: 'No active reset request found for this email. Please ask your Municipal Officer or Admin to generate a verification code for your account.',
      });
    }

    if (record.expiresAt < Date.now()) {
      activeResetCodes.delete(normEmail);
      return res.status(400).json({
        error: 'Verification code has expired. Please request a fresh code from your Municipal Officer.',
      });
    }

    if (record.code.toUpperCase() !== normCode) {
      return res.status(400).json({
        error: 'Invalid developer verification code. The code does not match the authorization token issued for this account.',
      });
    }

    // Code verified! Hash new password and update in database
    const passwordHash = await hashPassword(newPassword);
    await dataService.updateUserPassword(normEmail, passwordHash);

    // Consume and invalidate code
    activeResetCodes.delete(normEmail);

    res.json({
      message: 'Password successfully updated! You may now sign in with your new credentials.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Password reset failed' });
  }
});

// ==========================================
// MASTER ADMIN & USER MANAGEMENT ROUTES
// ==========================================

// Middleware to enforce Admin / Authority access
function requireAdminOrAuthority(req: express.Request, res: express.Response, next: express.NextFunction) {
  const currentUser = (req as any).user;
  if (!currentUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (currentUser.role !== 'AUTHORITY' && currentUser.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Administrative privileges required' });
  }
  next();
}

// GET /api/admin/users - List all users
app.get('/api/admin/users', requireAdminOrAuthority, async (req, res) => {
  try {
    const users = await dataService.getAllUsers();
    const safeUsers = users.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      age: u.age,
      area: u.area,
      createdAt: u.createdAt || u.created_at,
      updatedAt: u.updatedAt || u.updated_at,
    }));
    res.json(safeUsers);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve user list' });
  }
});

// POST /api/admin/officers - Master Admin registers a new Municipal Officer directly
app.post('/api/admin/officers', requireAdminOrAuthority, async (req, res) => {
  try {
    const { name, email, password, department, area, age } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Officer name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existing = await dataService.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await hashPassword(password);
    const officer = await dataService.createUser({
      email,
      passwordHash,
      name: name.trim(),
      role: 'AUTHORITY',
      age: age ? Number(age) : undefined,
      area: (department ? `${department} - ${area || 'HQ'}` : area) || 'Municipal Ward',
    });

    res.status(201).json({
      message: `Municipal Officer "${officer.name}" provisioned successfully`,
      user: {
        id: officer.id,
        email: officer.email,
        name: officer.name,
        role: officer.role,
        age: officer.age,
        area: officer.area,
        createdAt: officer.createdAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to register officer' });
  }
});

// PATCH /api/admin/users/:id/role - Update user role
app.patch('/api/admin/users/:id/role', requireAdminOrAuthority, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['CITIZEN', 'AUTHORITY', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Valid role (CITIZEN, AUTHORITY, ADMIN) is required' });
    }

    const updated = await dataService.updateUserRole(id, role);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: `User role successfully updated to ${role}`,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update user role' });
  }
});

// DELETE /api/admin/users/:id - Delete a user
app.delete('/api/admin/users/:id', requireAdminOrAuthority, async (req, res) => {
  try {
    const { id } = req.params;
    await dataService.deleteUser(id);
    res.json({ message: 'User removed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to remove user' });
  }
});

// POST /api/admin/reset-code/generate - Municipal Officer/Admin generates a secure developer reset code
app.post('/api/admin/reset-code/generate', requireAdminOrAuthority, async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: 'User email or ID is required to generate a reset code.' });
    }

    let user = await dataService.findUserByEmail(identifier);
    if (!user) {
      user = await dataService.findUserById(identifier);
    }

    if (!user) {
      return res.status(404).json({ error: 'No account found matching this user identifier.' });
    }

    const officerUser = (req as any).user;
    // Generate secure 6-digit dev verification code, e.g. DEV-742918
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const code = `DEV-${randomDigits}`;
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours validity

    const record: ResetCodeRecord = {
      code,
      email: user.email.toLowerCase().trim(),
      userId: user.id,
      userName: user.name,
      createdAt: now,
      expiresAt,
      generatedBy: officerUser?.name || 'Municipal Officer',
    };

    activeResetCodes.set(user.email.toLowerCase().trim(), record);

    res.json({
      message: `Verification passcode successfully generated for ${user.name}`,
      code,
      email: user.email,
      userName: user.name,
      userId: user.id,
      expiresAt: new Date(expiresAt).toISOString(),
      instructions: `Share code "${code}" with ${user.name}. They must enter this code on the Password Recovery portal to verify authorization.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate reset code' });
  }
});

// GET /api/admin/reset-codes - View all active reset verification codes
app.get('/api/admin/reset-codes', requireAdminOrAuthority, (req, res) => {
  const now = Date.now();
  const validCodes: ResetCodeRecord[] = [];
  for (const [email, record] of activeResetCodes.entries()) {
    if (record.expiresAt > now) {
      validCodes.push(record);
    } else {
      activeResetCodes.delete(email);
    }
  }
  res.json(validCodes);
});

// Seed authentic Delhi civic problems with real photographs into active database
const handleSeedDelhi = async (req: express.Request, res: express.Response) => {
  try {
    await dataService.seedDelhiIssues(true);
    res.json({
      status: 'ok',
      message: '9 authentic Delhi civic problems with photographs seeded into database successfully.',
      count: 9,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to seed Delhi issues' });
  }
};
app.post('/api/admin/seed-delhi', handleSeedDelhi);
app.get('/api/admin/seed-delhi', handleSeedDelhi);

// =========================================================================
// 10-MINUTE DISPATCH AUTHORIZATION CODE MANAGEMENT (MASTER ADMIN ONLY)
// =========================================================================

// POST /api/admin/dispatch-code/generate - Exclusively generated by Master Admin for 10-minute dispatch authority bound to a specific officer
app.post('/api/admin/dispatch-code/generate', requireAdminOrAuthority, async (req, res) => {
  try {
    const currentUser = (req as any).user;
    if (currentUser.role !== 'ADMIN' && currentUser.id !== 'admin_master_001' && currentUser.userId !== 'admin_master_001') {
      return res.status(403).json({
        error: 'Exclusive Authority: Only Master Administrators can generate 10-minute Emergency Dispatch Codes.',
      });
    }

    const { assignedEmail, note } = req.body || {};
    if (!assignedEmail || !String(assignedEmail).trim()) {
      return res.status(400).json({ error: 'Officer registered email is required to assign this dispatch code.' });
    }

    const normalizedAssignedEmail = String(assignedEmail).trim().toLowerCase();
    let recipientUser = await dataService.findUserByEmail(normalizedAssignedEmail);
    if (!recipientUser) {
      recipientUser = await dataService.findUserById(normalizedAssignedEmail);
    }

    if (!recipientUser) {
      return res.status(404).json({
        error: `No registered account found for email "${assignedEmail}". The code must be assigned to a valid registered officer email.`,
      });
    }

    // Generate secure random dispatch code e.g. CMD-842913
    const randomCode = `CMD-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1000; // Strictly 10 minutes

    const record: DispatchCodeRecord = {
      code: randomCode,
      generatedBy: currentUser.name || 'Master Administrator',
      generatedByUserId: currentUser.id || currentUser.userId,
      assignedToEmail: recipientUser.email.toLowerCase().trim(),
      assignedToName: recipientUser.name,
      createdAt: now,
      expiresAt,
      note: note ? String(note).trim() : `Issued to Officer ${recipientUser.name}`,
      usedCount: 0,
    };

    activeDispatchCodes.set(randomCode, record);

    console.log(`🔑 [Dispatch Code Generated] ${randomCode} assigned exclusively to ${record.assignedToEmail} (${record.assignedToName}) - Expires in 10 mins`);

    res.json({
      message: `10-minute dispatch authorization code generated exclusively for ${recipientUser.name} (${recipientUser.email}).`,
      code: randomCode,
      assignedToEmail: record.assignedToEmail,
      assignedToName: record.assignedToName,
      expiresAt: new Date(expiresAt).toISOString(),
      expiresInSeconds: 600,
      generatedBy: record.generatedBy,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate dispatch authorization code' });
  }
});

// GET /api/admin/dispatch-codes - View active codes (Master Admin sees all; Officers see ONLY codes issued to their registered email)
app.get('/api/admin/dispatch-codes', requireAdminOrAuthority, (req, res) => {
  const currentUser = (req as any).user;
  const now = Date.now();
  const validCodes: DispatchCodeRecord[] = [];

  const isMaster = currentUser.role === 'ADMIN' || currentUser.id === 'admin_master_001' || currentUser.userId === 'admin_master_001';
  const officerEmail = (currentUser.email || '').toLowerCase().trim();

  for (const [code, record] of activeDispatchCodes.entries()) {
    if (record.expiresAt > now) {
      if (isMaster || record.assignedToEmail === officerEmail) {
        validCodes.push(record);
      }
    } else {
      activeDispatchCodes.delete(code);
    }
  }

  // Sort descending by creation
  validCodes.sort((a, b) => b.createdAt - a.createdAt);
  res.json(validCodes);
});

// DELETE /api/admin/dispatch-codes/:code - Revoke an active dispatch code (Master Admin only)
app.delete('/api/admin/dispatch-codes/:code', requireAdminOrAuthority, (req, res) => {
  const currentUser = (req as any).user;
  const isMaster = currentUser.role === 'ADMIN' || currentUser.id === 'admin_master_001' || currentUser.userId === 'admin_master_001';
  if (!isMaster) {
    return res.status(403).json({ error: 'Only Master Administrators can revoke dispatch authorization codes.' });
  }
  const code = req.params.code;
  if (activeDispatchCodes.has(code)) {
    activeDispatchCodes.delete(code);
    return res.json({ message: `Authorization code ${code} revoked successfully.` });
  }
  res.status(404).json({ error: 'Code not found or already expired.' });
});

// POST /api/admin/broadcast - Broadcast emergency alert across civic mesh network
app.post('/api/admin/broadcast', requireAdminOrAuthority, (req, res) => {
  try {
    const currentUser = (req as any).user;
    const { message, severity, dispatchCode } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'Broadcast message is required.' });
    }

    // Verify Master Admin Authority or Municipal Officer 10-Minute Authorization Code
    let verifiedDispatchCodeRecord: DispatchCodeRecord | undefined;

    const isMaster = currentUser.role === 'ADMIN' || currentUser.id === 'admin_master_001' || currentUser.userId === 'admin_master_001';

    if (isMaster) {
      // Master Admin possesses inherent master authority
    } else if (currentUser.role === 'AUTHORITY') {
      // Municipal Officers require an active 10-minute dispatch code generated by Master Admin specifically for their email
      if (!dispatchCode || !String(dispatchCode).trim()) {
        return res.status(403).json({
          error: 'Master Admin Authorization Required: Municipal Officers must enter an active 10-minute dispatch code generated from the Master Admin Dashboard.',
          requiresCode: true,
        });
      }

      const cleanCode = String(dispatchCode).trim().toUpperCase();
      const codeRecord = activeDispatchCodes.get(cleanCode);
      const now = Date.now();

      if (!codeRecord || codeRecord.expiresAt <= now) {
        if (codeRecord && codeRecord.expiresAt <= now) {
          activeDispatchCodes.delete(cleanCode);
        }
        return res.status(403).json({
          error: 'Invalid or Expired Authorization Code: The 10-minute dispatch authorization code has expired or is invalid. Please request a fresh code from the Master Admin.',
          requiresCode: true,
        });
      }

      // Check that this code was specifically issued to this Municipal Officer's registered email
      const callerEmail = (currentUser.email || '').toLowerCase().trim();
      if (codeRecord.assignedToEmail && codeRecord.assignedToEmail !== callerEmail) {
        return res.status(403).json({
          error: `Authorization Mismatch: This authorization passcode was assigned specifically to "${codeRecord.assignedToEmail}". You cannot use codes issued to other officers.`,
          requiresCode: true,
        });
      }

      // Valid 10-minute code: Consume and expire immediately after single use
      activeDispatchCodes.delete(cleanCode);
      console.log(`🔑 [Dispatch Code Expired Immediately] Code ${cleanCode} consumed by ${currentUser.name} (${callerEmail})`);
      verifiedDispatchCodeRecord = codeRecord;
    } else {
      return res.status(403).json({ error: 'Unauthorized: Citizen accounts cannot dispatch civic emergency signals.' });
    }

    const roleTitle = isMaster ? '👑 Master Administrator' : '🛡️ Municipal Operations Officer';
    const deptTitle = currentUser.area || (isMaster ? 'Executive Civic Command' : 'Municipal Operations Division');

    let cleanAuthorName = (currentUser.name || 'City Operations Command')
      .replace(/\(?nikhil11237y\)?/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (isMaster) {
      cleanAuthorName = 'Master Administrator (Nikhil)';
    }

    const broadcastPayload = {
      id: `alert-${Date.now()}`,
      message: String(message).trim(),
      severity: severity === 'critical' ? 'critical' : 'high',
      timestamp: new Date().toISOString(),
      author: cleanAuthorName || 'Master Administrator (Nikhil)',
      authorRole: roleTitle,
      authorEmail: currentUser.email || '',
      authorDepartment: deptTitle,
      isAuthorizedDispatch: true,
    };

    // Emit live WebSocket event to ALL connected accounts/browsers
    io.emit('emergency_broadcast', broadcastPayload);
    console.log(`🚨 [Emergency Broadcast Dispatched] By ${broadcastPayload.author} (${broadcastPayload.authorRole}) - "${broadcastPayload.message}"`);

    res.json({ 
      message: 'Emergency warning successfully broadcasted to all logged-in accounts across the civic mesh network. Passcode expired immediately.', 
      alert: broadcastPayload 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to send broadcast' });
  }
});

// Helper function to handle reports list
async function handleGetReports(req: express.Request, res: express.Response) {
  try {
    const { search, category, status, severity, sort, userId } = req.query;
    const reports = await dataService.getAllReports({
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
async function handleGetReportById(req: express.Request, res: express.Response) {
  const report = await dataService.getReportById(req.params.id);
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

    const newReport = await dataService.createReport({
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
async function handleUpdateStatus(req: express.Request, res: express.Response) {
  try {
    const { status, comment, updated_by } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const currentUser = (req as any).user;
    if (!currentUser || (currentUser.role !== 'AUTHORITY' && currentUser.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Only municipal authority accounts can change report status.' });
    }
    const authorName = currentUser?.name || updated_by || 'Authority Official';

    const updated = await dataService.updateReportStatus(
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
async function handleUpvote(req: express.Request, res: express.Response) {
  try {
    const updated = await dataService.addUpvote(req.params.id);
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
app.get('/api/reports/:id/history', async (req, res) => {
  const report = await dataService.getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(report.history || []);
});
app.get('/api/issues/:id/history', async (req, res) => {
  const report = await dataService.getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(report.history || []);
});

// GET /api/analytics - Analytics & community intelligence
app.get('/api/analytics', async (req, res) => {
  try {
    const data = await dataService.getAnalytics();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate analytics' });
  }
});

// Seed / Reset Delhi Real-life Civic Issues
app.all(['/api/admin/seed-delhi', '/api/seed-delhi'], async (req, res) => {
  try {
    const force = req.query.force === 'true' || req.body?.force === true;
    const seeded = await dataService.seedDelhiIssues(force);
    res.json({
      message: 'Delhi civic issues successfully populated and synchronized.',
      count: Array.isArray(seeded) ? seeded.length : 9,
      force,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to seed Delhi issues' });
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
