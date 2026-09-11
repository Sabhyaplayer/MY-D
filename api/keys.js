const { DB, generateKeyString } = require("./_db");

module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-password");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Verify Admin Authentication Header or query param
  const adminPass = req.headers["x-admin-password"] || req.query.admin_password || (req.body && req.body.admin_password);
  if (adminPass !== DB.adminSecret) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid Admin Credentials." });
  }

  // GET: Fetch Dashboard Data
  if (req.method === "GET") {
    const stats = {
      totalKeys: DB.keys.length,
      activeKeys: DB.keys.filter(k => k.status === "active").length,
      revokedKeys: DB.keys.filter(k => k.status === "revoked").length,
      expiredKeys: DB.keys.filter(k => k.status === "expired").length,
      blockedHwids: DB.blockedHwids.length,
      masterKey: DB.masterRotatingKey.key,
      lastRotated: DB.masterRotatingKey.lastRotated
    };

    return res.status(200).json({
      stats,
      masterRotatingKey: DB.masterRotatingKey,
      broadcastMessage: DB.broadcastMessage,
      keys: DB.keys,
      blockedHwids: DB.blockedHwids,
      logs: DB.logs.slice(-20)
    });
  }

  // POST: Execute Admin Actions
  if (req.method === "POST") {
    const { action, payload } = req.body || {};

    if (action === "create_key") {
      const { prefix = "XNX", durationDays = 30, tier = "VIP Monthly", count = 1, maxDevices = 1, note = "" } = payload || {};
      const newKeys = [];

      for (let i = 0; i < Math.min(count, 50); i++) {
        const keyStr = generateKeyString(prefix, durationDays >= 365 ? "LIFE" : `${durationDays}D`);
        const expiresAt = new Date(Date.now() + durationDays * 86400000).toISOString();
        const keyObj = {
          id: "key-" + Date.now() + "-" + i,
          key: keyStr,
          tier: durationDays >= 365 ? "VIP Lifetime" : `${durationDays}-Day Access`,
          durationDays,
          createdAt: new Date().toISOString(),
          expiresAt,
          status: "active",
          boundHwid: null,
          maxDevices,
          usageCount: 0,
          lastUsedAt: null,
          note: note || `Created by Admin on ${new Date().toLocaleDateString()}`
        };
        DB.keys.unshift(keyObj);
        newKeys.push(keyObj);
      }

      DB.logs.push({ time: new Date().toISOString(), event: `Generated ${newKeys.length} new key(s) [${tier}].` });
      return res.status(200).json({ success: true, message: `Created ${newKeys.length} key(s).`, keys: newKeys });
    }

    if (action === "rotate_master_key") {
      const newMaster = generateKeyString("XNX-MASTER", "PRO");
      DB.masterRotatingKey.key = newMaster;
      DB.masterRotatingKey.lastRotated = new Date().toISOString();
      DB.logs.push({ time: new Date().toISOString(), event: `Master key ROTATED to: ${newMaster}` });
      return res.status(200).json({ success: true, newMasterKey: newMaster, message: "Master Key Rotated Successfully!" });
    }

    if (action === "revoke_key") {
      const { keyId } = payload;
      const target = DB.keys.find(k => k.id === keyId || k.key === keyId);
      if (target) {
        target.status = "revoked";
        DB.logs.push({ time: new Date().toISOString(), event: `Revoked key: ${target.key}` });
        return res.status(200).json({ success: true, message: `Key ${target.key} has been REVOKED.` });
      }
      return res.status(404).json({ error: "Key not found." });
    }

    if (action === "reactivate_key") {
      const { keyId } = payload;
      const target = DB.keys.find(k => k.id === keyId || k.key === keyId);
      if (target) {
        target.status = "active";
        DB.logs.push({ time: new Date().toISOString(), event: `Reactivated key: ${target.key}` });
        return res.status(200).json({ success: true, message: `Key ${target.key} is now ACTIVE.` });
      }
      return res.status(404).json({ error: "Key not found." });
    }

    if (action === "delete_key") {
      const { keyId } = payload;
      const idx = DB.keys.findIndex(k => k.id === keyId || k.key === keyId);
      if (idx !== -1) {
        const deleted = DB.keys.splice(idx, 1)[0];
        DB.logs.push({ time: new Date().toISOString(), event: `Deleted key: ${deleted.key}` });
        return res.status(200).json({ success: true, message: `Deleted key ${deleted.key}.` });
      }
      return res.status(404).json({ error: "Key not found." });
    }

    if (action === "extend_key") {
      const { keyId, addDays = 30 } = payload;
      const target = DB.keys.find(k => k.id === keyId || k.key === keyId);
      if (target) {
        const currentExp = new Date(target.expiresAt);
        const baseTime = currentExp > new Date() ? currentExp.getTime() : Date.now();
        target.expiresAt = new Date(baseTime + addDays * 86400000).toISOString();
        target.status = "active";
        DB.logs.push({ time: new Date().toISOString(), event: `Extended key ${target.key} by +${addDays} days.` });
        return res.status(200).json({ success: true, message: `Extended key by ${addDays} days.`, newExpiry: target.expiresAt });
      }
      return res.status(404).json({ error: "Key not found." });
    }

    if (action === "reset_hwid") {
      const { keyId } = payload;
      const target = DB.keys.find(k => k.id === keyId || k.key === keyId);
      if (target) {
        target.boundHwid = null;
        DB.logs.push({ time: new Date().toISOString(), event: `Reset device HWID lock for: ${target.key}` });
        return res.status(200).json({ success: true, message: "Device lock cleared. Key can now bind to a new PC." });
      }
      return res.status(404).json({ error: "Key not found." });
    }

    if (action === "block_hwid") {
      const { hwid, reason = "Manual Admin Block" } = payload;
      if (!hwid) return res.status(400).json({ error: "Missing HWID." });
      if (!DB.blockedHwids.find(b => b.hwid.toLowerCase() === hwid.toLowerCase())) {
        DB.blockedHwids.push({ hwid, reason, blockedAt: new Date().toISOString() });
        DB.logs.push({ time: new Date().toISOString(), event: `BLOCKED Device HWID: ${hwid} (${reason})` });
      }
      return res.status(200).json({ success: true, message: `Device ${hwid} has been blacklisted.` });
    }

    if (action === "unblock_hwid") {
      const { hwid } = payload;
      const idx = DB.blockedHwids.findIndex(b => b.hwid.toLowerCase() === hwid.toLowerCase());
      if (idx !== -1) {
        DB.blockedHwids.splice(idx, 1);
        DB.logs.push({ time: new Date().toISOString(), event: `UNBLOCKED Device HWID: ${hwid}` });
        return res.status(200).json({ success: true, message: `Device ${hwid} has been unblocked.` });
      }
      return res.status(404).json({ error: "HWID not found in blacklist." });
    }

    if (action === "set_broadcast") {
      const { text, active = true } = payload;
      DB.broadcastMessage = {
        text: text || "⚡ XNX SPEED ONLINE",
        active,
        updatedAt: new Date().toISOString()
      };
      DB.logs.push({ time: new Date().toISOString(), event: `Broadcast message updated: "${text}"` });
      return res.status(200).json({ success: true, broadcast: DB.broadcastMessage });
    }

    return res.status(400).json({ error: "Unknown action." });
  }

  return res.status(405).json({ error: "Method not allowed." });
};
