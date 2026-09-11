# ⚡ XNX SPEED - VERCEL CLOUD LICENSE SERVER DEPLOYMENT GUIDE
**BOT BY SABHYA PLAYER** | Contact: [@The_Sabhyaplayer](https://t.me/The_Sabhyaplayer)

---

## 🌟 Overview
This license server provides a **Web Admin Dashboard** and **REST API** for:
- 🔑 **Real-Time License Generation** (Custom keys or auto-generated `XNX-XXXX-XXXX-XXXX`).
- 🔒 **Hardware ID (HWID) Locking** (Automatically locks key to user's PC on first activation).
- ⛔ **Instant Revocation** (1-Click revoke to immediately disable client access).
- ⏱ **Auto Expiration** (Configurable VIP days / Lifetime access).

---

## 🚀 1-Minute Vercel Deployment

### Option 1: Deploy with Vercel CLI (Fastest)

1. Open Terminal or Command Prompt in the `xnx-license-server` folder:
   ```bash
   cd "xnx-license-server"
   ```

2. Install Vercel CLI (if not already installed):
   ```bash
   npm install -g vercel
   ```

3. Deploy with a single command:
   ```bash
   vercel --prod
   ```

4. Follow the prompt (Accept defaults by pressing `Enter`). Once complete, Vercel gives you your live production URL, for example:
   `https://xnx-license-server.vercel.app`

---

### Option 2: Deploy via GitHub & Vercel Dashboard

1. Push your `xnx-license-server` folder to a new repository on [GitHub](https://github.com).
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Set Framework Preset to **"Other"** (Root directory: `./` or `xnx-license-server`).
5. (Optional) Set Environment Variable:
   - `ADMIN_PASSWORD`: Your secret admin password (Default: `ADMIN@SABHYA#2026`).
6. Click **Deploy**!

---

## 🛡️ Admin Dashboard Access

- **Dashboard URL**: `https://your-app-name.vercel.app`
- **Default Master Admin Password**: `ADMIN@SABHYA#2026`
- **Telegram Contact**: [@The_Sabhyaplayer](https://t.me/The_Sabhyaplayer)

### Admin Actions Available:
- **➕ Generate Key**: Create unique license for clients with custom duration (7 days, 30 days, 1 year, Lifetime).
- **⛔ Revoke Key**: Instantly blocks client from launching or using XNX SPEED.
- **🟢 Activate Key**: Re-enable previously revoked keys.
- **🔄 Reset HWID**: Allows client to migrate license to a new PC / Motherboard.
- **🗑 Delete**: Permanently removes key from database.

---

## 🔌 API Endpoints Reference

### 1. Client License Verification Endpoint
- **URL**: `/api/verify`
- **Method**: `POST` (or `GET`)
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "key": "XNX-XXXX-XXXX-XXXX",
    "hwid": "9F83A20BC4D12048"
  }
  ```
- **Response (Active)**:
  ```json
  {
    "valid": true,
    "status": "active",
    "client_name": "VIP Client",
    "plan": "30 DAYS VIP",
    "expires_at": "2026-10-11T18:00:00.000Z",
    "hwid": "9F83A20BC4D12048",
    "message": "✓ License Verified & Active!"
  }
  ```
- **Response (Revoked)**:
  ```json
  {
    "valid": false,
    "status": "revoked",
    "message": "⛔ LICENSE REVOKED: Access has been disabled by Administrator."
  }
  ```

---

### 2. Admin License Management Endpoint
- **URL**: `/api/licenses`
- **Method**: `GET`, `POST`, `PATCH`, `DELETE`
- **Headers**: `Authorization: Bearer ADMIN@SABHYA#2026`
