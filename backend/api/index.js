// Vercel only auto-detects serverless functions inside an `api/`
// directory (zero-config) -- server.js itself lives at the project root
// so `npm start`/`node server.js` for local dev is unaffected. This file
// is just the thin entry point Vercel actually invokes: it re-exports
// the same Express app server.js already builds and exports.
module.exports = require('../server.js');
