'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createAsset(formData: FormData) {
    const branchId = formData.get('branchId') as string;
    const serialNumber = formData.get('serialNumber') as string;
    const purchaseDate = formData.get('purchaseDate') as string;
    const cost = formData.get('cost') as string;
    const lastMaintenanceDate = formData.get('lastMaintenanceDate') as string;

    console.log('Creating Asset Payload:', {
        branchId,
        serialNumber,
        isNewTool: formData.get('isNewTool'),
        toolId: formData.get('toolId'),
        newToolName: formData.get('newToolName'),
        cost,
        purchaseDate,
        lastMaintenanceDate
    });

    // New Tool Logic
    const isNewTool = formData.get('isNewTool') === 'true';
    let toolId = formData.get('toolId') as string;

    try {
        if (isNewTool) {
            const newName = formData.get('newToolName') as string;
            const newCategory = formData.get('newToolCategory') as string;

            if (!newName || !newCategory) {
                return { message: 'Nombre y categoría son obligatorios para nuevos equipos.' };
            }

            const newTool = await prisma.tool.create({
                data: {
                    name: newName,
                    description: 'Creado desde registro de activos',
                    type: 'EQUIPMENT',
                    category: newCategory
                }
            });
            toolId = newTool.id;
        } else {
            // Existing Tool: Update Category if provided
            const existingCategory = formData.get('existingToolCategory') as string;
            if (toolId && existingCategory) {
                await prisma.tool.update({
                    where: { id: toolId },
                    data: { category: existingCategory }
                });
            }
        }

        if (!branchId || !toolId || !serialNumber) {
            return { message: 'Faltan datos obligatorios.' };
        }

        await prisma.asset.create({
            data: {
                branchId,
                toolId,
                serialNumber,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
                lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate) : undefined,
                cost: cost ? parseFloat(cost) : undefined,
                status: 'OPERATIONAL'
            }
        });

        revalidatePath(`/dashboard/branch/${branchId}`);
        return { message: 'Equipo registrado correctamente.' };
    } catch (error: any) {
        console.error('Error creating asset:', error);
        if (error.code === 'P2002' && error.meta?.target?.includes('serialNumber')) {
            return { message: 'Error: El número de serial ya está registrado en el sistema. Verifique que sea único.' };
        }
        return { message: 'Error al registrar equipo. Intente nuevamente.' };
    }
}

export async function assignAsset(assetId: string, technicianId: string, branchId: string) {
    try {
        const assignedToId = technicianId === 'SHOP' ? null : technicianId;
        await prisma.asset.update({
            where: { id: assetId },
            data: { assignedToId }
        });
        revalidatePath(`/dashboard/branch/${branchId}`);
        return { message: 'Asignación actualizada correctamente.' };
    } catch (error) {
        console.error('Error assigning asset:', error);
        return { message: 'Error al asignar equipo.' };
    }
}

// Search tools for autocomplete
export async function searchTools(query: string) {
    if (!query || query.length < 2) return [];

    return await prisma.tool.findMany({
        where: {
            name: { contains: query },
            type: 'EQUIPMENT'
        },
        take: 5,
        orderBy: { name: 'asc' }
    });
}

