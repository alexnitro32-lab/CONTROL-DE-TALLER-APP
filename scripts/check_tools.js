const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTools() {
    const tools = await prisma.tool.findMany();
    console.log('All Tools:', tools);
    const equipment = await prisma.tool.findMany({ where: { type: 'EQUIPMENT' } });
    console.log('Equipment Type Tools:', equipment);
}

checkTools()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
