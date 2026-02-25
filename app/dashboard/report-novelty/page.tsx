
import prisma from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportNoveltyDialog } from '@/components/maintenance/report-dialog';
import { Wrench } from 'lucide-react';
import { BranchFilter } from '@/components/dashboard/branch-filter';

export default async function ReportNoveltyPage({ searchParams }: { searchParams: Promise<{ branchId?: string }> }) {
    const { branchId } = await searchParams;

    const [assets, branches] = await Promise.all([
        prisma.asset.findMany({
            include: { tool: true, branch: true },
            where: {
                assignedToId: { not: null },
                status: { not: 'MAINTENANCE' },
                ...(branchId ? { branchId } : {})
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.branch.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Reportar Novedad</h1>
                    <p className="text-muted-foreground">Selecciona un equipo del taller para reportar una falla o novedad.</p>
                </div>
                <BranchFilter branches={branches} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5" /> Equipos y Herramientas del Taller
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Equipo</TableHead>
                                <TableHead>Serial</TableHead>
                                <TableHead>Sede</TableHead>
                                <TableHead className="text-right">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assets.map(asset => (
                                <TableRow key={asset.id}>
                                    <TableCell className="font-medium">{asset.tool.name}</TableCell>
                                    <TableCell className="font-mono text-sm">{asset.serialNumber}</TableCell>
                                    <TableCell>{asset.branch.name}</TableCell>
                                    <TableCell className="text-right">
                                        <ReportNoveltyDialog asset={asset} />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {assets.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No hay equipos registrados en el taller.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
