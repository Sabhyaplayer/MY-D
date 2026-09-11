// In-Memory & Serverless Persistent State Manager for XNX SPEED Admin

let DB = {
  adminSecret: process.env.ADMIN_PASSWORD || "SABHYA@ADMIN#2026",
  masterRotatingKey: {
    key: "XNX-SPEED-PRO-2026#SABHYA",
    lastRotated: new Date().toISOString(),
    rotationInterval: "manual" // 'manual', 'daily', 'weekly'
  },
  broadcastMessage: {
    text: "⚡ XNX SPEED v4.0 ONLINE • PEAK TATKAL SPEED ACTIVE • BY SABHYA PLAYER",
    active: true,
    updatedAt: new Date().toISOString()
  },
  blockedHwids: [
    { hwid: "BLOCKED-SAMPLE-HWID-000", reason: "Unauthorized sharing / abuse", blockedAt: new Date().toISOString() }
  ],
  keys: [
    {
      id: "key-1",
      key: "XNX-SPEED-PRO-2026#SABHYA",
      tier: "Master Lifetime",
      durationDays: 3650,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3650 * 86400000).toISOString(),
      status: "active", // 'active', 'revoked', 'expired'
      boundHwid: null,
      maxDevices: 100,
      usageCount: 24,
      lastUsedAt: new Date().toISOString(),
      note: "Default Master Access Key"
    },
    {
      id: "key-2",
      key: "SABHYA@XNX-9988",
      tier: "VIP Lifetime",
      durationDays: 3650,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3650 * 86400000).toISOString(),
      status: "active",
      boundHwid: null,
      maxDevices: 50,
      usageCount: 12,
      lastUsedAt: new Date().toISOString(),
      note: "Backup VIP Key"
    },
    {
      id: "key-3",
      key: "XNX-TRIAL-24H-A8B9",
      tier: "24-Hour Pass",
      durationDays: 1,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1 * 86400000).toISOString(),
      status: "active",
      boundHwid: null,
      maxDevices: 1,
      usageCount: 1,
      lastUsedAt: new Date().toISOString(),
      note: "Single User Daily Trial"
    }
  ],
  logs: [
    { time: new Date().toISOString(), event: "Admin dashboard initialized with 3 default keys." }
  ]
};

function generateKeyString(prefix = "XNX", duration = "30D") {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segment = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${prefix}-${duration}-${segment(4)}-${segment(4)}`;
}

module.exports = {
  DB,
  generateKeyString
};
