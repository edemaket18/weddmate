import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding...")
  const hash = await bcrypt.hash("password123", 12)
  const user = await prisma.user.upsert({
    where: { email: "test@weddmate.app" },
    update: {},
    create: {
      email: "test@weddmate.app",
      motDePasse: hash,
      nom: "Koffi",
      prenom: "Ama",
      role: "COUPLE"
    }
  })
  console.log("User créé:", user.email)
}

main().catch(console.error).finally(() => prisma.$disconnect())
