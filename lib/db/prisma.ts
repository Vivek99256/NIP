import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.prismaGlobal ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

let isDbReachable: boolean | null = null;

export async function checkDatabaseConnection(): Promise<boolean> {
  if (isDbReachable !== null) return isDbReachable;
  try {
    await prisma.$queryRaw`SELECT 1`;
    isDbReachable = true;
    return true;
  } catch (err) {
    isDbReachable = false;
    return false;
  }
}
