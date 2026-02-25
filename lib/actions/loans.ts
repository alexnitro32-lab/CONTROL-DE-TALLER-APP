'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createLoan(formData: FormData) {
    const userId = formData.get('userId') as string;
    const assetId = formData.get('assetId') as string;
    const toolId = formData.get('toolId') as string;
    const expectedReturnStr = formData.get('expectedReturn') as string;
    const notes = formData.get('notes') as string;
    const isAdmin = formData.get('isAdmin') === 'true';

    try {
        await prisma.assignment.create({
            data: {
                userId,
                toolId,
                assetId,
                type: 'LOAN',
                status: isAdmin ? 'ACTIVE' : 'REQUESTED',
                expectedReturn: expectedReturnStr ? new Date(expectedReturnStr) : null,
                notes,
            }
        });

        // If admin creates it directly, we might want to mark the asset as reserved/in use
        if (isAdmin && assetId) {
            await prisma.asset.update({
                where: { id: assetId },
                data: { status: 'IN_USE' } // Consider adding this state or handle via assignments
            });
        }

        revalidatePath('/dashboard/warehouse');
        revalidatePath('/dashboard');
        return { success: true, message: isAdmin ? 'Préstamo registrado.' : 'Solicitud de préstamo enviada.' };
    } catch (error) {
        console.error('Error creating loan:', error);
        return { success: false, message: 'Error al procesar el préstamo.' };
    }
}

export async function returnLoan(loanId: string) {
    try {
        const loan = await prisma.assignment.findUnique({
            where: { id: loanId },
            include: { asset: true }
        });

        if (!loan) return { success: false, message: 'Préstamo no encontrado.' };

        await prisma.assignment.update({
            where: { id: loanId },
            data: {
                status: 'RETURNED',
                returnedAt: new Date()
            }
        });

        if (loan.assetId) {
            await prisma.asset.update({
                where: { id: loan.assetId },
                data: { status: 'OPERATIONAL' }
            });
        }

        revalidatePath('/dashboard/warehouse');
        revalidatePath('/dashboard');
        return { success: true, message: 'Herramienta devuelta correctamente.' };
    } catch (error) {
        console.error('Error returning loan:', error);
        return { success: false, message: 'Error al registrar devolución.' };
    }
}

export async function approveLoan(loanId: string) {
    try {
        const loan = await prisma.assignment.findUnique({
            where: { id: loanId }
        });

        if (!loan) return { success: false, message: 'Solicitud no encontrada.' };

        await prisma.assignment.update({
            where: { id: loanId },
            data: { status: 'ACTIVE', assignedAt: new Date() }
        });

        if (loan.assetId) {
            await prisma.asset.update({
                where: { id: loan.assetId },
                data: { status: 'IN_USE' }
            });
        }

        revalidatePath('/dashboard/warehouse');
        revalidatePath('/dashboard');
        return { success: true, message: 'Préstamo aprobado.' };
    } catch (error) {
        return { success: false, message: 'Error al aprobar préstamo.' };
    }
}

export async function registerWarehouseAsset(formData: FormData) {
    const branchId = formData.get('branchId') as string;
    const toolName = formData.get('toolName') as string;
    const serialNumber = formData.get('serialNumber') as string;
    const purchaseDate = formData.get('purchaseDate') as string;
    const cost = formData.get('cost') as string;

    if (!branchId || !toolName || !serialNumber) {
        return { success: false, message: 'Faltan datos obligatorios (Sede, Nombre, Serial).' };
    }

    try {
        // 1. Encontrar o crear la herramienta en el catálogo general
        let tool = await prisma.tool.findFirst({
            where: { name: { equals: toolName.trim() } }
        });

        if (!tool) {
            tool = await prisma.tool.create({
                data: {
                    name: toolName.trim(),
                    type: 'TOOL',
                    description: 'Creado automáticamente desde Almacén',
                }
            });
        }

        // 2. Registrar el activo físico (Asset)
        await prisma.asset.create({
            data: {
                branchId,
                toolId: tool.id,
                serialNumber,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
                cost: cost ? parseFloat(cost) : null,
                status: 'OPERATIONAL',
                assignedToId: null,
            }
        });

        revalidatePath('/dashboard/warehouse');
        return { success: true, message: 'Herramienta registrada exitosamente.' };
    } catch (error: any) {
        console.error('Error registering warehouse asset:', error);
        if (error.code === 'P2002') {
            return { success: false, message: 'El número de serial ya está registrado.' };
        }
        return { success: false, message: 'Error al registrar herramienta.' };
    }
}
