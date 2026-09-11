const fs = require('fs');
const path = require('path');
const https = require('https');

const TMP_FILE = path.join('/tmp', 'xnx_licenses.json');
const LOCAL_DATA_FILE = path.join(__dirname, '..', 'data', 'licenses.json');

// Default initial licenses
const DEFAULT_LICENSES = [
  {
    id: "LIC-001",
    key: "XNX-SPEED-PRO-2026#SABHYA",
    client_name: "Master Admin License",
    status: "active",
    plan: "VIP LIFETIME",
    hwid: "",
    created_at: "2026-09-10T00:00:00.000Z",
    expires_at: "2099-12-31T23:59:59.000Z",
    notes: "Primary Master Access Key"
  },
  {
    id: "LIC-002",
    key: "SABHYA@XNX-9988",
    client_name: "Sabhya VIP User",
    status: "active",
    plan: "VIP 1 YEAR",
    hwid: "",
    created_at: "2026-09-10T00:00:00.000Z",
    expires_at: "2027-09-10T23:59:59.000Z",
    notes: "Standard VIP Key"
  },
  {
    id: "LIC-003",
    key: "SABHYA",
    client_name: "Demo Key",
    status: "active",
    plan: "TRIAL ACCESS",
    hwid: "",
    created_at: "2026-09-10T00:00:00.000Z",
    expires_at: "2030-01-01T00:00:00.000Z",
    notes: "Quick Testing Key"
  }
];

// In-memory cache for serverless execution
let memoryLicenses = null;

function getDbFile() {
  if (fs.existsSync(TMP_FILE)) return TMP_FILE;
  if (fs.existsSync(LOCAL_DATA_FILE)) return LOCAL_DATA_FILE;
  return TMP_FILE;
}

function loadLicenses() {
  if (memoryLicenses) return memoryLicenses;

  try {
    const file = getDbFile();
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf8');
      memoryLicenses = JSON.parse(raw);
      return memoryLicenses;
    }
  } catch (e) {
    console.error("Error reading database file:", e);
  }

  memoryLicenses = JSON.parse(JSON.stringify(DEFAULT_LICENSES));
  saveLicenses(memoryLicenses);
  return memoryLicenses;
}

function saveLicenses(data) {
  memoryLicenses = data;
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    try {
      if (!fs.existsSync(path.dirname(LOCAL_DATA_FILE))) {
        fs.mkdirSync(path.dirname(LOCAL_DATA_FILE), { recursive: true });
      }
      fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.warn("Serverless disk write notice (using memory state):", err.message);
    }
  }
}

module.exports = {
  getLicenses: loadLicenses,
  saveLicenses: saveLicenses,
  DEFAULT_LICENSES: DEFAULT_LICENSES
};
