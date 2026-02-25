const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const hash = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'master@admin.com' },
        update: { password: hash, role: 'ADMIN' },
        create: {
            name: 'Master Admin',
            email: 'master@admin.com',
            password: hash,
            role: 'ADMIN'
        }
    });
    console.log('Master Admin upserted: master@admin.com / admin123');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
