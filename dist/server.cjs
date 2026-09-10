var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  io: () => io
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_http = __toESM(require("http"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_socket = require("socket.io");
var import_vite = require("vite");

// src/server/database.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);

// src/utils/priority.ts
var SEVERITY_WEIGHTS = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};
function calculatePriorityScore(severity, upvotes, createdAt) {
  const sevWeight = SEVERITY_WEIGHTS[severity] || 2;
  const communityImpact = 1 + Math.log10(1 + Math.max(0, upvotes)) * 0.85;
  const now = (/* @__PURE__ */ new Date()).getTime();
  const created = new Date(createdAt).getTime();
  const daysOld = Math.max(0, (now - created) / (1e3 * 60 * 60 * 24));
  const ageFactor = 1 + Math.min(0.5, daysOld * 0.05);
  const rawScore = sevWeight * communityImpact * ageFactor;
  const normalized = Math.min(100, Math.max(1, Math.round(rawScore / 18 * 100)));
  return normalized;
}

// src/server/database.ts
var STORE_PATH = import_path.default.join(process.cwd(), "citypulse_store.json");
var BASE_LAT = 37.7749;
var BASE_LNG = -122.4194;
function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}
var CitypulseDatabase = class {
  constructor() {
    this.users = [];
    this.reports = [];
    this.isInitialized = false;
    this.init();
  }
  async init() {
    if (this.isInitialized) return;
    if (import_fs.default.existsSync(STORE_PATH)) {
      try {
        const raw = import_fs.default.readFileSync(STORE_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        this.users = parsed.users || [];
        this.reports = parsed.reports || [];
      } catch (err) {
        console.warn("Failed to parse citypulse_store.json, creating new store:", err);
      }
    }
    if (this.users.length === 0) {
      const salt = import_bcryptjs.default.genSaltSync(10);
      const authorityHash = import_bcryptjs.default.hashSync("authority123", salt);
      const citizenHash = import_bcryptjs.default.hashSync("citizen123", salt);
      const adminHash = import_bcryptjs.default.hashSync("admin123", salt);
      this.users = [
        {
          id: "usr-authority-1",
          email: "authority@citypulse.gov",
          passwordHash: authorityHash,
          name: "Officer Sarah Chen",
          role: "AUTHORITY",
          area: "Central Municipal Ward",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        {
          id: "usr-citizen-1",
          email: "citizen@citypulse.gov",
          passwordHash: citizenHash,
          name: "Alex Rivera",
          role: "CITIZEN",
          age: 28,
          area: "North Campus District",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        {
          id: "usr-admin-1",
          email: "admin@citypulse.gov",
          passwordHash: adminHash,
          name: "Director Marcus Vance",
          role: "ADMIN",
          area: "City Operations Command",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      ];
    }
    if (this.reports.length === 0) {
      this.reports = [
        {
          id: "iss-1",
          title: "Large pothole near College Gate",
          description: "There is a large, deep pothole near the college main entrance that is causing severe hazard for two-wheelers and cyclists during rush hour.",
          category: "road_damage",
          severity: "high",
          ai_summary: "Large pothole reported near College Gate creating a potential safety hazard for two-wheelers.",
          ai_severity: "high",
          ai_confidence: 0.94,
          ai_reason: "The report describes a significant road defect located in a high-traffic pedestrian and student vehicular corridor.",
          recommended_action: "Dispatch road maintenance crew to inspect sub-base, mill edges, and apply hot-mix asphalt patch.",
          latitude: BASE_LAT + 35e-4,
          longitude: BASE_LNG - 42e-4,
          address: "College Gate & University Ave",
          photo_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
          status: "in_progress",
          is_anonymous: false,
          created_by: "Rahul S. (Student Council)",
          created_at: new Date(Date.now() - 36 * 3600 * 1e3).toISOString(),
          updated_at: new Date(Date.now() - 12 * 3600 * 1e3).toISOString(),
          upvotes: 83,
          priority_score: 91,
          history: [
            {
              id: "upd-1a",
              issue_id: "iss-1",
              old_status: null,
              new_status: "reported",
              comment: "Issue reported by Rahul S. with verified photographic evidence.",
              updated_by: "System",
              created_at: new Date(Date.now() - 36 * 3600 * 1e3).toISOString()
            },
            {
              id: "upd-1b",
              issue_id: "iss-1",
              old_status: "reported",
              new_status: "in_progress",
              comment: "Public Works Dept scheduled quick-fill asphalt unit for immediate remediation.",
              updated_by: "Officer Sarah Chen",
              created_at: new Date(Date.now() - 12 * 3600 * 1e3).toISOString()
            }
          ]
        },
        {
          id: "iss-2",
          title: "Water leakage near Block C",
          description: "High pressure municipal water pipe leaking onto the main walkway near Block C. Water has been continuously gushing for over 6 hours.",
          category: "water_leakage",
          severity: "critical",
          ai_summary: "Severe pressurized water main rupture causing walkway flooding and resource wastage near Block C.",
          ai_severity: "critical",
          ai_confidence: 0.96,
          ai_reason: "Active pressurized leak causing flooding in pedestrian zone, posing foundation erosion risk.",
          recommended_action: "Isolate valve sector 4B immediately and dispatch emergency water utility team.",
          latitude: BASE_LAT - 48e-4,
          longitude: BASE_LNG + 31e-4,
          address: "Block C Walkway, North Sector",
          photo_url: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80",
          status: "reported",
          is_anonymous: true,
          created_by: "Reported anonymously",
          created_at: new Date(Date.now() - 5 * 3600 * 1e3).toISOString(),
          updated_at: new Date(Date.now() - 5 * 3600 * 1e3).toISOString(),
          upvotes: 59,
          priority_score: 86,
          history: [
            {
              id: "upd-2a",
              issue_id: "iss-2",
              old_status: null,
              new_status: "reported",
              comment: "Anonymous report submitted with GPS validation.",
              updated_by: "Citizen",
              created_at: new Date(Date.now() - 5 * 3600 * 1e3).toISOString()
            }
          ]
        },
        {
          id: "iss-3",
          title: "Garbage accumulation at Central Market",
          description: "Waste bins overflowing across market alleyway. Stagnant organic waste attracting pests and causing foul odor in shopping district.",
          category: "garbage",
          severity: "high",
          ai_summary: "Excessive municipal waste accumulation with sanitation hazard at Central Market.",
          ai_severity: "high",
          ai_confidence: 0.92,
          ai_reason: "Severe sanitation risk in food market zone with rodent/pest threat.",
          recommended_action: "Deploy solid waste compactor truck and sanitize collection station bins.",
          latitude: BASE_LAT + 62e-4,
          longitude: BASE_LNG + 54e-4,
          address: "Central Market Lane 3",
          photo_url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80",
          status: "reported",
          is_anonymous: false,
          created_by: "Alex Rivera",
          userId: "usr-citizen-1",
          created_at: new Date(Date.now() - 14 * 3600 * 1e3).toISOString(),
          updated_at: new Date(Date.now() - 14 * 3600 * 1e3).toISOString(),
          upvotes: 71,
          priority_score: 81,
          history: [
            {
              id: "upd-3a",
              issue_id: "iss-3",
              old_status: null,
              new_status: "reported",
              comment: "Citizen report flagged for urgent sanitation pickup.",
              updated_by: "System",
              created_at: new Date(Date.now() - 14 * 3600 * 1e3).toISOString()
            }
          ]
        },
        {
          id: "iss-4",
          title: "Broken streetlight on Park Road",
          description: "Streetlight pole #42 is unlit for three consecutive nights, creating a dark stretch along the student pedestrian path.",
          category: "streetlight",
          severity: "medium",
          ai_summary: "Inoperative streetlight pole along pedestrian route reducing night-time visibility and security.",
          ai_severity: "medium",
          ai_confidence: 0.89,
          ai_reason: "Pedestrian safety and visibility concern along well-trafficked night path.",
          recommended_action: "Inspect circuit breaker and replace 120W LED fixture.",
          latitude: BASE_LAT - 21e-4,
          longitude: BASE_LNG - 65e-4,
          address: "Park Road, opposite Community Garden",
          photo_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
          status: "resolved",
          is_anonymous: false,
          created_by: "Alex Rivera",
          userId: "usr-citizen-1",
          created_at: new Date(Date.now() - 48 * 3600 * 1e3).toISOString(),
          updated_at: new Date(Date.now() - 6 * 3600 * 1e3).toISOString(),
          upvotes: 34,
          priority_score: 54,
          history: [
            {
              id: "upd-4a",
              issue_id: "iss-4",
              old_status: null,
              new_status: "reported",
              comment: "Initial report logged.",
              updated_by: "Citizen",
              created_at: new Date(Date.now() - 48 * 3600 * 1e3).toISOString()
            },
            {
              id: "upd-4b",
              issue_id: "iss-4",
              old_status: "reported",
              new_status: "in_progress",
              comment: "Electrical maintenance dispatched.",
              updated_by: "Officer Sarah Chen",
              created_at: new Date(Date.now() - 24 * 3600 * 1e3).toISOString()
            },
            {
              id: "upd-4c",
              issue_id: "iss-4",
              old_status: "in_progress",
              new_status: "resolved",
              comment: "LED fixture replaced and circuit continuity verified.",
              updated_by: "Officer Sarah Chen",
              created_at: new Date(Date.now() - 6 * 3600 * 1e3).toISOString()
            }
          ]
        }
      ];
    }
    this.save();
    this.isInitialized = true;
  }
  save() {
    try {
      const data = {
        users: this.users,
        reports: this.reports
      };
      import_fs.default.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to save citypulse_store.json:", err);
    }
  }
  // --- USER OPERATIONS ---
  createUser(userData) {
    const existing = this.findUserByEmail(userData.email);
    if (existing) {
      throw new Error("An account with this email address already exists.");
    }
    const newUser = {
      id: generateId("usr"),
      email: userData.email.toLowerCase().trim(),
      passwordHash: userData.passwordHash,
      name: userData.name.trim(),
      role: userData.role || "CITIZEN",
      age: userData.age,
      area: userData.area,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.users.push(newUser);
    this.save();
    return newUser;
  }
  findUserByEmail(email) {
    const norm = email.toLowerCase().trim();
    return this.users.find((u) => u.email === norm) || null;
  }
  findUserById(id) {
    return this.users.find((u) => u.id === id) || null;
  }
  getAllUsers() {
    return [...this.users].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  updateUserRole(id, role) {
    const user = this.users.find((u) => u.id === id);
    if (!user) return null;
    user.role = role;
    user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.save();
    return user;
  }
  deleteUser(id) {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    this.users.splice(idx, 1);
    this.save();
    return true;
  }
  updateUserPassword(emailOrId, passwordHash) {
    const norm = emailOrId.toLowerCase().trim();
    const user = this.users.find((u) => u.id === emailOrId || u.email.toLowerCase().trim() === norm);
    if (!user) return false;
    user.passwordHash = passwordHash;
    user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.save();
    return true;
  }
  // --- REPORT OPERATIONS ---
  getAllReports(filters) {
    let result = [...this.reports];
    if (filters?.userId) {
      result = result.filter((r) => r.userId === filters.userId);
    }
    if (filters?.category && filters.category !== "all") {
      result = result.filter((r) => r.category === filters.category);
    }
    if (filters?.status && filters.status !== "all") {
      result = result.filter((r) => r.status === filters.status);
    }
    if (filters?.severity && filters.severity !== "all") {
      result = result.filter((r) => r.severity === filters.severity);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.address.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)
      );
    }
    if (filters?.sort === "most_upvoted") {
      result.sort((a, b) => b.upvotes - a.upvotes);
    } else if (filters?.sort === "highest_priority") {
      result.sort((a, b) => b.priority_score - a.priority_score);
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return result;
  }
  getReportById(id) {
    return this.reports.find((r) => r.id === id) || null;
  }
  createReport(data) {
    const id = generateId("iss");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const upvotes = 1;
    const priorityScore = calculatePriorityScore(data.severity, upvotes, now);
    const newReport = {
      id,
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      severity: data.severity,
      status: "reported",
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address.trim(),
      photo_url: data.photo_url,
      is_anonymous: Boolean(data.is_anonymous),
      created_by: data.is_anonymous ? "Reported anonymously" : data.created_by || "Citizen",
      userId: data.userId,
      ai_summary: data.ai_summary || `${data.title} reported at ${data.address}.`,
      ai_severity: data.ai_severity || data.severity,
      ai_confidence: data.ai_confidence || 0.88,
      ai_reason: data.ai_reason || "Verified community issue submission.",
      recommended_action: data.recommended_action || "Assign municipal field assessment crew.",
      created_at: now,
      updated_at: now,
      upvotes,
      priority_score: priorityScore,
      history: [
        {
          id: generateId("upd"),
          issue_id: id,
          old_status: null,
          new_status: "reported",
          comment: "Signal registered in Citypulse municipal database.",
          updated_by: data.is_anonymous ? "Citizen" : data.created_by || "Citizen",
          created_at: now
        }
      ]
    };
    this.reports.unshift(newReport);
    this.save();
    return newReport;
  }
  updateReportStatus(id, newStatus, comment, updatedBy) {
    const report = this.reports.find((r) => r.id === id);
    if (!report) return null;
    const oldStatus = report.status;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    report.status = newStatus;
    report.updated_at = now;
    if (!report.history) {
      report.history = [];
    }
    report.history.push({
      id: generateId("upd"),
      issue_id: id,
      old_status: oldStatus,
      new_status: newStatus,
      comment: comment || `Status updated to ${newStatus.replace("_", " ").toUpperCase()}`,
      updated_by: updatedBy || "Authority Official",
      created_at: now
    });
    this.save();
    return report;
  }
  addUpvote(id) {
    const report = this.reports.find((r) => r.id === id);
    if (!report) return null;
    report.upvotes += 1;
    const daysOld = (Date.now() - new Date(report.created_at).getTime()) / (1e3 * 3600 * 24);
    report.priority_score = calculatePriorityScore(report.severity, report.upvotes, report.created_at);
    this.save();
    return report;
  }
  getAnalytics() {
    const totalReports = this.reports.length;
    const activeIssues = this.reports.filter((r) => r.status !== "resolved").length;
    const inProgress = this.reports.filter((r) => r.status === "in_progress").length;
    const resolved = this.reports.filter((r) => r.status === "resolved").length;
    const resolutionRate = totalReports > 0 ? Math.round(resolved / totalReports * 100) : 0;
    const byCategory = {
      road_damage: 0,
      garbage: 0,
      water_leakage: 0,
      streetlight: 0,
      drainage: 0,
      electricity: 0,
      infrastructure: 0,
      public_space: 0,
      other: 0
    };
    this.reports.forEach((r) => {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
    });
    const bySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    this.reports.forEach((r) => {
      bySeverity[r.severity] = (bySeverity[r.severity] || 0) + 1;
    });
    const byStatus = {
      reported: 0,
      in_progress: 0,
      resolved: 0
    };
    this.reports.forEach((r) => {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    });
    const locationMap = /* @__PURE__ */ new Map();
    this.reports.forEach((r) => {
      const entry = locationMap.get(r.address) || { count: 0, highSev: 0 };
      entry.count += 1;
      if (r.severity === "high" || r.severity === "critical") {
        entry.highSev += 1;
      }
      locationMap.set(r.address, entry);
    });
    const topLocations = Array.from(locationMap.entries()).map(([address, data]) => ({
      address,
      count: data.count,
      high_severity_count: data.highSev
    })).sort((a, b) => b.count - a.count).slice(0, 5);
    const priorityQueue = this.reports.filter((r) => r.status !== "resolved").sort((a, b) => b.priority_score - a.priority_score).slice(0, 8);
    const recentActivity = [];
    this.reports.slice(0, 8).forEach((r) => {
      recentActivity.push({
        id: `act-${r.id}`,
        issue_id: r.id,
        type: r.status === "resolved" ? "status_change" : "report",
        message: r.status === "resolved" ? `Issue marked as resolved by municipal authority: ${r.title}` : `New civic report logged at ${r.address}: ${r.title}`,
        timestamp: r.updated_at || r.created_at,
        category: r.category
      });
    });
    return {
      total_reports: totalReports,
      active_issues: activeIssues,
      in_progress: inProgress,
      resolved,
      resolution_rate: resolutionRate,
      avg_resolution_time_days: 2.4,
      by_category: byCategory,
      by_severity: bySeverity,
      by_status: byStatus,
      top_locations: topLocations,
      priority_queue: priorityQueue,
      recent_activity: recentActivity
    };
  }
  // Compatibility aliases
  getAllIssues(filters) {
    return this.getAllReports(filters);
  }
  getIssueById(id) {
    return this.getReportById(id);
  }
  createIssue(data) {
    return this.createReport(data);
  }
  updateIssueStatus(id, newStatus, comment, updatedBy) {
    return this.updateReportStatus(id, newStatus, comment, updatedBy);
  }
};
var citypulseDb = new CitypulseDatabase();

// src/server/postgres.ts
var import_pg = require("pg");
var pool = new import_pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
function mapUser(row) {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    role: row.role,
    age: row.age ?? void 0,
    area: row.area ?? void 0,
    latitude: row.latitude ?? void 0,
    longitude: row.longitude ?? void 0,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}
function mapHistory(row) {
  return {
    id: row.id,
    issue_id: row.report_id,
    old_status: row.old_status,
    new_status: row.new_status,
    comment: row.comment,
    updated_by: row.updated_by,
    created_at: new Date(row.created_at).toISOString()
  };
}
function mapReport(row, history = []) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    severity: row.severity,
    status: row.status,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    address: row.address,
    photo_url: row.photo_url ?? void 0,
    is_anonymous: row.is_anonymous,
    created_by: row.created_by,
    userId: row.user_id ?? void 0,
    ai_summary: row.ai_summary ?? void 0,
    ai_severity: row.ai_severity ?? void 0,
    ai_confidence: row.ai_confidence == null ? void 0 : Number(row.ai_confidence),
    ai_reason: row.ai_reason ?? void 0,
    recommended_action: row.recommended_action ?? void 0,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
    upvotes: row.upvotes,
    priority_score: row.priority_score,
    history: history.map(mapHistory)
  };
}
var PostgresCitypulseDatabase = class {
  async healthcheck() {
    await pool.query("SELECT 1");
  }
  async createUser(user) {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role, age, area)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user.email.toLowerCase().trim(), user.passwordHash, user.name.trim(), user.role || "CITIZEN", user.age ?? null, user.area ?? null]
    );
    return mapUser(result.rows[0]);
  }
  async findUserByEmail(email) {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }
  async findUserById(id) {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }
  async getAllUsers() {
    const result = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
    return result.rows.map(mapUser);
  }
  async updateUserRole(id, role) {
    const result = await pool.query(
      "UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [role, id]
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }
  async deleteUser(id) {
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    return true;
  }
  async updateUserPassword(email, passwordHash) {
    const result = await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE LOWER(email) = $2 RETURNING *",
      [passwordHash, email.toLowerCase().trim()]
    );
    return result.rows[0] ? mapUser(result.rows[0]) : null;
  }
  async getAllReports(filters = {}) {
    const conditions = [];
    const values = [];
    const add = (expression, value) => {
      values.push(value);
      conditions.push(expression.replace("?", `$${values.length}`));
    };
    if (filters.userId) add("user_id = ?", filters.userId);
    if (filters.category && filters.category !== "all") add("category = ?", filters.category);
    if (filters.status && filters.status !== "all") add("status = ?", filters.status);
    if (filters.severity && filters.severity !== "all") add("severity = ?", filters.severity);
    if (filters.search) add("(title ILIKE ? OR description ILIKE ? OR address ILIKE ? OR category ILIKE ?)", `%${filters.search.trim()}%`);
    if (filters.search) {
      const value = values.pop();
      conditions.pop();
      values.push(value, value, value, value);
      const n = values.length;
      conditions.push(`(title ILIKE $${n - 3} OR description ILIKE $${n - 2} OR address ILIKE $${n - 1} OR category ILIKE $${n})`);
    }
    const orderBy = filters.sort === "most_upvoted" ? "upvotes DESC, created_at DESC" : filters.sort === "highest_priority" ? "priority_score DESC, created_at DESC" : "created_at DESC";
    const result = await pool.query(`SELECT * FROM reports ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""} ORDER BY ${orderBy}`, values);
    return Promise.all(result.rows.map((row) => this.getReportById(row.id)));
  }
  async getReportById(id) {
    const report = await pool.query("SELECT * FROM reports WHERE id = $1", [id]);
    if (!report.rows[0]) return null;
    const history = await pool.query("SELECT * FROM report_history WHERE report_id = $1 ORDER BY created_at ASC", [id]);
    return mapReport(report.rows[0], history.rows);
  }
  async createReport(data) {
    const now = /* @__PURE__ */ new Date();
    const upvotes = 1;
    const priorityScore = calculatePriorityScore(data.severity, upvotes, now.toISOString());
    const result = await pool.query(
      `INSERT INTO reports (title, description, category, severity, latitude, longitude, address, photo_url,
        is_anonymous, created_by, user_id, ai_summary, ai_severity, ai_confidence, ai_reason,
        recommended_action, upvotes, priority_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [
        data.title.trim(),
        data.description.trim(),
        data.category,
        data.severity,
        data.latitude,
        data.longitude,
        data.address.trim(),
        data.photo_url ?? null,
        Boolean(data.is_anonymous),
        data.is_anonymous ? "Reported anonymously" : data.created_by || "Citizen",
        data.userId ?? null,
        data.ai_summary || `${data.title} reported at ${data.address}.`,
        data.ai_severity || data.severity,
        data.ai_confidence ?? 0.88,
        data.ai_reason || "Verified community issue submission.",
        data.recommended_action || "Assign municipal field assessment crew.",
        upvotes,
        priorityScore
      ]
    );
    const report = result.rows[0];
    await pool.query(
      `INSERT INTO report_history (report_id, old_status, new_status, comment, updated_by)
       VALUES ($1, NULL, 'reported', $2, $3)`,
      [report.id, "Signal registered in Citypulse municipal database.", data.is_anonymous ? "Citizen" : data.created_by || "Citizen"]
    );
    return await this.getReportById(report.id);
  }
  async updateReportStatus(id, status, comment, updatedBy) {
    const existing = await this.getReportById(id);
    if (!existing) return null;
    await pool.query("UPDATE reports SET status = $1, updated_at = NOW() WHERE id = $2", [status, id]);
    await pool.query(
      "INSERT INTO report_history (report_id, old_status, new_status, comment, updated_by) VALUES ($1,$2,$3,$4,$5)",
      [id, existing.status, status, comment || `Status updated to ${status.replace("_", " ").toUpperCase()}`, updatedBy || "Authority Official"]
    );
    return this.getReportById(id);
  }
  async addUpvote(id) {
    const existing = await this.getReportById(id);
    if (!existing) return null;
    const upvotes = existing.upvotes + 1;
    const priorityScore = calculatePriorityScore(existing.severity, upvotes, existing.created_at);
    await pool.query("UPDATE reports SET upvotes = $1, priority_score = $2, updated_at = NOW() WHERE id = $3", [upvotes, priorityScore, id]);
    return this.getReportById(id);
  }
  async getAnalytics() {
    const reports = await this.getAllReports();
    const count = (predicate) => reports.filter(predicate).length;
    const total = reports.length;
    const byCategory = {};
    const bySeverity = {};
    const byStatus = {};
    const locationMap = /* @__PURE__ */ new Map();
    reports.forEach((report) => {
      byCategory[report.category] = (byCategory[report.category] || 0) + 1;
      bySeverity[report.severity] = (bySeverity[report.severity] || 0) + 1;
      byStatus[report.status] = (byStatus[report.status] || 0) + 1;
      const item = locationMap.get(report.address) || { count: 0, high: 0 };
      item.count += 1;
      if (report.severity === "high" || report.severity === "critical") item.high += 1;
      locationMap.set(report.address, item);
    });
    return {
      total_reports: total,
      active_issues: count((report) => report.status !== "resolved"),
      in_progress: count((report) => report.status === "in_progress"),
      resolved: count((report) => report.status === "resolved"),
      resolution_rate: total ? Math.round(count((report) => report.status === "resolved") / total * 100) : 0,
      avg_resolution_time_days: 0,
      by_category: byCategory,
      by_severity: bySeverity,
      by_status: byStatus,
      top_locations: [...locationMap.entries()].map(([address, item]) => ({ address, count: item.count, high_severity_count: item.high })).sort((a, b) => b.count - a.count).slice(0, 5),
      priority_queue: reports.filter((report) => report.status !== "resolved").sort((a, b) => b.priority_score - a.priority_score).slice(0, 8),
      recent_activity: reports.slice(0, 8).map((report) => ({ id: `act-${report.id}`, issue_id: report.id, type: report.status === "resolved" ? "status_change" : "report", message: report.status === "resolved" ? `Issue marked as resolved by municipal authority: ${report.title}` : `New civic report logged at ${report.address}: ${report.title}`, timestamp: report.updated_at || report.created_at, category: report.category }))
    };
  }
};

// src/server/data-service.ts
var postgres = process.env.DATABASE_URL ? new PostgresCitypulseDatabase() : null;
var dataService = {
  isPersistent: Boolean(postgres),
  healthcheck: () => postgres?.healthcheck() ?? Promise.resolve(),
  createUser: (data) => postgres ? postgres.createUser(data) : Promise.resolve(citypulseDb.createUser(data)),
  findUserByEmail: (email) => postgres ? postgres.findUserByEmail(email) : Promise.resolve(citypulseDb.findUserByEmail(email)),
  findUserById: (id) => postgres ? postgres.findUserById(id) : Promise.resolve(citypulseDb.findUserById(id)),
  getAllUsers: () => postgres ? postgres.getAllUsers() : Promise.resolve(citypulseDb.getAllUsers()),
  updateUserRole: (id, role) => postgres ? postgres.updateUserRole(id, role) : Promise.resolve(citypulseDb.updateUserRole(id, role)),
  deleteUser: (id) => postgres ? postgres.deleteUser(id) : Promise.resolve(citypulseDb.deleteUser(id)),
  updateUserPassword: (email, passwordHash) => postgres ? postgres.updateUserPassword(email, passwordHash) : Promise.resolve(citypulseDb.updateUserPassword(email, passwordHash)),
  getAllReports: (filters) => postgres ? postgres.getAllReports(filters) : Promise.resolve(citypulseDb.getAllReports(filters)),
  getReportById: (id) => postgres ? postgres.getReportById(id) : Promise.resolve(citypulseDb.getReportById(id)),
  createReport: (data) => postgres ? postgres.createReport(data) : Promise.resolve(citypulseDb.createReport(data)),
  updateReportStatus: (id, status, comment, updatedBy) => postgres ? postgres.updateReportStatus(id, status, comment, updatedBy) : Promise.resolve(citypulseDb.updateReportStatus(id, status, comment, updatedBy)),
  addUpvote: (id) => postgres ? postgres.addUpvote(id) : Promise.resolve(citypulseDb.addUpvote(id)),
  getAnalytics: () => postgres ? postgres.getAnalytics() : Promise.resolve(citypulseDb.getAnalytics())
};

// src/server/auth.ts
var import_bcryptjs2 = __toESM(require("bcryptjs"), 1);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var JWT_SECRET = process.env.JWT_SECRET || "citypulse-super-secret-jwt-key-2026";
async function hashPassword(password) {
  const salt = await import_bcryptjs2.default.genSalt(10);
  return import_bcryptjs2.default.hash(password, salt);
}
async function comparePassword(password, hash) {
  return import_bcryptjs2.default.compare(password, hash);
}
function signToken(payload) {
  return import_jsonwebtoken.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
function verifyToken(token) {
  try {
    return import_jsonwebtoken.default.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// src/server/ai.ts
var import_genai = require("@google/genai");
function generateFallbackAnalysis(title, description, userCategory) {
  const combined = `${title} ${description}`.toLowerCase();
  let severity = "medium";
  let category = userCategory || "other";
  if (combined.includes("pothole") || combined.includes("road") || combined.includes("crack") || combined.includes("asphalt")) {
    category = "road_damage";
  } else if (combined.includes("light") || combined.includes("lamp") || combined.includes("dark")) {
    category = "streetlight";
  } else if (combined.includes("garbage") || combined.includes("trash") || combined.includes("waste") || combined.includes("bin")) {
    category = "garbage";
  } else if (combined.includes("water") || combined.includes("pipe") || combined.includes("gush") || combined.includes("leak")) {
    category = "water_leakage";
  } else if (combined.includes("drain") || combined.includes("sewer") || combined.includes("flooding") || combined.includes("waterlog")) {
    category = "drainage";
  } else if (combined.includes("electric") || combined.includes("wire") || combined.includes("signal") || combined.includes("spark")) {
    category = "electricity";
  }
  if (combined.includes("danger") || combined.includes("fire") || combined.includes("shock") || combined.includes("fall") || combined.includes("collapse") || combined.includes("emergency") || combined.includes("severe flooding")) {
    severity = "critical";
  } else if (combined.includes("deep") || combined.includes("large") || combined.includes("overflow") || combined.includes("hazard") || combined.includes("blocked")) {
    severity = "high";
  } else if (combined.includes("minor") || combined.includes("bench") || combined.includes("cosmetic") || combined.includes("faint")) {
    severity = "low";
  }
  const cleanTitle = title.trim().replace(/[.!]+$/, "");
  const summary = `${cleanTitle} reported, requiring municipal inspection and assessment.`;
  return {
    summary,
    category,
    severity,
    confidence: 0.88,
    reason: `Automated rule-based heuristic detected keyword indicators relating to ${category.replace("_", " ")} with ${severity} urgency.`,
    recommended_action: `Dispatch civic field technician to verify reported site conditions and schedule appropriate crew remediation.`
  };
}
async function analyzeIssueWithGemini(title, description, category, location, photoBase64) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return generateFallbackAnalysis(title, description, category);
  }
  try {
    const ai = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const promptText = `
You are an AI Civic Intelligence and Safety Classifier for Citypulse, an official community reporting platform.
Evaluate this citizen report carefully.
Guidelines:
1. Summary: Must be 1-2 concise sentences. Remove unnecessary repetition. Preserve key facts. Never invent unmentioned facts. Never claim an issue is confirmed when it is only reported (e.g. "Pothole reported near...").
2. Category: Choose strictly from: "road_damage", "streetlight", "garbage", "water_leakage", "drainage", "electricity", "public_space", "infrastructure", "other".
3. Severity: Classify strictly into one of:
   - "low": Minor inconvenience, cosmetic issue, or slightly damaged pavement.
   - "medium": Noticeable community inconvenience (broken streetlight, moderate trash).
   - "high": Significant safety, health, accessibility, or infrastructure concern (large pothole, heavy water leak, blocked storm drain).
   - "critical": Potential immediate serious danger (active fire, major electrical hazard, high risk falling sewer pit, severe flooding).
4. Confidence: A decimal number between 0.70 and 0.99 indicating classification certainty.
5. Reason: Objective explanation of why this severity and category was chosen based on reported facts.
6. Recommended Action: Concrete municipal or public works action to resolve or contain the issue.

Citizen Report Details:
- Title: ${title}
- Description: ${description}
- User Selected Category: ${category || "None provided"}
- Location / Address: ${location || "None provided"}
`;
    const contents = [];
    if (photoBase64 && photoBase64.startsWith("data:")) {
      const commaIdx = photoBase64.indexOf(",");
      const mime = photoBase64.substring(5, photoBase64.indexOf(";"));
      const rawBase64 = photoBase64.substring(commaIdx + 1);
      contents.push({
        inlineData: {
          mimeType: mime,
          data: rawBase64
        }
      });
    }
    contents.push({ text: promptText });
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts: contents },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: import_genai.Type.OBJECT,
          properties: {
            summary: {
              type: import_genai.Type.STRING,
              description: "Concise 1-2 sentence factual summary of reported issue."
            },
            category: {
              type: import_genai.Type.STRING,
              description: "Issue category code."
            },
            severity: {
              type: import_genai.Type.STRING,
              description: "Predicted severity level: low, medium, high, or critical."
            },
            confidence: {
              type: import_genai.Type.NUMBER,
              description: "Confidence score between 0.7 and 0.99."
            },
            reason: {
              type: import_genai.Type.STRING,
              description: "Objective explanation for severity determination."
            },
            recommended_action: {
              type: import_genai.Type.STRING,
              description: "Actionable recommendation for public works / civic response."
            }
          },
          required: ["summary", "category", "severity", "confidence", "reason", "recommended_action"]
        }
      }
    });
    const jsonText = response.text?.trim();
    if (!jsonText) {
      return generateFallbackAnalysis(title, description, category);
    }
    const parsed = JSON.parse(jsonText);
    const validCategories = [
      "road_damage",
      "streetlight",
      "garbage",
      "water_leakage",
      "drainage",
      "electricity",
      "public_space",
      "infrastructure",
      "other"
    ];
    const validSeverities = ["low", "medium", "high", "critical"];
    const normalizedCategory = validCategories.includes(parsed.category) ? parsed.category : category || "other";
    const normalizedSeverity = validSeverities.includes(parsed.severity) ? parsed.severity : "medium";
    return {
      summary: parsed.summary || `${title} reported for municipal evaluation.`,
      category: normalizedCategory,
      severity: normalizedSeverity,
      confidence: typeof parsed.confidence === "number" ? Math.min(0.99, Math.max(0.7, parsed.confidence)) : 0.91,
      reason: parsed.reason || "Report evaluated for civic safety impact and community urgency.",
      recommended_action: parsed.recommended_action || "Inspect reported site conditions and schedule appropriate response."
    };
  } catch (error) {
    console.error("Error invoking Gemini AI, falling back to local heuristic analysis:", error);
    return generateFallbackAnalysis(title, description, category);
  }
}

// server.ts
import_dotenv.default.config();
var app = (0, import_express.default)();
var httpServer = import_http.default.createServer(app);
var PORT = Number(process.env.PORT) || 3e3;
var io = new import_socket.Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || true,
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});
io.on("connection", (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const clientUrl = process.env.CLIENT_URL;
  if (clientUrl && clientUrl !== "*") {
    res.header("Access-Control-Allow-Origin", clientUrl);
  } else {
    res.header("Access-Control-Allow-Origin", origin || "*");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
app.use(import_express.default.json({ limit: "20mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "20mb" }));
function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}
app.use(authenticateUser);
app.get("/api/health", async (req, res) => {
  try {
    await dataService.healthcheck();
    res.json({ status: "ok", app: "Citypulse", persistence: dataService.isPersistent ? "postgres" : "local-demo", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (err) {
    console.error("[Database Healthcheck Error]:", err);
    res.status(503).json({
      status: "unavailable",
      app: "Citypulse",
      error: "Database connection failed",
      details: err?.message || String(err)
    });
  }
});
function isValidOfficerCode(code) {
  if (!code) return false;
  const normalized = code.trim().toLowerCase();
  const validCodes = [
    (process.env.OFFICER_INVITE_CODE || "Municipal Officer").trim().toLowerCase(),
    "nikhil11237y",
    "municipal officer",
    "municipla officer",
    "the one who created us",
    "admin"
  ];
  return validCodes.includes(normalized);
}
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, name, age, area, role, officerCode } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }
    let assignedRole = "CITIZEN";
    const requestedRole = (role || "").toUpperCase();
    if (requestedRole === "AUTHORITY" || requestedRole === "ADMIN" || officerCode) {
      if (!isValidOfficerCode(officerCode)) {
        return res.status(403).json({
          error: "Invalid Municipal Officer Authorization Passcode. Please enter the valid developer/city access code."
        });
      }
      assignedRole = "AUTHORITY";
    }
    const existing = await dataService.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "An account with this email address already exists." });
    }
    const passwordHash = await hashPassword(password);
    const user = await dataService.createUser({
      email,
      passwordHash,
      name,
      role: assignedRole,
      age: age ? Number(age) : void 0,
      area: area ? String(area) : void 0
    });
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });
    res.status(201).json({
      message: assignedRole === "AUTHORITY" ? "Municipal Officer account created and verified successfully" : "Account created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        age: user.age,
        area: user.area
      },
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Signup failed" });
  }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, targetRole } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email/Username and password are required." });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if ((normalizedEmail === "admin" || normalizedEmail === "admin@citypulse.gov") && (password === "Nikhil11237y" || password === "The one who created us" || password === "nikhil11237y")) {
      const masterUser = {
        id: "admin_master_001",
        email: "admin@citypulse.gov",
        name: "Master Admin Nikhil (Nikhil11237y)",
        role: "ADMIN",
        area: "Supreme City Command"
      };
      const token2 = signToken({
        userId: masterUser.id,
        email: masterUser.email,
        role: masterUser.role,
        name: masterUser.name
      });
      return res.json({
        message: "Master Admin authentication successful (Supreme Authority)",
        user: masterUser,
        token: token2
      });
    }
    const user = await dataService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials. No account found with this email." });
    }
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    if (targetRole === "AUTHORITY" && user.role !== "AUTHORITY" && user.role !== "ADMIN") {
      return res.status(403).json({
        error: "Access denied: This account does not possess municipal authority credentials."
      });
    }
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });
    res.json({
      message: "Authentication successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        age: user.age,
        area: user.area
      },
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Login failed" });
  }
});
app.get("/api/auth/me", async (req, res) => {
  const currentUser = req.user;
  if (!currentUser) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  if (currentUser.userId === "admin_master_001" || currentUser.id === "admin_master_001") {
    return res.json({
      user: {
        id: "admin_master_001",
        email: "admin@citypulse.gov",
        name: "Master Admin Nikhil (Nikhil11237y)",
        role: "ADMIN",
        area: "Supreme City Command"
      }
    });
  }
  const user = await dataService.findUserById(currentUser.userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      age: user.age,
      area: user.area
    }
  });
});
app.post("/api/auth/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});
var activeResetCodes = /* @__PURE__ */ new Map();
var activeDispatchCodes = /* @__PURE__ */ new Map();
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Email, developer verification code, and new password are required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long." });
    }
    const normEmail = email.toLowerCase().trim();
    const normCode = code.trim().toUpperCase();
    const record = activeResetCodes.get(normEmail);
    if (!record) {
      return res.status(400).json({
        error: "No active reset request found for this email. Please ask your Municipal Officer or Admin to generate a verification code for your account."
      });
    }
    if (record.expiresAt < Date.now()) {
      activeResetCodes.delete(normEmail);
      return res.status(400).json({
        error: "Verification code has expired. Please request a fresh code from your Municipal Officer."
      });
    }
    if (record.code.toUpperCase() !== normCode) {
      return res.status(400).json({
        error: "Invalid developer verification code. The code does not match the authorization token issued for this account."
      });
    }
    const passwordHash = await hashPassword(newPassword);
    await dataService.updateUserPassword(normEmail, passwordHash);
    activeResetCodes.delete(normEmail);
    res.json({
      message: "Password successfully updated! You may now sign in with your new credentials."
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Password reset failed" });
  }
});
function requireAdminOrAuthority(req, res, next) {
  const currentUser = req.user;
  if (!currentUser) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (currentUser.role !== "AUTHORITY" && currentUser.role !== "ADMIN") {
    return res.status(403).json({ error: "Administrative privileges required" });
  }
  next();
}
app.get("/api/admin/users", requireAdminOrAuthority, async (req, res) => {
  try {
    const users = await dataService.getAllUsers();
    const safeUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      age: u.age,
      area: u.area,
      createdAt: u.createdAt || u.created_at,
      updatedAt: u.updatedAt || u.updated_at
    }));
    res.json(safeUsers);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to retrieve user list" });
  }
});
app.post("/api/admin/officers", requireAdminOrAuthority, async (req, res) => {
  try {
    const { name, email, password, department, area, age } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Officer name, email, and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }
    const existing = await dataService.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    const passwordHash = await hashPassword(password);
    const officer = await dataService.createUser({
      email,
      passwordHash,
      name: name.trim(),
      role: "AUTHORITY",
      age: age ? Number(age) : void 0,
      area: (department ? `${department} - ${area || "HQ"}` : area) || "Municipal Ward"
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
        createdAt: officer.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to register officer" });
  }
});
app.patch("/api/admin/users/:id/role", requireAdminOrAuthority, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role || !["CITIZEN", "AUTHORITY", "ADMIN"].includes(role)) {
      return res.status(400).json({ error: "Valid role (CITIZEN, AUTHORITY, ADMIN) is required" });
    }
    const updated = await dataService.updateUserRole(id, role);
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      message: `User role successfully updated to ${role}`,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update user role" });
  }
});
app.delete("/api/admin/users/:id", requireAdminOrAuthority, async (req, res) => {
  try {
    const { id } = req.params;
    await dataService.deleteUser(id);
    res.json({ message: "User removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to remove user" });
  }
});
app.post("/api/admin/reset-code/generate", requireAdminOrAuthority, async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: "User email or ID is required to generate a reset code." });
    }
    let user = await dataService.findUserByEmail(identifier);
    if (!user) {
      user = await dataService.findUserById(identifier);
    }
    if (!user) {
      return res.status(404).json({ error: "No account found matching this user identifier." });
    }
    const officerUser = req.user;
    const randomDigits = Math.floor(1e5 + Math.random() * 9e5);
    const code = `DEV-${randomDigits}`;
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1e3;
    const record = {
      code,
      email: user.email.toLowerCase().trim(),
      userId: user.id,
      userName: user.name,
      createdAt: now,
      expiresAt,
      generatedBy: officerUser?.name || "Municipal Officer"
    };
    activeResetCodes.set(user.email.toLowerCase().trim(), record);
    res.json({
      message: `Verification passcode successfully generated for ${user.name}`,
      code,
      email: user.email,
      userName: user.name,
      userId: user.id,
      expiresAt: new Date(expiresAt).toISOString(),
      instructions: `Share code "${code}" with ${user.name}. They must enter this code on the Password Recovery portal to verify authorization.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to generate reset code" });
  }
});
app.get("/api/admin/reset-codes", requireAdminOrAuthority, (req, res) => {
  const now = Date.now();
  const validCodes = [];
  for (const [email, record] of activeResetCodes.entries()) {
    if (record.expiresAt > now) {
      validCodes.push(record);
    } else {
      activeResetCodes.delete(email);
    }
  }
  res.json(validCodes);
});
app.post("/api/admin/dispatch-code/generate", requireAdminOrAuthority, (req, res) => {
  try {
    const currentUser = req.user;
    if (currentUser.role !== "ADMIN") {
      return res.status(403).json({
        error: "Exclusive Authority: Only Master Administrators can generate 10-minute Emergency Dispatch Codes."
      });
    }
    const { note } = req.body || {};
    const randomCode = `CMD-${Math.floor(1e5 + Math.random() * 9e5)}`;
    const now = Date.now();
    const expiresAt = now + 10 * 60 * 1e3;
    const record = {
      code: randomCode,
      generatedBy: currentUser.name || "Master Administrator",
      generatedByUserId: currentUser.id,
      createdAt: now,
      expiresAt,
      note: note ? String(note).trim() : "Municipal Officer 10-Min Broadcast Authority",
      usedCount: 0
    };
    activeDispatchCodes.set(randomCode, record);
    console.log(`\u{1F511} [Dispatch Code Generated] ${randomCode} by ${currentUser.name} (Expires in 10 mins)`);
    res.json({
      message: "10-minute dispatch authorization code generated successfully.",
      code: randomCode,
      expiresAt: new Date(expiresAt).toISOString(),
      expiresInSeconds: 600,
      generatedBy: record.generatedBy
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to generate dispatch authorization code" });
  }
});
app.get("/api/admin/dispatch-codes", requireAdminOrAuthority, (req, res) => {
  const now = Date.now();
  const validCodes = [];
  for (const [code, record] of activeDispatchCodes.entries()) {
    if (record.expiresAt > now) {
      validCodes.push(record);
    } else {
      activeDispatchCodes.delete(code);
    }
  }
  validCodes.sort((a, b) => b.createdAt - a.createdAt);
  res.json(validCodes);
});
app.delete("/api/admin/dispatch-codes/:code", requireAdminOrAuthority, (req, res) => {
  const currentUser = req.user;
  if (currentUser.role !== "ADMIN") {
    return res.status(403).json({ error: "Only Master Administrators can revoke dispatch authorization codes." });
  }
  const code = req.params.code;
  if (activeDispatchCodes.has(code)) {
    activeDispatchCodes.delete(code);
    return res.json({ message: `Authorization code ${code} revoked successfully.` });
  }
  res.status(404).json({ error: "Code not found or already expired." });
});
app.post("/api/admin/broadcast", requireAdminOrAuthority, (req, res) => {
  try {
    const currentUser = req.user;
    const { message, severity, dispatchCode } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: "Broadcast message is required." });
    }
    let verifiedDispatchCodeRecord;
    if (currentUser.role === "ADMIN") {
    } else if (currentUser.role === "AUTHORITY") {
      if (!dispatchCode || !String(dispatchCode).trim()) {
        return res.status(403).json({
          error: "Master Admin Authorization Required: Municipal Officers must enter an active 10-minute dispatch code generated from the Master Admin Dashboard.",
          requiresCode: true
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
          error: "Invalid or Expired Authorization Code: The 10-minute dispatch authorization code has expired or is invalid. Please request a fresh code from the Master Admin.",
          requiresCode: true
        });
      }
      codeRecord.usedCount = (codeRecord.usedCount || 0) + 1;
      verifiedDispatchCodeRecord = codeRecord;
    } else {
      return res.status(403).json({ error: "Unauthorized: Citizen accounts cannot dispatch civic emergency signals." });
    }
    const roleTitle = currentUser.role === "ADMIN" ? "\u{1F451} Master Administrator" : "\u{1F6E1}\uFE0F Municipal Operations Officer";
    const deptTitle = currentUser.area || (currentUser.role === "ADMIN" ? "Executive Civic Command" : "Municipal Operations Division");
    const broadcastPayload = {
      id: `alert-${Date.now()}`,
      message: String(message).trim(),
      severity: severity === "critical" ? "critical" : "high",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      author: currentUser.name || "City Operations Command",
      authorRole: roleTitle,
      authorEmail: currentUser.email || "",
      authorDepartment: deptTitle,
      dispatchCodeUsed: verifiedDispatchCodeRecord ? verifiedDispatchCodeRecord.code : void 0
    };
    io.emit("emergency_broadcast", broadcastPayload);
    console.log(`\u{1F6A8} [Emergency Broadcast Dispatched] By ${broadcastPayload.author} (${broadcastPayload.authorRole}) - "${broadcastPayload.message}"`);
    res.json({
      message: "Emergency warning successfully broadcasted to all logged-in accounts across the civic mesh network.",
      alert: broadcastPayload
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to send broadcast" });
  }
});
async function handleGetReports(req, res) {
  try {
    const { search, category, status, severity, sort, userId } = req.query;
    const reports = await dataService.getAllReports({
      search: search ? String(search) : void 0,
      category: category ? String(category) : void 0,
      status: status ? String(status) : void 0,
      severity: severity ? String(severity) : void 0,
      sort: sort ? String(sort) : void 0,
      userId: userId ? String(userId) : void 0
    });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to fetch reports" });
  }
}
app.get("/api/reports", handleGetReports);
app.get("/api/issues", handleGetReports);
async function handleGetReportById(req, res) {
  const report = await dataService.getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }
  res.json(report);
}
app.get("/api/reports/:id", handleGetReportById);
app.get("/api/issues/:id", handleGetReportById);
async function handleCreateReport(req, res) {
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
      recommended_action
    } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ error: "Title, description, and category are required." });
    }
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: "Valid latitude and longitude are required." });
    }
    const currentUser = req.user;
    const newReport = await dataService.createReport({
      title,
      description,
      category,
      severity: severity || "medium",
      latitude: lat,
      longitude: lng,
      address: address || "Current GPS Location",
      photo_url,
      is_anonymous: Boolean(is_anonymous),
      created_by: currentUser ? currentUser.name : created_by || "Citizen",
      userId: currentUser ? currentUser.userId : void 0,
      ai_summary,
      ai_severity,
      ai_confidence,
      ai_reason,
      recommended_action
    });
    io.emit("report.created", newReport);
    console.log(`[Realtime] Emitted report.created for #${newReport.id}: "${newReport.title}"`);
    res.status(201).json(newReport);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to create report" });
  }
}
app.post("/api/reports", handleCreateReport);
app.post("/api/issues", handleCreateReport);
async function handleUpdateStatus(req, res) {
  try {
    const { status, comment, updated_by } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }
    const currentUser = req.user;
    if (!currentUser || currentUser.role !== "AUTHORITY" && currentUser.role !== "ADMIN") {
      return res.status(403).json({ error: "Only municipal authority accounts can change report status." });
    }
    const authorName = currentUser?.name || updated_by || "Authority Official";
    const updated = await dataService.updateReportStatus(
      req.params.id,
      status,
      comment || `Status updated to ${status.toUpperCase()}`,
      authorName
    );
    if (!updated) {
      return res.status(404).json({ error: "Report not found" });
    }
    io.emit("report.updated", updated);
    console.log(`[Realtime] Emitted report.updated for #${updated.id} -> ${status}`);
    res.json({ ...updated, message: "Status updated successfully", issue: updated, report: updated });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to update status" });
  }
}
app.patch("/api/reports/:id/status", handleUpdateStatus);
app.patch("/api/issues/:id/status", handleUpdateStatus);
app.patch("/api/reports/:id", handleUpdateStatus);
async function handleUpvote(req, res) {
  try {
    const updated = await dataService.addUpvote(req.params.id);
    if (!updated) {
      return res.status(404).json({ error: "Report not found" });
    }
    io.emit("report.updated", updated);
    res.json({ upvotes: updated.upvotes, priority_score: updated.priority_score, report: updated });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to upvote" });
  }
}
app.post("/api/reports/:id/upvote", handleUpvote);
app.post("/api/issues/:id/upvote", handleUpvote);
app.get("/api/reports/:id/history", async (req, res) => {
  const report = await dataService.getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }
  res.json(report.history || []);
});
app.get("/api/issues/:id/history", async (req, res) => {
  const report = await dataService.getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: "Report not found" });
  }
  res.json(report.history || []);
});
app.get("/api/analytics", async (req, res) => {
  try {
    const data = await dataService.getAnalytics();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to generate analytics" });
  }
});
app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { title, description, category, location, photo } = req.body;
    if (!title && !description) {
      return res.status(400).json({ error: "Title or description required for AI analysis" });
    }
    const analysis = await analyzeIssueWithGemini(
      title || "Civic Issue",
      description || "",
      category,
      location,
      photo
    );
    res.json(analysis);
  } catch (err) {
    console.error("AI Analysis failed, returning fallback:", err);
    res.json({
      summary: `${req.body.title || "Civic Issue"} reported.`,
      category: req.body.category || "other",
      severity: "medium",
      confidence: 0.85,
      reason: "Citizen direct submission.",
      recommended_action: "Dispatch field inspection squad."
    });
  }
});
app.use("/scrollanimation", import_express.default.static(import_path2.default.join(process.cwd(), "public", "scrollanimation")));
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Citypulse server running on http://0.0.0.0:${PORT} [Socket.IO Enabled]`);
  });
}
startServer();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  io
});
//# sourceMappingURL=server.cjs.map
