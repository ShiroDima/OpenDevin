import { PrismaClient } from "@prisma/client";

declare global {
  let prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({ log: ["query"] });

if (import.meta.env.VITE_NODE_ENV !== "production") {
  global.prisma = prisma;
}

// async function main() {
//   // ... you will write your Prisma Client queries here
//   const history = await prisma.chatHistory.findMany()

//   console.log(history)
// }

// export default main

// main()
//   .catch(async (e) => {
//     console.error(e)
//     process.exit(1)
//   })
//   .finally(async () => {
//     await prisma.$disconnect()
//   })
