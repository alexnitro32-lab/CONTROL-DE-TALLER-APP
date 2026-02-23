'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

export async function createTechnician(formData: FormData) {
    const branchId = formData.get('branchId') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!branchId || !name || !email || !password) {
        return { message: 'Todos los campos son obligatorios.', type: 'error' };
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: { name, email, password: hashedPassword, role: 'TECHNICIAN', branchId }
        });

        revalidatePath('/dashboard/technicians');
        revalidatePath(`/dashboard/branch/${branchId}`);
        return { message: 'Técnico creado correctamente.', type: 'success' };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { message: 'Error: El correo ya está registrado.', type: 'error' };
        }
        return { message: 'Error al crear técnico.', type: 'error' };
    }
}

export async function updateTechnician(formData: FormData) {
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const branchId = formData.get('branchId') as string;
    const password = formData.get('password') as string;

    if (!id || !name || !email || !branchId) {
        return { message: 'Faltan datos obligatorios.', type: 'error' };
    }

    try {
        const data: any = { name, email, branchId };
        if (password && password.trim().length > 0) {
            data.password = await bcrypt.hash(password, 10);
        }

        await prisma.user.update({ where: { id }, data });

        revalidatePath('/dashboard/technicians');
        return { message: 'Técnico actualizado correctamente.', type: 'success' };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { message: 'Error: El correo ya está registrado por otro usuario.', type: 'error' };
        }
        return { message: 'Error al actualizar técnico.', type: 'error' };
    }
}

export async function deleteTechnician(id: string) {
    if (!id) return { message: 'ID inválido.', type: 'error' };
    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: { branchId: true }
        });

        await prisma.$transaction([
            // 1. Libero equipos asignados (no los borro, solo quito el responsable)
            prisma.asset.updateMany({
                where: { assignedToId: id },
                data: { assignedToId: null }
            }),
            // 2. Borro historial de asignaciones
            prisma.assignment.deleteMany({
                where: { userId: id }
            }),
            // 3. Borro historial de solicitudes y reportes (daños/pérdidas)
            prisma.request.deleteMany({
                where: { userId: id }
            }),
            // 4. Borro el usuario tecnico
            prisma.user.delete({
                where: { id }
            })
        ]);

        revalidatePath('/dashboard/technicians');
        if (user?.branchId) revalidatePath(`/dashboard/branch/${user.branchId}`);

        return { message: 'Técnico y todo su historial eliminados correctamente.', type: 'success' };
    } catch (error) {
        console.error('Error deleting technician:', error);
        return { message: 'Error al eliminar técnico e historial.', type: 'error' };
    }
}

export async function markInventoryCheck(assetId: string, branchId: string) {
    try {
        await prisma.asset.update({
            where: { id: assetId },
            data: { lastInventoryCheck: new Date() }
        });
        revalidatePath(`/dashboard/branch/${branchId}`);
        revalidatePath('/dashboard/technicians');
        return { message: 'Inventario registrado correctamente.', type: 'success' };
    } catch (error) {
        return { message: 'Error al registrar inventario.', type: 'error' };
    }
}

export async function updateTechnicianInventoryDate(userId: string, date: string) {
    if (!userId || !date) return { message: 'Datos incompletos.', type: 'error' };
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { lastInventoryDate: new Date(date) }
        });
        revalidatePath(`/dashboard/technicians/${userId}`);
        revalidatePath('/dashboard/technicians');
        revalidatePath('/dashboard');
        return { message: 'Fecha de inventario cargada correctamente.', type: 'success' };
    } catch (error) {
        console.error('Error updating inventory date:', error);
        return { message: 'Error al actualizar la fecha.', type: 'error' };
    }
}
