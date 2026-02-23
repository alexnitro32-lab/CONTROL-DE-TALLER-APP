
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateAsset(formData: FormData) {
    const assetId = formData.get('assetId') as string;
    const serialNumber = formData.get('serialNumber') as string;
    const status = formData.get('status') as string;
    const branchId = formData.get('branchId') as string;
    // We can also allow editing cost, dates, etc.

    if (!assetId || !serialNumber || !branchId) {
        return { message: 'Faltan datos obligatorios.' };
    }

    try {
        const currentAsset = await prisma.asset.findUnique({ where: { id: assetId } });

        await prisma.asset.update({
            where: { id: assetId },
            data: {
                serialNumber,
                status,
                branchId
            }
        });

        // 1. If manually setting to MAINTENANCE or DAMAGED, ensure a ticket exists so it shows on Dashboard
        if ((status === 'MAINTENANCE' || status === 'DAMAGED') && currentAsset?.status !== status) {
            const pending = await prisma.maintenance.findFirst({
                where: { assetId, status: 'PENDING' }
            });

            if (!pending) {
                await prisma.maintenance.create({
                    data: {
                        assetId,
                        type: 'CORRECTIVE',
                        description: `Cambio de estado manual: ${status === 'DAMAGED' ? 'Reportado Dañado' : 'En Mantenimiento'}`,
                        cost: 0,
                        status: 'PENDING',
                        date: new Date()
                    }
                });
            }
        }

        // 2. If manually setting to OPERATIONAL, resolve any pending tickets
        if (status === 'OPERATIONAL' && currentAsset?.status !== 'OPERATIONAL') {
            await prisma.maintenance.updateMany({
                where: { assetId, status: 'PENDING' },
                data: {
                    status: 'COMPLETED',
                    resolvedDate: new Date()
                }
            });
        }

        revalidatePath('/dashboard/assets');
        revalidatePath(`/dashboard/branch/${branchId}`);
        return { message: 'Equipo actualizado correctamente.', type: 'success' };
    } catch (error) {
        console.error('Error updating asset:', error);
        return { message: 'Error al actualizar el equipo.', type: 'error' };
    }
}

export async function deleteAsset(assetId: string) {
    if (!assetId) return { message: 'ID inválido.' };

    try {
        await prisma.asset.delete({
            where: { id: assetId }
        });

        revalidatePath('/dashboard/assets');
        return { message: 'Equipo eliminado correctamente.', type: 'success' };
    } catch (error) {
        console.error('Error deleting asset:', error);
        return { message: 'Error al eliminar. Puede tener registros asociados.', type: 'error' };
    }
}
