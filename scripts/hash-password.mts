// Buat nilai env login: APP_PASSWORD_HASH (argon2id, base64) + SESSION_SECRET acak.
import { hash } from "@node-rs/argon2";
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const password = (await rl.question("Password aplikasi: ")).trim();
rl.close();
if (password.length < 8) {
  console.error("Password minimal 8 karakter.");
  process.exit(1);
}
console.log("\nTempel ke .env.local dan Environment Variables Vercel:\n");
console.log(`APP_PASSWORD_HASH=${Buffer.from(await hash(password)).toString("base64")}`);
console.log(`SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
