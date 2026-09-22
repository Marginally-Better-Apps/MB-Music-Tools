#!/usr/bin/env node
// Usage: asc-api.cjs GET /v1/apps [body-file|-] [output-file]
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

async function main() {
  const [method = 'GET', endpoint, bodyFile, outputFile] = process.argv.slice(2);
  if (!endpoint || !/^\/v[12]\//.test(endpoint)) throw new Error('Use an App Store Connect /v1/ or /v2/ endpoint.');
  const metadataPath = process.env.APPLE_SIGNING_METADATA || '/tmp/tf-drop/meta.json';
  const metadata = fs.existsSync(metadataPath) ? JSON.parse(fs.readFileSync(metadataPath, 'utf8')) : {};
  const keyId = process.env.ASC_KEY_ID || metadata.key_id;
  const issuerId = process.env.ASC_ISSUER_ID || metadata.issuer_id;
  if (!keyId || !issuerId) throw new Error('ASC_KEY_ID and ASC_ISSUER_ID must be set in the environment or signing metadata.');
  const keyPath = process.env.ASC_KEY_PATH || path.join(os.homedir(), '.appstoreconnect/private_keys', `AuthKey_${keyId}.p8`);
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${encode({ alg: 'ES256', kid: keyId, typ: 'JWT' })}.${encode({ iss: issuerId, iat: now - 5, exp: now + 600, aud: 'appstoreconnect-v1' })}`;
  const signature = crypto.sign('sha256', Buffer.from(unsigned), { key: fs.readFileSync(keyPath), dsaEncoding: 'ieee-p1363' }).toString('base64url');
  const response = await fetch(`https://api.appstoreconnect.apple.com${endpoint}`, {
    method,
    headers: { Authorization: `Bearer ${unsigned}.${signature}`, 'Content-Type': 'application/json' },
    ...(bodyFile && bodyFile !== '-' ? { body: fs.readFileSync(bodyFile, 'utf8') } : {}),
    signal: AbortSignal.timeout(30000),
    redirect: 'error',
  });
  const text = await response.text();
  if (outputFile) fs.writeFileSync(outputFile, text, { mode: 0o600 });
  else if (text) console.log(text);
  console.error(`App Store Connect: ${response.status}`);
  if (!response.ok) {
    if (outputFile) console.error(text);
    process.exitCode = 1;
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
