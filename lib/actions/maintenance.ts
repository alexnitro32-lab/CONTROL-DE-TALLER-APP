
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createMaintenanceReport(formData: FormData) {
    const assetId = formData.get('assetId') as string;
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const expectedFixDate = formData.get('expectedFixDate') as string;
    const cost = formData.get('cost') as string;
    const type = 'CORRECTIVE'; // "Novedad" usually implies corrective

    if (!assetId || !description) {
        return { message: 'Faltan datos obligatorios.' };
    }

    try {
        const reportDate = date ? new Date(date) : new Date();
        const fixDate = expectedFixDate ? new Date(expectedFixDate) : null;
        const numericCost = cost ? parseFloat(cost) : 0;

        if (isNaN(reportDate.getTime())) {
            return { message: 'Fecha de reporte inválida.', type: 'error' };
        }
        if (fixDate && isNaN(fixDate.getTime())) {
            return { message: 'Fecha estimada de arreglo inválida.', type: 'error' };
        }
        if (isNaN(numericCost)) {
            return { message: 'El costo debe ser un número válido.', type: 'error' };
        }

        await prisma.maintenance.create({
            data: {
                assetId,
                description,
                type,
                date: reportDate,
                expectedFixDate: fixDate,
                cost: numericCost,
            }
        });

        // Optionally update asset status to MAINTENANCE
        await prisma.asset.update({
            where: { id: assetId },
            data: { status: 'MAINTENANCE' }
        });

        revalidatePath('/dashboard/report-novelty');
        return { message: 'Novedad reportada correctamente.', type: 'success' };
    } catch (error) {
        console.error('Error reporting novelty:', error);
        return { message: 'Error al reportar la novedad.', type: 'error' };
    }
}
