import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Box, Wrench, AlertTriangle, ClipboardList, PackageOpen } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ReturnToolDialog } from '@/components/assignments/return-dialog';
import { TechnicianRequestDialog } from '@/components/technicians/technician-request-dialog';
import { CreateLoanDialog } from '@/components/warehouse/create-loan-dialog';
import Link from 'next/link';
import { BranchSelector } from '@/components/dashboard/branch-selector';

export default async function DashboardPage() {
    const session = await auth();
    const userRole = session?.user?.role;
    const userId = session?.user?.id;

    if (userRole === 'ADMIN') {
        return <AdminDashboard />;
    } else if (userRole === 'TECHNICIAN' && userId) {
        return <TechnicianDashboard userId={userId as string} />;
    } else {
        return <div className="p-8 text-center text-muted-foreground">Acceso no autorizado o rol desconocido.</div>;
    }
}

async function AdminDashboard() {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const [
        pendingRequestsCount,
        pendingMaintenancesCount,
        overdueAssetsCount,
        overdueTechsCount,
        latestRequests,
        activeMaintenances,
        overdueAssets,
        overdueTechs,
        allCompletedMaintenances,
        branches,
        allRequests
    ] = await Promise.all([
        prisma.request.count({ where: { status: 'PENDING' } }),
        prisma.maintenance.count({ where: { status: 'PENDING' } }),
        prisma.asset.count({
            where: {
                tool: { type: 'EQUIPMENT' },
                OR: [
                    { AND: [{ lastInventoryCheck: null }, { createdAt: { lt: ninetyDaysAgo } }] },
                    { lastInventoryCheck: { lt: ninetyDaysAgo } }
                ]
            }
        }),
        prisma.user.count({
            where: {
                role: 'TECHNICIAN',
                OR: [
                    { AND: [{ lastInventoryDate: null }, { createdAt: { lt: ninetyDaysAgo } }] },
                    { lastInventoryDate: { lt: ninetyDaysAgo } }
                ]
            }
        }),
        prisma.request.findMany({
            where: { status: 'PENDING' },
            include: { user: { select: { name: true } }, branch: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 5
        }),
        prisma.maintenance.findMany({
            where: { status: 'PENDING' },
            include: { asset: { include: { tool: true, branch: true } } },
            orderBy: { date: 'desc' },
            take: 5
        }),
        prisma.asset.findMany({
            where: {
                tool: { type: 'EQUIPMENT' },
                OR: [
                    { AND: [{ lastInventoryCheck: null }, { createdAt: { lt: ninetyDaysAgo } }] },
                    { lastInventoryCheck: { lt: ninetyDaysAgo } }
                ]
            },
            include: { tool: true, branch: true, assignedTo: true },
            orderBy: { lastInventoryCheck: 'asc' },
            take: 5
        }),
        prisma.user.findMany({
            where: {
                role: 'TECHNICIAN',
                OR: [
                    { AND: [{ lastInventoryDate: null }, { createdAt: { lt: ninetyDaysAgo } }] },
                    { lastInventoryDate: { lt: ninetyDaysAgo } }
                ]
            },
            include: { branch: true },
            orderBy: { lastInventoryDate: 'asc' },
            take: 5
        }),
        prisma.maintenance.findMany({
            where: { status: 'COMPLETED' },
            include: { asset: { include: { branch: true } } },
            orderBy: { resolvedDate: 'desc' }
        }),
        prisma.branch.findMany({
            orderBy: { name: 'asc' }
        }),
        prisma.request.findMany({
            where: { status: 'RESOLVED', cost: { gt: 0 } },
            include: { branch: true }
        })
    ]);

    // Process Spending Data
    const now = new Date();
    const branchSpending = branches.map(branch => {
        const branchMaintenances = allCompletedMaintenances.filter(m => m.asset.branchId === branch.id);
        const branchRequests = allRequests.filter(r => r.branchId === branch.id);

        const totalCost =
            branchMaintenances.reduce((sum, m) => sum + (m.cost || 0), 0) +
            branchRequests.reduce((sum, r) => sum + (r.cost || 0), 0);

        const monthlyCost =
            branchMaintenances
                .filter(m => {
                    if (!m.resolvedDate) return false;
                    const d = new Date(m.resolvedDate);
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                })
                .reduce((sum, m) => sum + (m.cost || 0), 0) +
            branchRequests
                .filter(r => {
                    if (!r.resolvedDate) return false;
                    const d = new Date(r.resolvedDate);
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                })
                .reduce((sum, r) => sum + (r.cost || 0), 0);

        return {
            id: branch.id,
            name: branch.name,
            totalCost,
            monthlyCost
        };
    });

    const totalGlobalSpending = branchSpending.reduce((sum, b) => sum + b.totalCost, 0);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Panel de Administración</h1>
                    <p className="text-muted-foreground mt-2">
                        Resumen global de pendientes y gestión de sedes.
                    </p>
                </div>
            </div>

            {/* Global Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-amber-500 shadow-sm transition-all hover:scale-[1.01]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
                        <ClipboardList className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingRequestsCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Por técnicos en todas las sedes</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500 shadow-sm transition-all hover:scale-[1.01]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Mantenimientos Activos</CardTitle>
                        <Wrench className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingMaintenancesCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Equipos fuera de operación</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 shadow-sm transition-all hover:scale-[1.01]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Controles Vencidos</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overdueAssetsCount + overdueTechsCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">{overdueTechsCount} técnicos y {overdueAssetsCount} equipos pendientes</p>
                    </CardContent>
                </Card>
            </div>

            {/* Spending by Branch Section */}
            <Card className="transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-600" /> Resumen de Gastos por Sede
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">Costos acumulados de mantenimientos y reparaciones.</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-medium text-muted-foreground">Gasto Total Global</div>
                        <div className="text-xl font-bold text-blue-600">${totalGlobalSpending.toLocaleString()}</div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sede</TableHead>
                                    <TableHead className="text-right">Este Mes</TableHead>
                                    <TableHead className="text-right">Gasto Histórico</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {branchSpending.map(bs => (
                                    <TableRow key={bs.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/dashboard/branch/${bs.id}`} className="hover:underline text-blue-600">
                                                {bs.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-amber-600">
                                            ${bs.monthlyCost.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            ${bs.totalCost.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
                                                <div
                                                    className="h-full bg-blue-500"
                                                    style={{ width: `${totalGlobalSpending > 0 ? (bs.totalCost / totalGlobalSpending) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Action Tables */}
            {(latestRequests.length > 0 || activeMaintenances.length > 0) && (
                <div className="grid gap-6 md:grid-cols-2">
                    {latestRequests.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <ClipboardList className="h-4 w-4 text-amber-500" /> Solicitudes Pendientes (Últimas 5)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-xs">Técnico/Sede</TableHead>
                                                <TableHead className="text-xs">Tipo</TableHead>
                                                <TableHead className="text-right text-xs">Acción</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {latestRequests.map(r => (
                                                <TableRow key={r.id}>
                                                    <TableCell>
                                                        <div className="text-sm font-medium">{r.user.name}</div>
                                                        <div className="text-xs text-muted-foreground">{r.branch.name}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={`text-[10px] uppercase ${r.type === 'LOCATIVE' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : ''}`}>
                                                            {r.type === 'LOCATIVE' ? 'Locativo' : r.type === 'REQUEST' ? 'Nueva' : 'Daño/Pérdida'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant="secondary" className="cursor-pointer hover:bg-muted">Ver</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeMaintenances.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Wrench className="h-4 w-4 text-red-500" /> Mantenimientos Activos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-xs">Equipo</TableHead>
                                                <TableHead className="text-xs">Sede</TableHead>
                                                <TableHead className="text-right text-xs">Costo</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {activeMaintenances.map(m => (
                                                <TableRow key={m.id}>
                                                    <TableCell>
                                                        <div className="text-sm font-medium">{m.asset.tool.name}</div>
                                                        <div className="text-xs text-muted-foreground">SN: {m.asset.serialNumber}</div>
                                                    </TableCell>
                                                    <TableCell className="text-xs">{m.asset.branch.name}</TableCell>
                                                    <TableCell className="text-right text-xs font-semibold">
                                                        ${m.cost.toLocaleString()}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Overdue Inventories Section */}
            {(overdueAssets.length > 0 || overdueTechs.length > 0) && (
                <div className="space-y-6">
                    {overdueTechs.length > 0 && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-purple-500" /> Inventarios de Técnicos Pendientes
                                </CardTitle>
                                <Link href="/dashboard/technicians">
                                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">Gestionar Técnicos</Badge>
                                </Link>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Técnico</TableHead>
                                                <TableHead>Sede</TableHead>
                                                <TableHead className="text-right">Último Control General</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {overdueTechs.map(tech => {
                                                const daysSince = tech.lastInventoryDate
                                                    ? Math.floor((Date.now() - new Date(tech.lastInventoryDate).getTime()) / (1000 * 60 * 60 * 24))
                                                    : null;
                                                return (
                                                    <TableRow key={tech.id}>
                                                        <TableCell>
                                                            <Link href={`/dashboard/technicians/${tech.id}`} className="font-medium hover:underline text-blue-600">
                                                                {tech.name}
                                                            </Link>
                                                            <div className="text-xs text-muted-foreground">{tech.email}</div>
                                                        </TableCell>
                                                        <TableCell className="text-sm">{tech.branch?.name || 'Sin sede'}</TableCell>
                                                        <TableCell className="text-right text-red-600 font-medium text-sm italic">
                                                            {daysSince ? `Hace ${daysSince} días` : 'Nunca realizado'}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {overdueAssets.length > 0 && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-purple-600" /> Equipos con Control Vencido
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Equipo</TableHead>
                                                <TableHead>Sede</TableHead>
                                                <TableHead>Asignado A</TableHead>
                                                <TableHead className="text-right">Último Control</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {overdueAssets.map(asset => {
                                                const daysSince = asset.lastInventoryCheck
                                                    ? Math.floor((Date.now() - new Date(asset.lastInventoryCheck).getTime()) / (1000 * 60 * 60 * 24))
                                                    : null;
                                                return (
                                                    <TableRow key={asset.id}>
                                                        <TableCell>
                                                            <div className="font-medium text-sm">{asset.tool.name}</div>
                                                            <div className="text-xs text-muted-foreground">Serial: {asset.serialNumber}</div>
                                                        </TableCell>
                                                        <TableCell className="text-sm">{asset.branch.name}</TableCell>
                                                        <TableCell className="text-sm">
                                                            {asset.assignedTo ? (
                                                                <span className="text-blue-600 font-medium">{asset.assignedTo.name}</span>
                                                            ) : (
                                                                <span className="text-muted-foreground italic">En Taller</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right text-red-600 font-medium text-sm italic">
                                                            {daysSince ? `Hace ${daysSince} días` : 'Nunca realizado'}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {pendingRequestsCount === 0 && pendingMaintenancesCount === 0 && overdueAssetsCount === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-dashed">
                    <ClipboardList className="h-12 w-12 text-muted-foreground opacity-20" />
                    <p className="mt-4 text-muted-foreground font-medium">No hay pendientes pendientes en ninguna sede.</p>
                    <p className="text-sm text-muted-foreground">¡Buen trabajo! Todo está bajo control.</p>
                </div>
            )}
        </div>
    );
}

async function TechnicianDashboard({ userId }: { userId: string }) {
    const now = new Date();
    const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;

    const [myAssignments, myAssets, myRequests, myLoans, branches, userInfo, warehouseAssets] = await Promise.all([
        prisma.assignment.findMany({
            where: { userId, status: 'ACTIVE', type: 'ASSIGNMENT' },
            include: { tool: true }
        }),
        prisma.asset.findMany({
            where: { assignedToId: userId, status: { not: 'LOST' } },
            include: { tool: true, branch: true }
        }),
        prisma.request.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { branch: true }
        }),
        prisma.assignment.findMany({
            where: { userId, type: 'LOAN' },
            include: { tool: true, asset: true },
            orderBy: { assignedAt: 'desc' }
        }),
        prisma.branch.findMany({ orderBy: { name: 'asc' } }),
        prisma.user.findUnique({ where: { id: userId }, select: { name: true, branchId: true } }),
        prisma.asset.findMany({
            where: { AND: [{ status: 'OPERATIONAL' }, { assignedToId: null }] },
            include: { tool: true }
        })
    ]);

    const assetsNeedingInventory = myAssets.filter(a => {
        const lastCheck = a.lastInventoryCheck ? new Date(a.lastInventoryCheck) : new Date(a.createdAt);
        return now.getTime() - lastCheck.getTime() > NINETY_DAYS;
    });

    const branchId = userInfo?.branchId ?? (myAssets[0]?.branchId ?? '');

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Mis Herramientas</h1>
                <div className="flex gap-2">
                    <CreateLoanDialog technicians={[]} assets={warehouseAssets} isAdmin={false} currentUserId={userId} />
                    {branchId && <TechnicianRequestDialog userId={userId} branchId={branchId} />}
                </div>
            </div>


            <div className="grid gap-4 md:grid-cols-3">
                <Card className="transition-all hover:scale-[1.02] hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Asignación Fija</CardTitle>
                        <Box className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{myAssignments.length}</div>
                    </CardContent>
                </Card>
                <Card className="transition-all hover:scale-[1.02] hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Préstamos Almacén</CardTitle>
                        <PackageOpen className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{myLoans.filter(l => l.status === 'ACTIVE').length}</div>
                    </CardContent>
                </Card>
                <Card className="transition-all hover:scale-[1.02] hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Mis Solicitudes</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{myRequests.length}</div>
                    </CardContent>
                </Card>
            </div>


            <Card className="transition-all hover:shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600"><PackageOpen className="h-5 w-5" /> Préstamos de Almacén</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Herramienta</TableHead>
                                    <TableHead>Fecha Préstamo</TableHead>
                                    <TableHead>Fecha Devolución</TableHead>
                                    <TableHead>Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myLoans.map(l => (
                                    <TableRow key={l.id}>
                                        <TableCell>
                                            <div className="font-medium">{l.tool.name}</div>
                                            <div className="text-xs text-muted-foreground">SN: {l.asset?.serialNumber}</div>
                                        </TableCell>
                                        <TableCell>{new Date(l.assignedAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <span className={l.expectedReturn && new Date(l.expectedReturn) < new Date() && l.status === 'ACTIVE' ? 'text-red-500 font-bold' : ''}>
                                                {l.expectedReturn ? new Date(l.expectedReturn).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={l.status === 'ACTIVE' ? 'default' : l.status === 'RETURNED' ? 'secondary' : 'outline'}>
                                                {l.status === 'ACTIVE' ? 'En Uso' : l.status === 'RETURNED' ? 'Devuelto' : 'Pendiente'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {myLoans.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-gray-500 py-6">No tienes préstamos de almacén.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Box className="h-5 w-5" /> Herramientas Fijas</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Herramienta</TableHead>
                                    <TableHead>Cantidad</TableHead>
                                    <TableHead>Fecha Asignación</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myAssignments.map(a => (
                                    <TableRow key={a.id}>
                                        <TableCell className="font-medium">{a.tool.name}</TableCell>
                                        <TableCell>{a.quantity}</TableCell>
                                        <TableCell>{new Date(a.assignedAt).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))}
                                {myAssignments.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-gray-500 py-6">No tienes herramientas asignadas.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Mis Solicitudes y Reportes</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead>Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myRequests.map(r => (
                                    <TableRow key={r.id}>
                                        <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {r.type === 'REQUEST' ? '🔧 Solicitud' : r.type === 'DAMAGE_REPORT' ? '⚠️ Daño' : r.type === 'LOCATIVE' ? '🏠 Locativo' : '❌ Pérdida'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={r.description}>{r.description}</TableCell>
                                        <TableCell>
                                            <Badge variant={r.status === 'PENDING' ? 'secondary' : r.status === 'RESOLVED' ? 'default' : 'destructive'}>
                                                {r.status === 'PENDING' ? 'Pendiente' : r.status === 'RESOLVED' ? 'Resuelto' : 'Rechazado'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {myLoans.length === 0 && myRequests.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-gray-500 py-6">No has enviado solicitudes aún.</TableCell>
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
