
import prisma from '@/lib/prisma';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BranchFilter } from '@/components/dashboard/branch-filter';

export default async function MaintenanceHistoryPage({ searchParams }: { searchParams: Promise<{ branchId?: string }> }) {
    const { branchId } = await searchParams;

    const [maintenanceHistory, requestHistory, branches] = await Promise.all([
        prisma.maintenance.findMany({
            where: {
                status: 'COMPLETED',
                ...(branchId ? { asset: { branchId } } : {})
            },
            include: {
                asset: { include: { tool: true, branch: true } }
            },
            orderBy: { resolvedDate: 'desc' }
        }),
        prisma.request.findMany({
            where: {
                status: 'RESOLVED',
                cost: { gt: 0 },
                ...(branchId ? { branchId } : {})
            },
            include: {
                user: true,
                branch: true
            },
            orderBy: { resolvedDate: 'desc' }
        }),
        prisma.branch.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
    ]);

    // Combine and Sort
    const history = [
        ...maintenanceHistory.map(m => ({
            id: m.id,
            date: m.resolvedDate,
            title: m.asset.tool.name,
            subtitle: `Serial: ${m.asset.serialNumber}`,
            branch: m.asset.branch.name,
            description: m.description,
            cost: m.cost,
            type: 'Mantenimiento'
        })),
        ...requestHistory.map(r => ({
            id: r.id,
            date: r.resolvedDate,
            title: "Solicitud / Novedad",
            subtitle: `Usuario: ${r.user.name}`,
            branch: r.branch.name,
            description: r.description,
            cost: r.cost || 0,
            type: 'Solicitud'
        }))
    ].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold">Historial de Reparaciones y Novedades</h1>
                <BranchFilter branches={branches} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Eventos Finalizados</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>Fecha Solución</TableHead>
                                    <TableHead>Evento / Equipo</TableHead>
                                    <TableHead>Sede</TableHead>
                                    <TableHead>Fallo Reportado</TableHead>
                                    <TableHead className="text-right">Costo Final</TableHead>
                                    <TableHead>Tipo</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.map((record) => (
                                    <TableRow key={record.id} className="hover:bg-slate-50/50">
                                        <TableCell className="whitespace-nowrap text-sm">
                                            {record.date ? record.date.toLocaleDateString() : '-'}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span className="whitespace-nowrap">{record.title}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">{record.subtitle}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{record.branch}</TableCell>
                                        <TableCell className="max-w-[200px] truncate text-sm" title={record.description}>{record.description}</TableCell>
                                        <TableCell className="text-right font-bold text-amber-600">
                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(record.cost)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`text-[10px] uppercase ${record.type === 'Mantenimiento' ? "border-green-600 text-green-600" : "border-blue-600 text-blue-600"}`}>
                                                {record.type}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {history.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                                            No hay historial de reparaciones registrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
