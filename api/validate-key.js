const { DB } = require("./_db");

module.exports = (req, res) => {
  // Enable CORS for desktop app & web requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const data = req.method === "POST" ? req.body : req.query;
  const keyStr = (data.key || "").trim();
  const hwid = (data.hwid || "GENERIC-HWID").trim();
  const clientVersion = data.version || "4.0";

  if (!keyStr) {
    return res.status(400).json({ valid: false, message: "Missing license key parameter." });
  }

  // 1. Check if HWID is blocked
  const isBlocked = DB.blockedHwids.find(b => b.hwid.toLowerCase() === hwid.toLowerCase());
  if (isBlocked) {
    return res.status(200).json({
      valid: false,
      error: "HWID_BLOCKED",
      message: `Access Denied: Your Device HWID (${hwid}) is blocked. Reason: ${isBlocked.reason}. Contact @The_Sabhyaplayer`
    });
  }

  // 2. Check if key is the current rotating master key
  if (keyStr.toLowerCase() === DB.masterRotatingKey.key.toLowerCase()) {
    return res.status(200).json({
      valid: true,
      tier: "Master Rotating License",
      expiresAt: "Lifetime / Auto-Rotating",
      broadcast: DB.broadcastMessage,
      message: "Access Granted - Master Rotating Key Verified!"
    });
  }

  // 3. Search Key in DB
  const foundKey = DB.keys.find(k => k.key.toLowerCase() === keyStr.toLowerCase());
  if (!foundKey) {
    return res.status(200).json({
      valid: false,
      error: "INVALID_KEY",
      message: "Access Denied: Invalid Security Key. Contact @The_Sabhyaplayer on Telegram for an access license."
    });
  }

  // 4. Check if Key is Revoked
  if (foundKey.status === "revoked") {
    return res.status(200).json({
      valid: false,
      error: "KEY_REVOKED",
      message: "Access Denied: This license key has been REVOKED by Admin. Contact @The_Sabhyaplayer"
    });
  }

  // 5. Check if Key is Expired
  const now = new Date();
  const expiryDate = new Date(foundKey.expiresAt);
  if (now > expiryDate) {
    foundKey.status = "expired";
    return res.status(200).json({
      valid: false,
      error: "KEY_EXPIRED",
      message: `Access Denied: License expired on ${expiryDate.toLocaleDateString()}. Renew with @The_Sabhyaplayer`
    });
  }

  // 6. HWID Device Binding (if enabled)
  if (foundKey.maxDevices === 1) {
    if (!foundKey.boundHwid) {
      foundKey.boundHwid = hwid;
    } else if (foundKey.boundHwid.toLowerCase() !== hwid.toLowerCase()) {
      return res.status(200).json({
        valid: false,
        error: "DEVICE_MISMATCH",
        message: `License is locked to a different device (${foundKey.boundHwid}). Contact @The_Sabhyaplayer to reset device lock.`
      });
    }
  }

  // Update stats
  foundKey.usageCount = (foundKey.usageCount || 0) + 1;
  foundKey.lastUsedAt = new Date().toISOString();
  foundKey.lastHwid = hwid;

  return res.status(200).json({
    valid: true,
    tier: foundKey.tier,
    expiresAt: foundKey.expiresAt,
    boundHwid: foundKey.boundHwid,
    broadcast: DB.broadcastMessage,
    message: `Access Granted! [${foundKey.tier}] Welcome to XNX SPEED.`
  });
};
