import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Home, Calendar, CircleDollarSign } from 'lucide-react';
import { CreateLocativeRepairDialog } from '@/components/locative/create-dialog';
import { ResolveLocativeRepairDialog } from '@/components/locative/resolve-dialog';
import { EditLocativeRepairDialog } from '@/components/locative/edit-dialog';
import { DeleteLocativeRepairButton } from '@/components/locative/delete-button';

export default async function LocativeRepairsPage() {
    const session = await auth();
    if (!session?.user) return <div>No autorizado</div>;

    const [repairs, branches] = await Promise.all([
        prisma.request.findMany({
            where: { type: 'LOCATIVE' },
            include: { branch: true, user: true },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.branch.findMany({ select: { id: true, name: true } })
    ]);

    const pendingCount = repairs.filter(r => r.status === 'PENDING').length;
    const resolvedCount = repairs.filter(r => r.status === 'RESOLVED').length;
    const totalSpent = repairs.reduce((acc, r) => acc + (r.cost || 0), 0);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Arreglos Locativos</h1>
                    <p className="text-muted-foreground">Gestión de adecuaciones y reparaciones de infraestructura de las sedes.</p>
                </div>
                <CreateLocativeRepairDialog userId={session.user.id!} branches={branches} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-lg">
                        <Calendar className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm text-zinc-500 font-medium">Pendientes</p>
                        <p className="text-2xl font-bold">{pendingCount}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-lg">
                        <Home className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm text-zinc-500 font-medium">Resueltos</p>
                        <p className="text-2xl font-bold">{resolvedCount}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <CircleDollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm text-zinc-500 font-medium">Inversión Total</p>
                        <p className="text-2xl font-bold">${totalSpent.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-zinc-50">
                        <TableRow>
                            <TableHead>Fecha Reporte</TableHead>
                            <TableHead>Sede</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Costo Est./Final</TableHead>
                            <TableHead>Fecha Ejecución</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {repairs.map((repair) => (
                            <TableRow key={repair.id} className="hover:bg-zinc-50/50">
                                <TableCell className="text-zinc-500 text-sm">
                                    {new Date(repair.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="font-semibold text-zinc-900">
                                    {repair.branch.name}
                                </TableCell>
                                <TableCell className="max-w-md">
                                    <div className="flex flex-col">
                                        <span className="text-zinc-900 leading-snug">{repair.description}</span>
                                        <span className="text-xs text-zinc-400">Reportado por {repair.user.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="font-medium text-emerald-600">
                                        ${(repair.cost || 0).toLocaleString()}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {repair.status === 'RESOLVED' ? (
                                        <span className="text-zinc-600 text-sm">
                                            Resuelto: {repair.resolvedDate?.toLocaleDateString()}
                                        </span>
                                    ) : (
                                        <span className={`${repair.expectedFixDate && new Date(repair.expectedFixDate) < new Date() ? 'text-red-500 font-semibold' : 'text-zinc-500'} text-sm`}>
                                            {repair.expectedFixDate ? repair.expectedFixDate.toLocaleDateString() : 'Pendiente'}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={repair.status === 'RESOLVED' ? 'secondary' : 'default'} className={repair.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50' : 'bg-amber-50 text-amber-700 hover:bg-amber-50'}>
                                        {repair.status === 'RESOLVED' ? 'Resuelto' : 'Pendiente'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1 items-center">
                                        <EditLocativeRepairDialog
                                            userId={session.user.id!}
                                            branches={branches}
                                            repair={repair}
                                        />
                                        <DeleteLocativeRepairButton id={repair.id} />
                                        {repair.status === 'PENDING' ? (
                                            <ResolveLocativeRepairDialog repair={repair} />
                                        ) : (
                                            <Badge variant="outline" className="ml-2 bg-zinc-50 text-[10px] text-zinc-400 border-zinc-200">Archivado</Badge>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {repairs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-zinc-400">
                                    No hay registros de arreglos locativos.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
