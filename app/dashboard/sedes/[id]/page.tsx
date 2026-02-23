import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AddInventoryDialog } from '@/components/inventory/add-inventory-dialog';
import { EditInventoryDialog } from '@/components/inventory/edit-inventory-dialog';
import { AssignToolDialog } from '@/components/assignments/assign-dialog';

export default async function BranchPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const branch = await prisma.branch.findUnique({
        where: { id },
        include: {
            inventory: {
                include: { tool: true }
            },
            requests: {
                include: { user: true },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    const tools = await prisma.tool.findMany({
        orderBy: { name: 'asc' },
    });

    const technicians = await prisma.user.findMany({
        where: { role: 'TECHNICIAN' },
        orderBy: { name: 'asc' },
    });

    if (!branch) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex w-full items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{branch.name}</h1>
                    <p className="text-gray-500">{branch.address}</p>
                </div>
                <AddInventoryDialog branchId={branch.id} tools={tools} />
            </div>

            {/* Inventory Section */}
            <div className="rounded-md border bg-white">
                <h2 className="p-4 font-semibold">Inventario en Sede</h2>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Herramienta</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {branch.inventory.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">
                                    <div>{item.tool.name}</div>
                                </TableCell>
                                <TableCell>{item.tool.type}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>{item.status}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <AssignToolDialog item={item} technicians={technicians} />
                                    <EditInventoryDialog item={item} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {branch.inventory.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-gray-500">
                                    No hay inventario en esta sede.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Requests Section */}
            <div className="flex w-full items-center justify-between mt-8">
                <h2 className="text-xl font-bold">Solicitudes y Novedades</h2>
                {/* We need userId. For now hardcode or fetch current user. 
                    In server component, we can use auth().
                */}
                <CreateRequestDialogWrapper branchId={branch.id} />
            </div>
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {branch.requests.map((req) => (
                            <TableRow key={req.id}>
                                <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>{req.type}</TableCell>
                                <TableCell>{req.user.name}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{req.description}</TableCell>
                                <TableCell>{req.status}</TableCell>
                            </TableRow>
                        ))}
                        {branch.requests.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-gray-500">
                                    No hay solicitudes en esta sede.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

import { auth } from '@/auth';
import { CreateRequestDialog } from '@/components/requests/create-dialog';

async function CreateRequestDialogWrapper({ branchId }: { branchId: string }) {
    const session = await auth();
    if (!session?.user?.id) return null;
    return <CreateRequestDialog branchId={branchId} userId={session.user.id} />;
}
