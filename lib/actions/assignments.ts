'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { sendEmail } from '@/lib/mail';

const AssignSchema = z.object({
    userId: z.string(),
    toolId: z.string(),
    branchId: z.string(),
    quantity: z.coerce.number().min(1),
});

export async function assignTool(prevState: any, formData: FormData) {
    const validatedFields = AssignSchema.safeParse({
        userId: formData.get('userId'),
        toolId: formData.get('toolId'),
        branchId: formData.get('branchId'),
        quantity: formData.get('quantity'),
    });

    if (!validatedFields.success) {
        return { message: 'Datos inválidos.' };
    }

    const { userId, toolId, branchId, quantity } = validatedFields.data;

    // Transaction: Decrement branch inventory, Create Assignment
    try {
        await prisma.$transaction(async (tx) => {
            // Check availability
            const inventory = await tx.inventory.findUnique({
                where: { toolId_branchId: { toolId, branchId } }
            });

            if (!inventory || inventory.quantity < quantity) {
                throw new Error('Inventario insuficiente en sede.');
            }

            // Decrement
            await tx.inventory.update({
                where: { toolId_branchId: { toolId, branchId } },
                data: { quantity: { decrement: quantity } }
            });

            // Create assignment
            await tx.assignment.create({
                data: {
                    userId,
                    toolId,
                    quantity,
                    status: 'ACTIVE'
                }
            });
        });

        // Send Email Notification
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const tool = await prisma.tool.findUnique({ where: { id: toolId } });

        if (user?.email && tool) {
            await sendEmail({
                to: user.email,
                subject: 'Nueva Herramienta Asignada - Control Taller',
                html: `
                    <h1>Hola ${user.name},</h1>
                    <p>Se te ha asignado la siguiente herramienta:</p>
                    <ul>
                        <li><strong>Herramienta:</strong> ${tool.name}</li>
                        <li><strong>Cantidad:</strong> ${quantity}</li>
                    </ul>
                    <p>Por favor, revisa tu inventario en la aplicación.</p>
                `
            });
        }

    } catch (error: any) {
        return { message: error.message || 'Error al asignar herramienta.' };
    }

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/branch/${branchId}`);
    revalidatePath(`/dashboard/technicians/${userId}`);
    revalidatePath('/dashboard/technicians');
    return { message: 'Herramienta asignada.' };
}

export async function returnTool(assignmentId: string, branchId: string) {
    // Return tool to branch inventory
    try {
        await prisma.$transaction(async (tx) => {
            const assignment = await tx.assignment.findUnique({
                where: { id: assignmentId }
            });

            if (!assignment || assignment.status !== 'ACTIVE') {
                throw new Error('Asignación inválida.');
            }

            // Mark returned
            await tx.assignment.update({
                where: { id: assignmentId },
                data: {
                    status: 'RETURNED',
                    returnedAt: new Date()
                }
            });

            // Increment branch inventory
            // Wait, which branch? The one it came from?
            // Assignment doesn't store branchId directly, but usually returns to same branch or current branch of tech.
            // Requirement says "Assign Tool to Technician", "Inventario por técnico".
            // Implementation Plan: "Assignment" has userId, toolId.
            // If I return, I need to know where I put it back.
            // The argument branchId says where.

            await tx.inventory.upsert({
                where: { toolId_branchId: { toolId: assignment.toolId, branchId } },
                update: { quantity: { increment: assignment.quantity } },
                create: {
                    toolId: assignment.toolId,
                    branchId,
                    quantity: assignment.quantity,
                    status: 'OPERATIONAL' // Assume return as operational? Or ask?
                }
            });
        });
    } catch (error: any) {
        return { message: error.message || 'Error devolviendo herramienta.' };
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/technicians');
    revalidatePath(`/dashboard/branch/${branchId}`);
    return { message: 'Herramienta devuelta.' };
}

export async function returnToolAction(prevState: any, formData: FormData) {
    const assignmentId = formData.get('assignmentId') as string;
    const branchId = formData.get('branchId') as string;

    if (!assignmentId || !branchId) {
        return { message: 'Faltan datos.' };
    }

    return returnTool(assignmentId, branchId);
}

// ── Assign a fixed asset (equipment) to a technician ───────────────────────
export async function assignAssetToTechnician(technicianId: string, assetId: string, technicianBranchId: string) {
    try {
        await prisma.asset.update({
            where: { id: assetId },
            data: { assignedToId: technicianId }
        });
        revalidatePath(`/dashboard/technicians/${technicianId}`);
        revalidatePath('/dashboard/technicians');
        return { message: 'Equipo asignado correctamente.', type: 'success' };
    } catch (error) {
        console.error(error);
        return { message: 'Error al asignar equipo.', type: 'error' };
    }
}

// ── Unassign a fixed asset from technician (returns to branch pool) ─────────
export async function unassignAsset(assetId: string, technicianId: string) {
    try {
        await prisma.asset.update({
            where: { id: assetId },
            data: { assignedToId: null }
        });
        revalidatePath(`/dashboard/technicians/${technicianId}`);
        revalidatePath('/dashboard/technicians');
        return { message: 'Equipo desasignado correctamente.', type: 'success' };
    } catch (error) {
        return { message: 'Error al desasignar equipo.', type: 'error' };
    }
}

// ── Update the quantity of an active consumable assignment ──────────────────
export async function updateAssignmentQuantity(assignmentId: string, newQty: number, technicianId: string, branchId: string) {
    if (newQty < 1) return { message: 'Cantidad mínima es 1.', type: 'error' };
    try {
        const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
        if (!assignment) return { message: 'Asignación no encontrada.', type: 'error' };

        const diff = newQty - assignment.quantity; // positive = need more stock, negative = return surplus

        await prisma.$transaction(async (tx) => {
            if (diff > 0) {
                // Check stock
                const inv = await tx.inventory.findUnique({
                    where: { toolId_branchId: { toolId: assignment.toolId, branchId } }
                });
                if (!inv || inv.quantity < diff) throw new Error('Stock insuficiente en sede.');
                await tx.inventory.update({
                    where: { toolId_branchId: { toolId: assignment.toolId, branchId } },
                    data: { quantity: { decrement: diff } }
                });
            } else if (diff < 0) {
                // Return surplus to inventory
                await tx.inventory.upsert({
                    where: { toolId_branchId: { toolId: assignment.toolId, branchId } },
                    update: { quantity: { increment: Math.abs(diff) } },
                    create: { toolId: assignment.toolId, branchId, quantity: Math.abs(diff) }
                });
            }
            await tx.assignment.update({ where: { id: assignmentId }, data: { quantity: newQty } });
        });

        revalidatePath(`/dashboard/technicians/${technicianId}`);
        return { message: 'Cantidad actualizada.', type: 'success' };
    } catch (error: any) {
        return { message: error.message || 'Error al actualizar cantidad.', type: 'error' };
    }
}

// ── Remove (return all) a consumable assignment ─────────────────────────────
export async function removeAssignment(assignmentId: string, technicianId: string, branchId: string) {
    try {
        const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
        if (!assignment) return { message: 'No encontrada.', type: 'error' };

        await prisma.$transaction(async (tx) => {
            await tx.assignment.update({
                where: { id: assignmentId },
                data: { status: 'RETURNED', returnedAt: new Date() }
            });
            await tx.inventory.upsert({
                where: { toolId_branchId: { toolId: assignment.toolId, branchId } },
                update: { quantity: { increment: assignment.quantity } },
                create: { toolId: assignment.toolId, branchId, quantity: assignment.quantity }
            });
        });

        revalidatePath(`/dashboard/technicians/${technicianId}`);
        return { message: 'Herramienta devuelta al inventario.', type: 'success' };
    } catch (error: any) {
        return { message: error.message || 'Error al devolver.', type: 'error' };
    }
}

// ── Assign a simple tool directly to a technician (no inventory deduction) ──
// Creates the Tool record if it doesn't exist yet, then creates an Assignment.
export async function assignSimpleTool(
    technicianId: string,
    toolId: string | null,
    newToolName: string | null,
    quantity: number
) {
    if (!technicianId || quantity < 1) {
        return { message: 'Datos inválidos.', type: 'error' };
    }
    try {
        let resolvedToolId = toolId;

        if (!resolvedToolId) {
            if (!newToolName?.trim()) return { message: 'Ingresa el nombre de la herramienta.', type: 'error' };
            const existing = await prisma.tool.findFirst({
                where: { name: { equals: newToolName.trim() } }
            });
            resolvedToolId = existing
                ? existing.id
                : (await prisma.tool.create({ data: { name: newToolName.trim(), type: 'TOOL' } })).id;
        }

        const existingAssignment = await prisma.assignment.findFirst({
            where: { userId: technicianId, toolId: resolvedToolId, status: 'ACTIVE' }
        });

        if (existingAssignment) {
            await prisma.assignment.update({
                where: { id: existingAssignment.id },
                data: { quantity: { increment: quantity } }
            });
        } else {
            await prisma.assignment.create({
                data: { userId: technicianId, toolId: resolvedToolId, quantity, status: 'ACTIVE' }
            });
        }

        revalidatePath(`/dashboard/technicians/${technicianId}`);
        revalidatePath('/dashboard/technicians');
        return { message: 'Herramienta asignada correctamente.', type: 'success' };
    } catch (error: any) {
        return { message: error.message || 'Error al asignar.', type: 'error' };
    }
}

// ── Remove a simple tool assignment ─────────────────────────────────────────
export async function removeSimpleAssignment(assignmentId: string, technicianId: string) {
    try {
        await prisma.assignment.delete({ where: { id: assignmentId } });
        revalidatePath(`/dashboard/technicians/${technicianId}`);
        return { message: 'Herramienta removida.', type: 'success' };
    } catch (error: any) {
        return { message: error.message || 'Error al remover.', type: 'error' };
    }
}
