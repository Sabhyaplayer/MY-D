const http = require("http");
const fs = require("fs");
const path = require("path");

const keysApi = require("./api/keys");
const validateApi = require("./api/validate-key");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Parse body for POST requests
  if (req.method === "POST") {
    let bodyStr = "";
    req.on("data", chunk => { bodyStr += chunk.toString(); });
    req.on("end", () => {
      try {
        req.body = JSON.parse(bodyStr || "{}");
      } catch (e) {
        req.body = {};
      }
      routeRequest(req, res);
    });
  } else {
    req.body = {};
    routeRequest(req, res);
  }
});

function routeRequest(req, res) {
  const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = urlObj.pathname;

  // Polyfill query on req
  req.query = Object.fromEntries(urlObj.searchParams);

  // Polyfill res.status().json()
  res.status = function(code) {
    res.statusCode = code;
    return res;
  };
  res.json = function(data) {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  };

  // API Routes
  if (pathname === "/api/keys") {
    return keysApi(req, res);
  }
  if (pathname === "/api/validate-key") {
    return validateApi(req, res);
  }

  // Static Files from public directory
  let filePath = path.join(__dirname, "public", pathname === "/" ? "index.html" : pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, "public", "index.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml"
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.statusCode = 404;
      return res.end("Not Found");
    }
    res.setHeader("Content-Type", mimeTypes[ext] || "text/plain");
    res.end(content);
  });
}

server.listen(PORT, () => {
  console.log("=================================================================");
  console.log(` 🚀 XNX SPEED Admin Dashboard running at: http://localhost:${PORT}`);
  console.log(` 🔑 Default Admin Password: SABHYA@ADMIN#2026`);
  console.log(` 🌐 Deploy to Vercel with 1 click using: vercel`);
  console.log("=================================================================");
});
