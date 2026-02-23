import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AssignToolDialog, AssignmentRowActions } from '@/components/technicians/assign-tool-dialog';
import { Package } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wrench } from 'lucide-react';
import { UpdateInventoryDateDialog } from '@/components/technicians/update-inventory-date-dialog';

export default async function TechnicianDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return <div>Acceso denegado</div>;

    const [tech, allTools] = await Promise.all([
        prisma.user.findUnique({
            where: { id },
            include: {
                branch: { select: { id: true, name: true } },
                assignments: {
                    where: { status: 'ACTIVE' },
                    include: { tool: { select: { id: true, name: true } } },
                    orderBy: { assignedAt: 'desc' }
                },
                requests: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: { branch: true }
                },
                assets: {
                    where: { status: { not: 'LOST' } },
                    include: { tool: true }
                }
            }
        }),
        prisma.tool.findMany({ orderBy: { name: 'asc' } }),
    ]);

    if (!tech) notFound();

    // Inventory Maintenance Logic (90 days)
    const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
    const lastCheck = (tech as any).lastInventoryDate ? new Date((tech as any).lastInventoryDate) : null;
    const nextCheck = lastCheck ? new Date(lastCheck.getTime() + NINETY_DAYS_MS) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let daysRemaining = null;
    let status = 'PENDING'; // PENDING, OK, OVERDUE, WARNING
    let statusLabel = 'Sin Registro';

    if (nextCheck) {
        const diffMs = nextCheck.getTime() - today.getTime();
        daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) {
            status = 'OVERDUE';
            statusLabel = 'VENCIDO';
        } else if (daysRemaining <= 15) {
            status = 'WARNING';
            statusLabel = 'PRÓXIMO';
        } else {
            status = 'OK';
            statusLabel = 'AL DÍA';
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/technicians">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">{tech.name}</h1>
                        <p className="text-muted-foreground text-sm">{tech.email} · Sede: {tech.branch?.name ?? 'Sin sede'}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <UpdateInventoryDateDialog userId={tech.id} currentDate={(tech as any).lastInventoryDate} />
                    <AssignToolDialog
                        technicianId={tech.id}
                        branchName={tech.branch?.name ?? 'Sin sede'}
                        allTools={allTools}
                    />
                </div>
            </div>

            {/* Inventory Status Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={`border-l-4 ${status === 'OK' ? 'border-l-green-500' : status === 'WARNING' ? 'border-l-amber-500' : status === 'OVERDUE' ? 'border-l-red-500' : 'border-l-gray-400'}`}>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Estado de Inventario</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">{statusLabel}</span>
                            <Badge variant={status === 'OK' ? 'default' : status === 'WARNING' ? 'secondary' : 'destructive'} className={status === 'OK' ? 'bg-green-600' : ''}>
                                {status === 'OK' ? 'Correcto' : status === 'WARNING' ? 'Atención' : status === 'OVERDUE' ? 'Urgente' : 'Pendiente'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Días para Próximo Control</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <span className={`text-2xl font-bold ${daysRemaining !== null && daysRemaining < 0 ? 'text-red-600' : ''}`}>
                                {daysRemaining !== null ? (daysRemaining < 0 ? Math.abs(daysRemaining) : daysRemaining) : '--'}
                            </span>
                            <span className="text-muted-foreground">
                                {daysRemaining === null ? 'Pendiente asignar fecha' : daysRemaining < 0 ? 'días de retraso' : 'días restantes'}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Próxima Fecha Programada</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {nextCheck ? nextCheck.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) : 'No programada'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Herramientas con Serial (Equipos de Taller asignados) */}
            {(tech.assets as any[]).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wrench className="h-5 w-5" /> Herramientas con Serial
                            <Badge variant="secondary" className="ml-auto">{(tech.assets as any[]).length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Herramienta</TableHead>
                                    <TableHead>Serial</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Próx. Mantenimiento</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(tech.assets as any[]).map(asset => (
                                    <TableRow key={asset.id}>
                                        <TableCell className="font-medium">{asset.tool.name}</TableCell>
                                        <TableCell>{asset.serialNumber}</TableCell>
                                        <TableCell>
                                            <Badge variant={asset.status === 'OPERATIONAL' ? 'outline' : 'destructive'}>
                                                {asset.status === 'OPERATIONAL' ? 'Operativo' : asset.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {asset.lastMaintenanceDate
                                                ? new Date(asset.lastMaintenanceDate).toLocaleDateString()
                                                : 'No programado'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Herramientas Asignadas (Consumibles/Sin Serial) */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" /> Herramientas Asignadas
                        <Badge variant="secondary" className="ml-auto">{tech.assignments.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Herramienta</TableHead>
                                <TableHead>Cantidad</TableHead>
                                <TableHead>Fecha Asignación</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tech.assignments.map(a => (
                                <TableRow key={a.id}>
                                    <TableCell className="font-medium">{a.tool.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{a.quantity}</Badge>
                                    </TableCell>
                                    <TableCell>{new Date(a.assignedAt).toLocaleDateString('es-CO')}</TableCell>
                                    <TableCell className="text-right">
                                        <AssignmentRowActions
                                            assignmentId={a.id}
                                            toolName={a.tool.name}
                                            technicianId={tech.id}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {tech.assignments.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                        Sin herramientas asignadas. Usa el botón &quot;Asignar Herramienta&quot; para agregar.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Solicitudes y Reportes */}
            <Card>
                <CardHeader>
                    <CardTitle>Solicitudes y Reportes Recientes</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
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
                            {tech.requests.map(r => (
                                <TableRow key={r.id}>
                                    <TableCell>{new Date(r.createdAt).toLocaleDateString('es-CO')}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {r.type === 'REQUEST' ? 'Solicitud' :
                                                r.type === 'DAMAGE_REPORT' ? 'Daño' :
                                                    r.type === 'LOSS_REPORT' ? 'Pérdida' : r.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate" title={r.description}>{r.description}</TableCell>
                                    <TableCell>
                                        <Badge variant={r.status === 'PENDING' ? 'secondary' : r.status === 'RESOLVED' ? 'default' : 'destructive'}>
                                            {r.status === 'PENDING' ? 'Pendiente' : r.status === 'RESOLVED' ? 'Resuelto' : 'Rechazado'}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {tech.requests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-6 text-gray-500">Sin solicitudes registradas.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
