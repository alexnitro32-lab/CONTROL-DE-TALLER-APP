'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const LocativeSchema = z.object({
    branchId: z.string().min(1, 'La sede es obligatoria'),
    description: z.string().min(5, 'La descripción es muy corta'),
    type: z.string().default('LOCATIVE'),
    cost: z.coerce.number().min(0).optional(),
    expectedFixDate: z.string().optional(),
    userId: z.string().min(1),
});

export async function createLocativeRepair(_prevState: unknown, formData: FormData) {
    const validatedFields = LocativeSchema.safeParse({
        branchId: formData.get('branchId'),
        description: formData.get('description'),
        cost: formData.get('cost') || 0,
        expectedFixDate: formData.get('expectedFixDate') || undefined,
        userId: formData.get('userId'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Campos faltantes o inválidos.',
            success: false,
        };
    }

    const { branchId, description, cost, expectedFixDate, userId } = validatedFields.data;

    try {
        await prisma.request.create({
            data: {
                branchId,
                description,
                userId,
                type: 'LOCATIVE',
                cost: cost || 0,
                expectedFixDate: expectedFixDate ? new Date(expectedFixDate) : null,
                status: 'PENDING',
            },
        });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/locative-repairs');
        revalidatePath(`/dashboard/branch/${branchId}`);

        return { success: true, message: 'Arreglo locativo reportado correctamente.' };
    } catch (error) {
        console.error('Error creating locative repair:', error);
        return { success: false, message: 'Error en el servidor al reportar el arreglo.' };
    }
}

export async function updateLocativeRepair(id: string, prevState: unknown, formData: FormData) {
    const validatedFields = LocativeSchema.safeParse({
        branchId: formData.get('branchId'),
        description: formData.get('description'),
        cost: formData.get('cost') || 0,
        expectedFixDate: formData.get('expectedFixDate') || undefined,
        userId: formData.get('userId'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Campos faltantes o inválidos.',
            success: false,
        };
    }

    const { branchId, description, cost, expectedFixDate } = validatedFields.data;

    try {
        await prisma.request.update({
            where: { id },
            data: {
                branchId,
                description,
                cost: cost || 0,
                expectedFixDate: expectedFixDate ? new Date(expectedFixDate) : null,
            },
        });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/locative-repairs');
        revalidatePath(`/dashboard/branch/${branchId}`);

        return { success: true, message: 'Arreglo locativo actualizado correctamente.' };
    } catch (error) {
        console.error('Error updating locative repair:', error);
        return { success: false, message: 'Error al actualizar el arreglo.' };
    }
}

export async function deleteLocativeRepair(id: string) {
    try {
        const repair = await prisma.request.findUnique({ where: { id } });
        if (!repair) return { success: false, message: 'No encontrado.' };

        await prisma.request.delete({ where: { id } });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/locative-repairs');
        revalidatePath(`/dashboard/branch/${repair.branchId}`);

        return { success: true, message: 'Arreglo locativo eliminado.' };
    } catch (error) {
        return { success: false, message: 'Error al eliminar el registro.' };
    }
}

export async function resolveLocativeRepair(id: string, cost: number, resolvedDate: string) {
    try {
        const repair = await prisma.request.findUnique({ where: { id } });
        if (!repair) return { success: false, message: 'Registro no encontrado.' };

        await prisma.request.update({
            where: { id },
            data: {
                status: 'RESOLVED',
                cost: cost,
                resolvedDate: new Date(resolvedDate),
            }
        });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/locative-repairs');
        revalidatePath(`/dashboard/branch/${repair.branchId}`);

        return { success: true, message: 'Arreglo locativo marcado como resuelto.' };
    } catch (error) {
        console.error('Error resolving locative repair:', error);
        return { success: false, message: 'Error al resolver el arreglo.' };
    }
}
