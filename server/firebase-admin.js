/**
 * server/firebase-admin.js
 *
 * Initializes Firebase Admin SDK. Credentials come from either:
 *   1. FIREBASE_SERVICE_ACCOUNT_JSON env var (Render / production)
 *   2. FIREBASE_SERVICE_ACCOUNT_PATH file (local dev)
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  // Render / production path
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    console.log('[FIREBASE] Loaded credentials from FIREBASE_SERVICE_ACCOUNT_JSON env var');
  } catch (err) {
    console.error('[FIREBASE] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
    process.exit(1);
  }
} else {
  // Local dev path
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : join(__dirname, 'serviceAccountKey.json');

  try {
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    console.log(`[FIREBASE] Loaded credentials from file: ${serviceAccountPath}`);
  } catch (err) {
    console.error(`[FIREBASE] Could not read service account file at ${serviceAccountPath}:`, err.message);
    process.exit(1);
  }
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log(`[FIREBASE] Connected to project: ${serviceAccount.project_id}`);
} catch (err) {
  console.error('[FIREBASE] admin.initializeApp failed:', err.message);
  process.exit(1);
}

export const db = admin.firestore();
export const auth = admin.auth();