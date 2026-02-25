
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('123456', 10);
    await prisma.user.update({
        where: { email: 'admin@taller.com' },
        data: { password: hashedPassword },
    });
    console.log('Password reset for admin@taller.com to 123456');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
