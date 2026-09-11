const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const verifyHandler = require('./api/verify');
const licensesHandler = require('./api/licenses');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Augment res with json/status helpers for serverless handler compatibility
  res.status = function(code) {
    this.statusCode = code;
    return this;
  };
  res.json = function(data) {
    this.setHeader('Content-Type', 'application/json');
    this.end(JSON.stringify(data));
    return this;
  };

  // Route: /api/verify
  if (pathname === '/api/verify' || pathname === '/api/verify.js') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      req.body = body;
      req.query = parsedUrl.query;
      verifyHandler(req, res);
    });
    return;
  }

  // Route: /api/licenses
  if (pathname === '/api/licenses' || pathname === '/api/licenses.js') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      req.body = body;
      req.query = parsedUrl.query;
      licensesHandler(req, res);
    });
    return;
  }

  // Static files in /public
  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(__dirname, 'public', 'index.html');
    }
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'text/html';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`XNX SPEED License Server running on http://localhost:${PORT}`);
  });
}

module.exports = server;
