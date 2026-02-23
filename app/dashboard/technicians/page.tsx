import prisma from '@/lib/prisma';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreateTechnicianDialog } from '@/components/technicians/create-technician-dialog';
import { TechnicianActions } from '@/components/technicians/technician-actions';
import { Users } from 'lucide-react';
import Link from 'next/link';

export default async function TechniciansPage() {
    const [technicians, branches] = await Promise.all([
        prisma.user.findMany({
            where: { role: 'TECHNICIAN' },
            include: {
                branch: { select: { name: true } },
                assets: { where: { status: { not: 'LOST' } }, select: { id: true } },
                _count: { select: { assignments: { where: { status: 'ACTIVE' } } } }
            },
            orderBy: { name: 'asc' }
        }),
        prisma.branch.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
    ]);

    return (
        <div className="space-y-6">
            <div className="flex w-full items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="h-6 w-6" /> Técnicos Registrados
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Gestiona los técnicos, sus credenciales y sede asignada.
                    </p>
                </div>
                <CreateTechnicianDialog branches={branches} />
            </div>

            <div className="rounded-md border bg-white overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Correo</TableHead>
                                <TableHead>Sede</TableHead>
                                <TableHead>Herramientas Asignadas</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {technicians.map((tech) => (
                                <TableRow key={tech.id} className="hover:bg-slate-50/50">
                                    <TableCell className="font-medium whitespace-nowrap">
                                        <Link
                                            href={`/dashboard/technicians/${tech.id}`}
                                            className="hover:underline text-primary font-semibold"
                                        >
                                            {tech.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{tech.email}</TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {tech.branch ? (
                                            <Badge variant="outline">{tech.branch.name}</Badge>
                                        ) : (
                                            <span className="text-[10px] text-red-500 font-bold uppercase">Sin sede</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{tech._count.assignments}</TableCell>
                                    <TableCell className="text-right">
                                        <TechnicianActions technician={tech} branches={branches} />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {technicians.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-gray-500 italic">
                                        No hay técnicos registrados. Crea el primero.
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
