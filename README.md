# ⚡ XNX SPEED Cloud Admin & License Controller

> **By Sabhya Player** | Telegram: [@The_Sabhyaplayer](https://t.me/The_Sabhyaplayer)  
> High-performance Cloud License Manager, Key Rotation Hub & Device Blacklist System ready for 1-click **Vercel** deployment.

---

## 🚀 Features

- **Cyber Red / Black HUD Design**: High-contrast UI powered by Google Fonts (*Orbitron*, *Rajdhani*, *JetBrains Mono*) and Tailwind CSS.
- **⚡ 1-Click Master Key Rotation**: Instantly rotate master keys to terminate prior sessions globally.
- **🔑 Flexible License Generation**:
  - 24-Hour Passes
  - 7-Day & 30-Day Subscriptions
  - 90-Day & Lifetime VIP Keys
  - Strict 1-Device HWID locking or Multi-device support
  - Bulk batch creation (1, 5, 10, 25 keys)
- **🚫 Key Revocation & Reactivation**: Revoke bad users or reinstate accounts with a single click.
- **🛡️ Device HWID Blacklist (Block / Unblock)**: Ban abusive devices from accessing the optimizer.
- **📢 Real-Time MOTD / Live Broadcast**: Push live alert banners to all running desktop app instances.
- **📜 Live Security Audit Trail**: Track every key rotation, creation, and revocation in real time.

---

## 🌐 Deploy to Vercel in 60 Seconds

### Method 1: Using Vercel Web Dashboard (Recommended)

1. Upload or push this folder to your **GitHub** account.
2. Go to [https://vercel.com/new](https://vercel.com/new).
3. Import your repository and set the **Root Directory** to `web_admin` (or deploy from repository root).
4. *(Optional)* Under **Environment Variables**, add:
   - `ADMIN_PASSWORD` = `YourCustomSecretPassword` (Default: `SABHYA@ADMIN#2026`)
5. Click **Deploy**! 🚀
6. Your live admin hub will be online at: `https://your-project.vercel.app`

---

### Method 2: Using Vercel CLI

```bash
cd web_admin
npx vercel
```
Follow the interactive prompt, select default settings, and you're live in 15 seconds!

---

## 🔐 Admin Authentication

- **Default Master Admin Password**: `SABHYA@ADMIN#2026`
- Once logged in, your session token is saved securely in your browser.
- You can change your password anytime by setting the `ADMIN_PASSWORD` environment variable in your Vercel Project Settings.

---

## 📡 API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/validate-key` | `GET` / `POST` | Desktop app verification endpoint (`?key=...&hwid=...`) |
| `/api/keys` | `GET` | Fetch all stats, keys, rotating master key, and audit logs |
| `/api/keys` | `POST` | Admin actions: `create_key`, `rotate_master_key`, `revoke_key`, `reactivate_key`, `extend_key`, `reset_hwid`, `block_hwid`, `unblock_hwid`, `set_broadcast` |

---

## 🤖 Desktop Client Integration

The desktop optimizer (`.exe`) sends a lightweight JSON payload to `/api/validate-key`:
```json
{
  "key": "XNX-30D-8F2K-9Q9A",
  "hwid": "DESKTOP-WIN11-B892",
  "version": "4.0"
}
```

Response:
```json
{
  "valid": true,
  "tier": "30-Day Access",
  "expiresAt": "2026-10-11T12:00:00.000Z",
  "broadcast": {
    "text": "⚡ XNX SPEED v4.0 ONLINE • PEAK TATKAL SPEED ACTIVE • BY SABHYA PLAYER",
    "active": true
  },
  "message": "Access Granted! [30-Day Access] Welcome to XNX SPEED."
}
```

---

## 💬 Support & Contact
For inquiries, custom bot development, and Tatkal configurations:
- **Telegram**: [@The_Sabhyaplayer](https://t.me/The_Sabhyaplayer)
