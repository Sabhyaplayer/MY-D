const { getLicenses, saveLicenses } = require('../lib/db');
const crypto = require('crypto');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ADMIN@SABHYA#2026";

function checkAuth(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const queryToken = req.query.token || req.query.admin_key || '';
  return token === ADMIN_PASSWORD || queryToken === ADMIN_PASSWORD;
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Basic admin authentication
  if (!checkAuth(req)) {
    return res.status(401).json({ success: false, message: "Unauthorized. Admin password required." });
  }

  const licenses = getLicenses();

  // 1. GET: List all licenses
  if (req.method === 'GET') {
    return res.status(200).json({ success: true, licenses: licenses });
  }

  // 2. POST: Generate new unique license
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const client_name = (body.client_name || 'Client User').trim();
    const plan = (body.plan || '30 DAYS VIP').trim();
    const notes = (body.notes || '').trim();
    const days = parseInt(body.days || '30', 10);

    // Generate unique license key format: XNX-XXXX-XXXX-XXXX
    let customKey = (body.custom_key || '').trim();
    if (!customKey) {
      const rand1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const rand2 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const rand3 = crypto.randomBytes(2).toString('hex').toUpperCase();
      customKey = `XNX-${rand1}-${rand2}-${rand3}`;
    }

    // Calculate expiry
    let expiresAt = new Date();
    if (days === 0 || plan.toUpperCase().includes('LIFETIME')) {
      expiresAt.setFullYear(2099, 11, 31);
    } else {
      expiresAt.setDate(expiresAt.getDate() + days);
    }

    const newLic = {
      id: "LIC-" + Date.now().toString(36).toUpperCase(),
      key: customKey,
      client_name: client_name,
      status: "active",
      plan: plan,
      hwid: "",
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      notes: notes
    };

    licenses.unshift(newLic);
    saveLicenses(licenses);

    return res.status(201).json({
      success: true,
      message: "License generated successfully!",
      license: newLic
    });
  }

  // 3. PATCH: Revoke, Activate, or Update License
  if (req.method === 'PATCH') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const id = body.id;
    const key = body.key;
    const action = body.action; // 'revoke', 'activate', 'reset_hwid', 'extend'

    const target = licenses.find(l => l.id === id || l.key === key);
    if (!target) {
      return res.status(404).json({ success: false, message: "License not found." });
    }

    if (action === 'revoke') {
      target.status = 'revoked';
    } else if (action === 'activate') {
      target.status = 'active';
    } else if (action === 'reset_hwid') {
      target.hwid = '';
    } else if (action === 'extend') {
      const addDays = parseInt(body.days || '30', 10);
      const currExpiry = new Date(target.expires_at || Date.now());
      currExpiry.setDate(currExpiry.getDate() + addDays);
      target.expires_at = currExpiry.toISOString();
      if (target.status === 'expired') target.status = 'active';
    }

    saveLicenses(licenses);
    return res.status(200).json({ success: true, message: `License ${action} successful!`, license: target });
  }

  // 4. DELETE: Remove License
  if (req.method === 'DELETE') {
    const id = req.query.id || (req.body && req.body.id);
    const key = req.query.key || (req.body && req.body.key);

    const index = licenses.findIndex(l => l.id === id || l.key === key);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "License not found." });
    }

    const removed = licenses.splice(index, 1);
    saveLicenses(licenses);
    return res.status(200).json({ success: true, message: "License deleted successfully.", license: removed[0] });
  }

  return res.status(405).json({ success: false, message: "Method not allowed." });
};
