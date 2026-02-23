import { deleteBranch } from '@/lib/actions/sedes';
import prisma from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreateBranchDialog } from '@/components/sedes/create-dialog';

export default async function SedesPage() {
    const branches = await prisma.branch.findMany({
        include: { _count: { select: { inventory: true, users: true } } },
        orderBy: { createdAt: 'desc' },
    });

    return (
        <div className="space-y-6">
            <div className="flex w-full items-center justify-between">
                <h1 className="text-2xl font-bold">Gestión de Sedes</h1>
                <CreateBranchDialog />
            </div>
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Dirección</TableHead>
                            <TableHead>Técnicos</TableHead>
                            <TableHead>Items Inventario</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {branches.map((branch) => (
                            <TableRow key={branch.id}>
                                <TableCell className="font-medium">{branch.name}</TableCell>
                                <TableCell>{branch.address || '-'}</TableCell>
                                <TableCell>{branch._count?.users || 0}</TableCell>
                                <TableCell>{branch._count?.inventory || 0}</TableCell>
                                <TableCell className="text-right">
                                    <form action={async () => {
                                        'use server'
                                        await deleteBranch(branch.id)
                                    }}>
                                        <Button variant="ghost" size="sm" type="submit" className="text-red-600 hover:text-red-800">
                                            Eliminar
                                        </Button>
                                    </form>
                                </TableCell>
                            </TableRow>
                        ))}
                        {branches.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-gray-500">
                                    No hay sedes registradas.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
