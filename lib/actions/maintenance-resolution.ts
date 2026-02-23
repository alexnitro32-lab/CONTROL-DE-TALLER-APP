
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function resolveMaintenance(formData: FormData) {
    const maintenanceId = formData.get('maintenanceId') as string;
    const resolvedDate = formData.get('resolvedDate') as string;
    const finalCost = formData.get('finalCost') as string;

    if (!maintenanceId || !resolvedDate) {
        return { message: 'Faltan datos obligatorios.' };
    }

    try {
        // 1. Get the maintenance record to find the asset
        const maintenance = await prisma.maintenance.findUnique({
            where: { id: maintenanceId },
            include: { asset: true }
        });

        if (!maintenance) return { message: 'Registro no encontrado.' };

        // 2. Update Maintenance Record
        await prisma.maintenance.update({
            where: { id: maintenanceId },
            data: {
                status: 'COMPLETED',
                resolvedDate: new Date(resolvedDate),
                cost: finalCost ? parseFloat(finalCost) : maintenance.cost, // Update cost if provided
            }
        });

        // 3. Update Asset Status to OPERATIONAL
        await prisma.asset.update({
            where: { id: maintenance.assetId },
            data: { status: 'OPERATIONAL' }
        });

        revalidatePath('/dashboard/report-novelty');
        // Revalidate branch dashboard if possible, hard to know exact URL from here but generally '/'
        revalidatePath('/dashboard');

        return { message: 'Mantenimiento gestionado correctamente.', type: 'success' };
    } catch (error) {
        console.error('Error resolving maintenance:', error);
        return { message: 'Error al gestionar el mantenimiento.', type: 'error' };
    }
}
