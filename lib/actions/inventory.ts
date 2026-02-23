'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Tool Schema
const ToolSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Nombre obligatorio'),
    description: z.string().optional(),
    type: z.string(), // EQUIPMENT, TOOL
    maintenanceFreq: z.coerce.number().optional(), // Ensure number
    imageUrl: z.string().optional(),
});

const CreateTool = ToolSchema.omit({ id: true });

// Inventory Schema
const InventorySchema = z.object({
    toolId: z.string(),
    branchId: z.string(),
    quantity: z.coerce.number().min(0),
    status: z.string(),
});

export async function createTool(_prevState: unknown, formData: FormData) {
    const validatedFields = CreateTool.safeParse({
        name: formData.get('name'),
        description: formData.get('description'),
        type: formData.get('type'),
        maintenanceFreq: formData.get('maintenanceFreq'),
        imageUrl: formData.get('imageUrl'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos para crear la herramienta.',
        };
    }

    const { name, description, type, maintenanceFreq, imageUrl } = validatedFields.data;

    try {
        await prisma.tool.create({
            data: {
                name,
                description,
                type,
                maintenanceFreq,
                imageUrl,
            },
        });
    } catch (error) {
        return {
            message: 'Error DB: No se pudo crear la herramienta.',
        };
    }

    revalidatePath('/dashboard/inventory');
    return { message: 'Herramienta creada.' };
}

export async function addInventory(_prevState: unknown, formData: FormData) {
    // Logic to add stock to a branch
    const validatedFields = InventorySchema.safeParse({
        toolId: formData.get('toolId'),
        branchId: formData.get('branchId'),
        quantity: formData.get('quantity'),
        status: formData.get('status') || 'OPERATIONAL',
    });

    if (!validatedFields.success) {
        return { message: 'Datos inválidos for inventario.' };
    }

    const { toolId, branchId, quantity, status } = validatedFields.data;

    try {
        await prisma.inventory.upsert({
            where: {
                toolId_branchId: {
                    toolId,
                    branchId
                }
            },
            update: {
                quantity: { increment: quantity },
                status: status
            },
            create: {
                toolId,
                branchId,
                quantity,
                status
            }
        });
    } catch (error) {
        return { message: 'Error actualizando inventario.' };
    }

    revalidatePath('/dashboard/inventory'); // And branch specific page
    return { message: 'Inventario actualizado.' };
}

export async function updateInventoryItem(_prevState: unknown, formData: FormData) {
    const validatedFields = InventorySchema.safeParse({
        toolId: formData.get('toolId'),
        branchId: formData.get('branchId'),
        quantity: formData.get('quantity'),
        status: formData.get('status'),
    });

    if (!validatedFields.success) {
        return { message: 'Datos inválidos.' };
    }

    const { toolId, branchId, quantity, status } = validatedFields.data;

    try {
        await prisma.inventory.update({
            where: {
                toolId_branchId: {
                    toolId,
                    branchId
                }
            },
            data: {
                quantity,
                status
            }
        });
    } catch (error) {
        return { message: 'Error actualizando inventario.' };
    }

    revalidatePath(`/dashboard/branch/${branchId}`);
    return { message: 'Item actualizado.' };
}

export async function deleteInventoryItem(branchId: string, toolId: string) {
    try {
        await prisma.inventory.delete({
            where: {
                toolId_branchId: {
                    toolId,
                    branchId
                }
            }
        });
        revalidatePath(`/dashboard/branch/${branchId}`);
        return { message: 'Item eliminado.' };
    } catch (error) {
        return { message: 'Error eliminando item.' };
    }
}
