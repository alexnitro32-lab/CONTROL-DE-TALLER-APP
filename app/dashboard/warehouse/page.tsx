import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Clock, UserCheck, AlertTriangle } from 'lucide-react';
import { CreateLoanDialog } from '@/components/warehouse/create-loan-dialog';
import { AddWarehouseAssetDialog } from '@/components/warehouse/add-asset-dialog';
import { returnLoan, approveLoan } from '@/lib/actions/loans';

export default async function WarehousePage() {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return <div>Acceso Denegado</div>;

    const [loans, warehouseAssets, technicians, branches, tools] = await Promise.all([
        prisma.assignment.findMany({
            where: { type: 'LOAN' },
            include: { user: true, tool: true, asset: true },
            orderBy: { assignedAt: 'desc' }
        }),
        prisma.asset.findMany({
            where: {
                AND: [
                    { status: 'OPERATIONAL' },
                    { assignedToId: null } // Not assigned to a branch/tech permanently
                ]
            },
            include: { tool: true }
        }),
        prisma.user.findMany({ where: { role: 'TECHNICIAN' } }),
        prisma.branch.findMany({ orderBy: { name: 'asc' } }),
        prisma.tool.findMany({ where: { type: 'EQUIPMENT' }, orderBy: { name: 'asc' } })
    ]);

    const activeLoans = loans.filter(l => l.status === 'ACTIVE');
    const requestedLoans = loans.filter(l => l.status === 'REQUESTED');
    const overdueLoans = activeLoans.filter(l => l.expectedReturn && new Date(l.expectedReturn) < new Date());

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Herramienta Almacén</h1>
                    <p className="text-muted-foreground">Gestión de préstamos temporales y equipos en custodia del taller.</p>
                </div>
                <div className="flex gap-2">
                    <AddWarehouseAssetDialog branches={branches} tools={tools} />
                    <CreateLoanDialog technicians={technicians} assets={warehouseAssets} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50/20 border-blue-100">
                    <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">Activos en Préstamo</CardTitle>
                        <UserCheck className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeLoans.length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50/20 border-amber-100">
                    <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
                        <Clock className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{requestedLoans.length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-red-50/20 border-red-100">
                    <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">Préstamos Vencidos</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{overdueLoans.length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-50/20 border-emerald-100">
                    <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">Disponible Almacén</CardTitle>
                        <Package className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{warehouseAssets.length}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-zinc-50">
                            <TableRow>
                                <TableHead>Técnico</TableHead>
                                <TableHead>Herramienta</TableHead>
                                <TableHead>Fecha Préstamo</TableHead>
                                <TableHead>Fecha Devolución</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loans.map((loan) => (
                                <TableRow key={loan.id} className="hover:bg-zinc-50/50">
                                    <TableCell>
                                        <div className="font-medium text-zinc-900">{loan.user.name}</div>
                                        <div className="text-xs text-zinc-500">Solicitado el {new Date(loan.assignedAt).toLocaleDateString()}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-zinc-900 font-medium">{loan.tool.name}</div>
                                        <div className="text-xs text-zinc-500">SN: {loan.asset?.serialNumber}</div>
                                    </TableCell>
                                    <TableCell className="text-sm text-zinc-600">
                                        {new Date(loan.assignedAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        {loan.status === 'RETURNED' ? (
                                            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Devuelta: {loan.returnedAt?.toLocaleDateString()}</span>
                                        ) : (
                                            <div className="flex flex-col">
                                                <span className={`text-sm ${loan.expectedReturn && new Date(loan.expectedReturn) < new Date() ? 'text-red-600 font-bold' : 'text-zinc-600'}`}>
                                                    {loan.expectedReturn ? new Date(loan.expectedReturn).toLocaleDateString() : 'No definida'}
                                                </span>
                                                {loan.expectedReturn && new Date(loan.expectedReturn) < new Date() && <span className="text-[10px] text-red-500 font-bold uppercase">Vencido</span>}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={loan.status === 'ACTIVE' ? 'default' : loan.status === 'RETURNED' ? 'secondary' : 'outline'}
                                            className={loan.status === 'ACTIVE' ? 'bg-blue-600' : loan.status === 'REQUESTED' ? 'bg-amber-100 text-amber-700' : ''}
                                        >
                                            {loan.status === 'ACTIVE' ? 'En Préstamo' : loan.status === 'RETURNED' ? 'Devuelto' : 'Esperando Aprobación'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {loan.status === 'REQUESTED' && (
                                                <form action={async () => { await approveLoan(loan.id); }}>
                                                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">Aprobar</Button>
                                                </form>
                                            )}
                                            {loan.status === 'ACTIVE' && (
                                                <form action={async () => { await returnLoan(loan.id); }}>
                                                    <Button size="sm" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">Marcar Devolución</Button>
                                                </form>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {loans.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-zinc-400">
                                        No hay préstamos registrados.
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
