
import prisma from '@/lib/prisma';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreateAssetDialog } from '@/components/assets/create-dialog';
import { UpdateAssetMaintenanceDate } from '@/components/assets/update-date';
import { AssetActions } from '@/components/assets/asset-actions';

export default async function AssetsPage() {
    const assets = await prisma.asset.findMany({
        include: {
            tool: true,
            branch: true,
            assignedTo: true
        },
        orderBy: { branch: { name: 'asc' } }
    });

    const branches = await prisma.branch.findMany({ select: { id: true, name: true } });

    return (
        <div className="space-y-6">
            <div className="flex w-full items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Equipos de Taller Global</h1>
                    <p className="text-muted-foreground">Vista general de todos los activos en todas las sedes.</p>
                </div>
                <CreateAssetDialog branches={branches} />
            </div>

            <div className="rounded-md border bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Equipo</TableHead>
                                <TableHead>Serial</TableHead>
                                <TableHead>Sede</TableHead>
                                <TableHead>Mantenimiento</TableHead>
                                <TableHead>Días Restantes</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assets.map((asset) => {
                                const lastMaintenance = asset.lastMaintenanceDate
                                    ? new Date(asset.lastMaintenanceDate)
                                    : null;
                                const diffDays = lastMaintenance
                                    ? Math.ceil((lastMaintenance.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                                    : null;

                                let colorClass = "text-green-600 font-medium";
                                if (diffDays !== null) {
                                    if (diffDays <= 15) colorClass = "text-red-600 font-bold";
                                    else if (diffDays <= 30) colorClass = "text-yellow-600 font-bold";
                                }

                                return (
                                    <TableRow key={asset.id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span className="whitespace-nowrap">{asset.tool.name}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">{asset.tool.type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm font-mono whitespace-nowrap">{asset.serialNumber}</TableCell>
                                        <TableCell className="whitespace-nowrap">{asset.branch.name}</TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <UpdateAssetMaintenanceDate assetId={asset.id} date={asset.lastMaintenanceDate} />
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-sm">
                                            {diffDays !== null ? (
                                                <span className={colorClass}>
                                                    {diffDays < 0 ? `${Math.abs(diffDays)} días vencido` : `${diffDays} días`}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-xs italic">Pendiente Programar</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={asset.status === 'OPERATIONAL' ? 'default' : 'destructive'} className={asset.status === 'OPERATIONAL' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
                                                {asset.status === 'OPERATIONAL' ? 'Operativo' : asset.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <AssetActions asset={asset} branches={branches} />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {assets.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-32 text-muted-foreground italic">
                                        No hay equipos registrados en el sistema global.
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
