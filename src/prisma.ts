import { PrismaClient} from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config"

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL no está definida");
}

const adapter = new PrismaPg(connectionString)
const prisma = new PrismaClient({
    adapter: adapter
});

export default prisma;

