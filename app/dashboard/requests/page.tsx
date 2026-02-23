import prisma from '@/lib/prisma';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ResolveRequestDialog } from '@/components/requests/resolve-dialog';
import { BranchFilter } from '@/components/dashboard/branch-filter';

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ branchId?: string }> }) {
    const { branchId } = await searchParams;

    const [requests, branches] = await Promise.all([
        prisma.request.findMany({
            where: branchId ? { branchId } : {},
            include: {
                user: true,
                branch: true,
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.branch.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold">Solicitudes y Novedades</h1>
                <BranchFilter branches={branches} />
            </div>
            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Sede</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map((req) => (
                                <TableRow key={req.id} className="hover:bg-slate-50/50">
                                    <TableCell className="whitespace-nowrap text-sm">{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="whitespace-nowrap">{req.branch.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`text-[10px] uppercase whitespace-nowrap ${req.type === 'LOCATIVE' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : ''}`}>
                                            {req.type === 'LOCATIVE' ? 'Locativo' : req.type === 'REQUEST' ? 'Herramienta' : 'Reporte'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-sm">{req.user.name}</TableCell>
                                    <TableCell className="max-w-[150px] truncate text-sm" title={req.description}>{req.description}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={req.status} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <ResolveRequestDialog req={req as any} />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {requests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-gray-500 italic">
                                        No hay solicitudes pendientes.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
    if (status === 'PENDING') variant = "secondary";
    if (status === 'RESOLVED') variant = "default";
    if (status === 'APPROVED') variant = "outline";
    if (status === 'REJECTED') variant = "destructive";

    const labelMap: Record<string, string> = {
        'PENDING': 'Pendiente',
        'APPROVED': 'Aprobado',
        'REJECTED': 'Rechazado',
        'RESOLVED': 'Resuelto'
    };

    return (
        <Badge variant={variant}>
            {labelMap[status] || status}
        </Badge>
    );
}
