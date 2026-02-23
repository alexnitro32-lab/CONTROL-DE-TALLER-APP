'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const BranchSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'El nombre es obligatorio'),
    address: z.string().optional(),
    managerId: z.string().optional(),
});

const CreateBranch = BranchSchema.omit({ id: true });
const UpdateBranch = BranchSchema;

export async function createBranch(prevState: any, formData: FormData) {
    const validatedFields = CreateBranch.safeParse({
        name: formData.get('name'),
        address: formData.get('address'),
        managerId: formData.get('managerId') || undefined,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos. No se pudo crear la sede.',
        };
    }

    const { name, address, managerId } = validatedFields.data;

    try {
        await prisma.branch.create({
            data: {
                name,
                address,
                managerId,
            },
        });
    } catch (error) {
        return {
            message: 'Error de base de datos: No se pudo crear la sede.',
        };
    }

    revalidatePath('/dashboard/sedes');
    return { message: 'Sede creada exitosamente.' };
}

export async function updateBranch(id: string, prevState: any, formData: FormData) {
    // Implementation for update
    return { message: 'Not implemented' };
}

export async function deleteBranch(id: string) {
    try {
        await prisma.branch.delete({
            where: { id },
        });
        revalidatePath('/dashboard/sedes');
        return { message: 'Sede eliminada.' };
    } catch (error) {
        return { message: 'Error de base de datos: No se pudo eliminar la sede.' };
    }
}
