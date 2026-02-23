'use server';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/mail';

const RequestSchema = z.object({
    userId: z.string(),
    branchId: z.string(),
    type: z.string(), // REQUEST, DAMAGE_REPORT, LOSS_REPORT, MAINTENANCE_REPORT
    description: z.string().min(5, 'La descripción es muy corta.'),
    image: z.any().optional(), // For now, handle separately or as string if URL
    evidenceUrl: z.string().optional(),
});

export async function createRequest(_prevState: unknown, formData: FormData) {
    const userId = formData.get('userId') as string;
    const branchId = formData.get('branchId') as string;
    const type = formData.get('type') as string;
    const description = formData.get('description') as string;
    const evidenceUrl = (formData.get('evidenceUrl') as string) || '';

    if (!userId || !branchId || !description) {
        return {
            errors: { description: !description ? ['La descripción es obligatoria'] : [] },
            message: 'Faltan datos requeridos.',
            success: false
        };
    }

    const validatedFields = RequestSchema.safeParse({
        userId, branchId, type, description, evidenceUrl
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Datos inválidos.',
            success: false
        };
    }

    try {
        await prisma.request.create({
            data: {
                userId,
                branchId,
                type,
                description,
                evidenceUrl,
                status: 'PENDING',
            },
        });

        // Simple non-blocking notification
        prisma.user.findMany({ where: { role: 'ADMIN' } }).then(async (admins) => {
            if (admins.length > 0) {
                const user = await prisma.user.findUnique({ where: { id: userId } });
                const branch = await prisma.branch.findUnique({ where: { id: branchId } });
                if (user && branch) {
                    for (const admin of admins) {
                        if (admin.email) {
                            sendEmail({
                                to: admin.email,
                                subject: `Nueva Solicitud: ${type} - ${user.name}`,
                                html: `<p>Nueva solicitud en ${branch.name} de ${user.name}</p>`
                            }).catch((err: unknown) => console.error('Email notify error:', err));
                        }
                    }
                }
            }
        }).catch((err: unknown) => console.error('Prisma notify error:', err));

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/requests');
        revalidatePath(`/dashboard/branch/${branchId}`);

        return { message: 'Solicitud creada exitosamente.', success: true };
    } catch (error) {
        console.error('Error in createRequest:', error);
        return {
            message: 'Error en el servidor.',
            success: false
        };
    }
}

export async function updateRequestStatus(id: string, status: string, branchId?: string) {
    try {
        await prisma.request.update({
            where: { id },
            data: {
                status,
                resolvedDate: status === 'RESOLVED' ? new Date() : null
            }
        });
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/requests');
        if (branchId) revalidatePath(`/dashboard/branch/${branchId}`);
        return { message: 'Estado actualizado.' };
    } catch (error) {
        return { message: 'Error actualizando estado.' };
    }
}

export async function resolveRequest(formData: FormData) {
    const id = formData.get('id') as string;
    const status = formData.get('status') as string;
    const expectedFixDate = formData.get('expectedFixDate') as string;
    const cost = parseFloat(formData.get('cost') as string || '0');
    const branchId = formData.get('branchId') as string;

    try {
        await prisma.request.update({
            where: { id },
            data: {
                status,
                cost,
                expectedFixDate: expectedFixDate ? new Date(expectedFixDate) : null,
                resolvedDate: status === 'RESOLVED' ? new Date() : null,
            }
        });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/requests');
        revalidatePath('/dashboard/maintenance-history');
        if (branchId) revalidatePath(`/dashboard/branch/${branchId}`);

        return { success: true, message: 'Solicitud actualizada correctamente.' };
    } catch (error) {
        console.error('Error resolving request:', error);
        return { success: false, message: 'Error al actualizar la solicitud.' };
    }
}
