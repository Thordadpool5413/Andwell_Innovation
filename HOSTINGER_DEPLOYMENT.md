Hostinger deployment configuration for Andwell Innovation Command Center

Recommended dashboard settings:

Framework preset: Node.js / Next.js
Repository: Thordadpool5413/Andwell_Innovation
Branch: main
Node version: 20.x
Root directory: ./
Package manager: npm
Build command: npm run build
Start command: npm start

Do not set HOST to the public domain.
Let Hostinger manage PORT.

Current package scripts:

build: next build
start: node app.js

`app.js` is the Hostinger-friendly entry file. It delegates to the custom `server.js`, which starts Next.js with Hostinger's provided `PORT` and binds to `0.0.0.0` by default. This avoids the 503 loop caused by Hostinger starting the wrong file or serving static fallback HTML instead of the Node.js app.

After deployment, verify these JSON endpoints:

/api/health
/api/version
/api/runtime
/api/diagnostics
/api/analyze
