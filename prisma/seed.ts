import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

import { seedCatalogue } from "./seed-catalogue"

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash("JolofAdmin2026!", 12)

  await prisma.user.upsert({
    where: { email: "admin1@jolofstream.com" },
    update: {},
    create: {
      email: "admin1@jolofstream.com",
      password,
      firstName: "Admin",
      lastName: "Un",
      role: "admin",
    },
  })

  await prisma.user.upsert({
    where: { email: "admin2@jolofstream.com" },
    update: {},
    create: {
      email: "admin2@jolofstream.com",
      password,
      firstName: "Admin",
      lastName: "Deux",
      role: "admin",
    },
  })

  console.log("Seed termine : 2 comptes admin crees")

  await seedCatalogue(prisma)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
