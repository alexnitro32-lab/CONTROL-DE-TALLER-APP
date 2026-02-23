
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function completeScheduledMaintenance(assetId: string, nextDate: Date, cost: number, branchId: string) {
    if (!assetId || !nextDate || cost === undefined) {
        return { message: 'Faltan datos obligatorios.' };
    }

    try {
        // 1. Create a Completed Maintenance Record (for history)
        await prisma.maintenance.create({
            data: {
                assetId,
                type: 'PREVENTIVE',
                description: 'Mantenimiento Preventivo Programado',
                cost,
                status: 'COMPLETED',
                date: new Date(), // Date performed
                resolvedDate: new Date()
            }
        });

        // 2. Update Asset with NEW Next Maintenance Date
        await prisma.asset.update({
            where: { id: assetId },
            data: {
                lastMaintenanceDate: nextDate, // Set the NEW target date
                status: 'OPERATIONAL' // Ensure it stays operational
            }
        });

        revalidatePath(`/dashboard/branch/${branchId}`);
        return { message: 'Mantenimiento registrado correctamente.', type: 'success' };
    } catch (error) {
        console.error('Error completing maintenance:', error);
        return { message: 'Error al registrar mantenimiento.', type: 'error' };
    }
}
