const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedTools() {
    const tools = [
        { name: 'Taladro Percutor', type: 'EQUIPMENT', description: 'Taladro industrial' },
        { name: 'Pulidora', type: 'EQUIPMENT', description: 'Pulidora de 7 pulgadas' },
        { name: 'Compresor de Aire', type: 'EQUIPMENT', description: 'Compresor 50 litros' },
        { name: 'Planta de Soldar', type: 'EQUIPMENT', description: 'Inversor 200A' },
        { name: 'Juego de Llaves', type: 'TOOL', description: 'Kit de llaves mixtas' },
        { name: 'Destornilladores', type: 'TOOL', description: 'Kit de destornilladores' },
    ];

    for (const tool of tools) {
        const existing = await prisma.tool.findFirst({ where: { name: tool.name } });
        if (!existing) {
            await prisma.tool.create({ data: tool });
            console.log(`Created tool: ${tool.name}`);
        } else {
            console.log(`Tool already exists: ${tool.name}`);
        }
    }
}

seedTools()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
