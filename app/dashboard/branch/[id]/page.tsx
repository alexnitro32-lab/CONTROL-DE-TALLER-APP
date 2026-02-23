import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Wrench, Users, Package, Activity, Home } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ResolveMaintenanceDialog } from '@/components/maintenance/resolve-dialog';
import { CompleteScheduledMaintenanceDialog } from '@/components/maintenance/complete-schedule-dialog';
import { ResolveLocativeRepairDialog } from '@/components/locative/resolve-dialog';

import { CostHistoryDialog } from '@/components/dashboard/cost-history-dialog';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function BranchDashboardPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return <div>Acceso denegado</div>;

    const branch = await prisma.branch.findUnique({
        where: { id: params.id },
        include: {
            _count: {
                select: { users: true, assets: true, inventory: true }
            }
        }
    });

    if (!branch) notFound();

    // Fetch Branch Specific Data
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const [assets, activeRequests, resolvedRequests, pendingMaintenance, completedMaintenance, branchTechs] = await Promise.all([
        prisma.asset.findMany({
            where: { branchId: branch.id },
            include: { tool: true, assignedTo: true }
        }),
        prisma.request.findMany({
            where: { branchId: branch.id, status: 'PENDING' },
            include: { user: true }
        }),
        prisma.request.findMany({
            where: { branchId: branch.id, status: 'RESOLVED' }
        }),
        prisma.maintenance.findMany({
            where: {
                asset: { branchId: branch.id },
                status: 'PENDING'
            },
            include: { asset: { include: { tool: true } } },
            orderBy: { date: 'asc' }
        }),
        prisma.maintenance.findMany({
            where: {
                asset: { branchId: branch.id },
                status: 'COMPLETED'
            },
            orderBy: { resolvedDate: 'desc' }
        }),
        prisma.user.findMany({
            where: {
                branchId: branch.id,
                role: 'TECHNICIAN'
            },
            include: { branch: true }
        })
    ]);

    const overdueTechs = branchTechs.filter((t) => {
        if (!t.lastInventoryDate) return true;
        return new Date(t.lastInventoryDate) < ninetyDaysAgo;
    });

    // --- Data Processing for Cost History ---
    // 1. Current Month Cost
    const now = new Date();
    const currentMonthName = new Intl.DateTimeFormat('es-CO', { month: 'long' }).format(now);

    const maintenanceCost = completedMaintenance
        .filter(m => {
            if (!m.resolvedDate) return false;
            const d = new Date(m.resolvedDate);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((sum, m) => sum + (m.cost || 0), 0);

    const requestsCost = resolvedRequests
        .filter(r => {
            if (!r.resolvedDate) return false;
            const d = new Date(r.resolvedDate);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((sum, r) => sum + (r.cost || 0), 0);

    const currentMonthCost = maintenanceCost + requestsCost;

    // 2. Monthly History (Last 12 months)
    const monthlyDataMap = new Map<string, number>();
    const monthFormatter = new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' });

    completedMaintenance.forEach(m => {
        if (!m.resolvedDate) return;
        const date = new Date(m.resolvedDate);
        const key = monthFormatter.format(date);
        const current = monthlyDataMap.get(key) || 0;
        monthlyDataMap.set(key, current + (m.cost || 0));
    });

    resolvedRequests.forEach(r => {
        if (!r.resolvedDate) return;
        const date = new Date(r.resolvedDate);
        const key = monthFormatter.format(date);
        const current = monthlyDataMap.get(key) || 0;
        monthlyDataMap.set(key, current + (r.cost || 0));
    });

    // Convert map to array and sort (simple assumption: input sorted by desc date usually groups well, but we'll simpler list)
    // To ensure chronological order, we can iterate backwards from today
    const monthlyData = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = monthFormatter.format(d);
        if (monthlyDataMap.has(key)) {
            monthlyData.push({
                month: key,
                year: d.getFullYear(),
                monthIndex: d.getMonth(),
                amount: monthlyDataMap.get(key) || 0
            });
        }
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{branch.name}</h1>
                <p className="text-muted-foreground">Gestión de inventario y personal de la sede.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Equipos (Activos)</CardTitle>
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{branch._count.assets}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Técnicos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{branch._count.users}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Solicitudes</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeRequests.length}</div>
                    </CardContent>
                </Card>
                <CostHistoryDialog monthlyData={monthlyData} totalLast30Days={currentMonthCost} title={`Gasto ${currentMonthName}`} />
            </div>

            {/* Overdue Personal Inventory Section */}
            {overdueTechs.length > 0 && (
                <div className="space-y-4 pt-2">
                    <h2 className="text-xl font-semibold text-purple-600 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Técnicos con Control Vencido ({overdueTechs.length})
                    </h2>
                    <Card className="border-purple-100 bg-purple-50/10">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Técnico</TableHead>
                                            <TableHead className="text-right">Último Control</TableHead>
                                            <TableHead className="text-right">Estado</TableHead>
                                            <TableHead className="text-right">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {overdueTechs.map((tech) => {
                                            const daysSince = tech.lastInventoryDate
                                                ? Math.floor((Date.now() - new Date(tech.lastInventoryDate).getTime()) / (1000 * 3600 * 24))
                                                : null;
                                            return (
                                                <TableRow key={tech.id} className="hover:bg-purple-50/20">
                                                    <TableCell className="font-medium">
                                                        <Link href={`/dashboard/technicians/${tech.id}`} className="hover:underline text-blue-600 block font-semibold">
                                                            {tech.name}
                                                        </Link>
                                                        <div className="text-[10px] text-muted-foreground uppercase">{tech.email}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm">
                                                        {tech.lastInventoryDate ? new Date(tech.lastInventoryDate).toLocaleDateString() : 'Sin Control Previo'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant="destructive" className="font-bold">
                                                            {daysSince ? `${Math.max(0, daysSince - 90)} días vencido` : 'Acción Requerida'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Link href={`/dashboard/technicians/${tech.id}`}>
                                                            <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">Gestionar</Button>
                                                        </Link>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}


            {/* Pending Maintenance Section */}
            {
                pendingMaintenance.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-red-600 flex items-center gap-2">
                            <Wrench className="h-5 w-5" />
                            Novedades Pendientes ({pendingMaintenance.length})
                        </h2>
                        <Card className="border-red-100 bg-red-50/10">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fecha Reporte</TableHead>
                                                <TableHead>Equipo</TableHead>
                                                <TableHead>Fallo Reportado</TableHead>
                                                <TableHead>Días Transcurridos</TableHead>
                                                <TableHead>Fecha Est. Solución</TableHead>
                                                <TableHead className="text-right">Acción</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingMaintenance.map((m) => {
                                                const daysElapsed = Math.floor((new Date().getTime() - new Date(m.date).getTime()) / (1000 * 3600 * 24));
                                                return (
                                                    <TableRow key={m.id}>
                                                        <TableCell className="text-sm whitespace-nowrap">{m.date.toLocaleDateString()}</TableCell>
                                                        <TableCell className="font-medium">
                                                            <div className="flex flex-col">
                                                                <span className="whitespace-nowrap">{m.asset.tool.name}</span>
                                                                <span className="text-xs text-muted-foreground">{m.asset.serialNumber}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="max-w-[200px] truncate" title={m.description}>{m.description}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={daysElapsed > 7 ? "destructive" : "secondary"}>
                                                                {daysElapsed} días
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-sm whitespace-nowrap">{m.expectedFixDate ? m.expectedFixDate.toLocaleDateString() : 'No def.'}</TableCell>
                                                        <TableCell className="text-right">
                                                            <ResolveMaintenanceDialog maintenance={m} />
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }

            {/* Upcoming Scheduled Maintenance Section */}
            {
                (() => {
                    // Filter assets that are operational but due for maintenance soon (e.g., <= 30 days)
                    const upcomingMaintenance = assets.filter(a => {
                        if (!a.lastMaintenanceDate || a.status !== 'OPERATIONAL') return false;
                        const targetDate = new Date(a.lastMaintenanceDate);
                        const today = new Date();
                        const diffTime = targetDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays <= 30; // Show if due within 30 days or overdue
                    }).sort((a, b) => new Date(a.lastMaintenanceDate!).getTime() - new Date(b.lastMaintenanceDate!).getTime());

                    if (upcomingMaintenance.length === 0) return null;

                    return (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-yellow-600 flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Mantenimientos Próximos ({upcomingMaintenance.length})
                            </h2>
                            <Card className="border-yellow-100 bg-yellow-50/10">
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Fecha Programada</TableHead>
                                                    <TableHead>Equipo</TableHead>
                                                    <TableHead>Serial</TableHead>
                                                    <TableHead>Días Restantes</TableHead>
                                                    <TableHead className="text-right">Acción</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {upcomingMaintenance.map((asset) => {
                                                    const targetDate = new Date(asset.lastMaintenanceDate!);
                                                    const diffTime = targetDate.getTime() - new Date().getTime();
                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                    let colorClass = "text-yellow-600 font-bold";
                                                    if (diffDays <= 15) colorClass = "text-red-600 font-bold";

                                                    return (
                                                        <TableRow key={asset.id}>
                                                            <TableCell className="text-sm whitespace-nowrap">{targetDate.toLocaleDateString()}</TableCell>
                                                            <TableCell className="font-medium whitespace-nowrap">{asset.tool.name}</TableCell>
                                                            <TableCell className="text-muted-foreground font-mono text-xs">{asset.serialNumber}</TableCell>
                                                            <TableCell>
                                                                <span className={colorClass}>
                                                                    {diffDays < 0 ? `${Math.abs(diffDays)} días vencido` : `${diffDays} días`}
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <CompleteScheduledMaintenanceDialog asset={asset} branchId={branch.id} />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    );
                })()
            }

            {/* Pending Locative Repairs Section */}
            {activeRequests.filter(r => r.type === 'LOCATIVE').length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-emerald-600 flex items-center gap-2">
                        <Home className="h-5 w-5" />
                        Arreglos Locativos Pendientes ({activeRequests.filter(r => r.type === 'LOCATIVE').length})
                    </h2>
                    <Card className="border-emerald-100 bg-emerald-50/10">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha Reporte</TableHead>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead>Presupuesto</TableHead>
                                            <TableHead>Fecha Ejecución</TableHead>
                                            <TableHead className="text-right">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activeRequests.filter(r => r.type === 'LOCATIVE').map((r) => (
                                            <TableRow key={r.id}>
                                                <TableCell className="text-sm shadow-none">{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell className="max-w-[200px] truncate text-sm" title={r.description}>{r.description}</TableCell>
                                                <TableCell className="font-medium text-emerald-600 whitespace-nowrap">${(r.cost || 0).toLocaleString()}</TableCell>
                                                <TableCell className="text-sm">{r.expectedFixDate ? new Date(r.expectedFixDate).toLocaleDateString() : 'Por definir'}</TableCell>
                                                <TableCell className="text-right">
                                                    <ResolveLocativeRepairDialog repair={r as any} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
