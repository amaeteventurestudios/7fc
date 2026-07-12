#!/usr/bin/env node
/**
 * Interactive 7FC admin credential rotation.
 *
 * Usage:
 *   node scripts/rotate-admin-password.mjs            # production D1 (remote)
 *   node scripts/rotate-admin-password.mjs --local    # local wrangler D1
 *
 * Prompts for the admin email and a new password (input hidden, never
 * echoed, never written to disk or shell history). The password is hashed
 * with scrypt locally; only the hash is written to the admin_users table via
 * a temporary SQL file that is deleted immediately. Nothing sensitive is
 * printed.
 */
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";

const remoteFlag = process.argv.includes("--local") ? "--local" : "--remote";

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) {
      // Mask input: intercept output writes after the prompt.
      const onData = () => {
        readline.moveCursor(process.stdout, -1, 0);
        process.stdout.write("*");
      };
      rl.question(question, (answer) => {
        process.stdin.removeListener("data", onData);
        rl.close();
        process.stdout.write("\n");
        resolve(answer);
      });
      process.stdin.on("data", onData);
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

const email = (await ask("Admin email [admin@sevenfc.net]: ")).trim() || "admin@sevenfc.net";
const pw1 = await ask("New password (min 12 chars): ", { hidden: true });
if (pw1.length < 12) {
  console.error("Password must be at least 12 characters.");
  process.exit(1);
}
const pw2 = await ask("Repeat password: ", { hidden: true });
if (pw1 !== pw2) {
  console.error("Passwords do not match.");
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString("hex");
const hash = crypto.scryptSync(pw1, salt, 64).toString("hex");
const stored = `scrypt:${salt}:${hash}`;

const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "7fc-rotate-")), "rotate.sql");
fs.writeFileSync(
  tmp,
  `UPDATE admin_users SET email='${email.replace(/'/g, "''")}', password_hash='${stored}', is_temporary=0, updated_at=datetime('now');\n` +
    `INSERT INTO admin_users (id, email, password_hash, is_temporary, created_at, updated_at)\n` +
    `SELECT lower(hex(randomblob(16))), '${email.replace(/'/g, "''")}', '${stored}', 0, datetime('now'), datetime('now')\n` +
    `WHERE NOT EXISTS (SELECT 1 FROM admin_users);\n`,
  { mode: 0o600 }
);

const res = spawnSync(
  "npx",
  ["wrangler", "d1", "execute", "7fc-prod", remoteFlag, "--file", tmp],
  { stdio: ["inherit", "ignore", "inherit"] }
);
fs.rmSync(path.dirname(tmp), { recursive: true, force: true });

if (res.status !== 0) {
  console.error("Rotation failed — the previous credential is unchanged.");
  process.exit(res.status ?? 1);
}
console.log(`Done. Admin credential rotated for ${email}. Sign in at /admin/login.`);
