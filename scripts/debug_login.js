const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@taller.com';
    const passwordAttempt = '123456';

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log('User not found in DB');
        return;
    }

    const match = await bcrypt.compare(passwordAttempt, user.password);
    console.log('User Email:', user.email);
    console.log('Hashed Password in DB:', user.password);
    console.log('Attempting password:', passwordAttempt);
    console.log('Does it match?', match);

    if (!match) {
        console.log('Mismatch detected. Re-hashing...');
        const newHash = await bcrypt.hash(passwordAttempt, 10);
        await prisma.user.update({
            where: { email },
            data: { password: newHash }
        });
        console.log('Admin password re-hashed to 123456');
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
