const { getLicenses, saveLicenses } = require('../lib/db');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let key = '';
    let hwid = '';

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      key = body.key || body.license_key || '';
      hwid = body.hwid || '';
    } else {
      key = req.query.key || req.query.license_key || '';
      hwid = req.query.hwid || '';
    }

    key = (key || '').trim();
    hwid = (hwid || '').trim();

    if (!key) {
      return res.status(400).json({
        valid: false,
        status: "missing_key",
        message: "Please enter a valid License Key."
      });
    }

    const licenses = getLicenses();
    const license = licenses.find(l => l.key.toLowerCase() === key.toLowerCase());

    if (!license) {
      return res.status(404).json({
        valid: false,
        status: "invalid",
        message: "❌ Invalid License Key. Contact @The_Sabhyaplayer on Telegram."
      });
    }

    // Check if Revoked
    if (license.status === "revoked") {
      return res.status(403).json({
        valid: false,
        status: "revoked",
        message: "⛔ LICENSE REVOKED: Access has been disabled by Administrator. Contact @The_Sabhyaplayer."
      });
    }

    // Check Expiration
    if (license.expires_at) {
      const expiryDate = new Date(license.expires_at);
      if (new Date() > expiryDate) {
        license.status = "expired";
        saveLicenses(licenses);
        return res.status(403).json({
          valid: false,
          status: "expired",
          message: "⏳ LICENSE EXPIRED: Please contact @The_Sabhyaplayer to renew."
        });
      }
    }

    // Bind HWID if first time, or check HWID match if bound
    if (hwid) {
      if (!license.hwid) {
        license.hwid = hwid;
        saveLicenses(licenses);
      } else if (license.hwid !== hwid && license.plan !== "VIP LIFETIME") {
        return res.status(403).json({
          valid: false,
          status: "hwid_mismatch",
          message: "🔒 HARDWARE MISMATCH: License is bound to another PC. Contact @The_Sabhyaplayer to reset."
        });
      }
    }

    return res.status(200).json({
      valid: true,
      status: "active",
      client_name: license.client_name,
      plan: license.plan || "VIP ACCESS",
      expires_at: license.expires_at,
      hwid: license.hwid || hwid,
      message: "✓ License Verified & Active!"
    });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({
      valid: false,
      status: "error",
      message: "Internal server error during verification."
    });
  }
};
