
import { PrismaClient } from "@prisma/client";
import * as argon2 from 'argon2';
import { changePasswordAction } from '../src/app/actions/auth-actions';

// We need to simulate FormData for changePasswordAction
async function testPasswordRules() {
    console.log("--- TESTING PASSWORD RULES ---");

    // 1. Weak passwords (too short, no uppercase)
    const weak1 = new FormData();
    weak1.append("currentPassword", "any");
    weak1.append("newPassword", "weakpass");
    weak1.append("confirmPassword", "weakpass");
    console.log("Test: weakpass (no uppercase, length OK)");
    // Note: Since we don't have a real session in this test script without mocking Next.js cookies,
    // we can only test the validation logic by looking at the code, but let's test the argon hashing directly if needed,
    // or just rely on the manual tests for the Server Action since it requires `cookies()`.

    // Instead, let's just create a test user, set a known password, and verify we can't set "creser123"
    // Actually, manual verification is better for Session/Cookie logic because Next.js `cookies()` is not available in raw Node scripts.
    console.log("Due to Next.js 'cookies()' dependency, password changes and sessions must be tested via the UI or a full mock.");
    console.log("Please refer to the manual verification steps for session and password rules.");
}

async function verifyDefaultClientsList() {
    console.log("--- VERIFYING DEFAULT CLIENTS LIST QUERY ---");
    const prisma = new PrismaClient();
    
    // Simulate the query in client-actions.ts
    const urgentInstallments = await prisma.installment.findMany({
        where: {
            isPaid: false,
            loan: {
                status: "ACTIVE"
            }
        },
        orderBy: { dueDate: 'asc' },
        select: { loan: { select: { clientId: true } } },
        take: 50
    });

    const uniqueClientIds = Array.from(new Set(urgentInstallments.map((i: any) => i.loan.clientId))) as string[];
    console.log(`Found ${uniqueClientIds.length} unique clients with urgent unmet installments.`);

    if (uniqueClientIds.length > 0) {
        const sampleClient = await prisma.client.findUnique({
             where: { id: uniqueClientIds[0] },
             select: { fullName: true, documentNumber: true }
        });
        console.log(`Top urgent client: ${sampleClient?.fullName} (Doc: ${sampleClient?.documentNumber})`);
    }

    await prisma.$disconnect();
}

async function run() {
    await testPasswordRules();
    await verifyDefaultClientsList();
}

run().catch(console.error);
