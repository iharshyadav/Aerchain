import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
const { Pool } = pkg;

declare global {
  var __prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (!process.env.DATABASE_URL) {
  throw new Error('Missing required environment variable: DATABASE_URL');
}

const pool = new Pool({
  connectionString: String(process.env.DATABASE_URL),
});

const adapter = new PrismaPg(pool);

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalThis.__prisma) {
    globalThis.__prisma = new PrismaClient({
      adapter,
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = globalThis.__prisma;
}

export { prisma };
export default prisma;
