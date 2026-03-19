const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

async function main() {
    console.log("Models in Prisma Client:", Object.keys(prisma).filter(k => !k.startsWith("_") && !k.startsWith("$")))
    try {
        console.log("Checking authSession model...")
        if (prisma.authSession) {
            console.log("authSession model is available")
        } else {
            console.log("authSession model is NOT available")
        }
    } catch (e) {
        console.error("Error checking model:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
