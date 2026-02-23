
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateAssetMaintenanceDate(assetId: string, date: Date) {
    try {
        await prisma.asset.update({
            where: { id: assetId },
            data: { lastMaintenanceDate: date }
        });
        revalidatePath('/dashboard/assets');
        return { message: 'Fecha actualizada correctamente.', type: 'success' };
    } catch (error) {
        console.error('Error updating maintenance date:', error);
        return { message: 'Error al actualizar la fecha.', type: 'error' };
    }
}
