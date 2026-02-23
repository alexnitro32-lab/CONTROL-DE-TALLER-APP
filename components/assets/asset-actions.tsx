
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { deleteAsset, updateAsset } from '@/lib/actions/asset-management';
import { toast } from 'sonner';

interface AssetActionsProps {
    asset: any;
    branches: { id: string; name: string }[];
}

export function AssetActions({ asset, branches }: AssetActionsProps) {
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    async function handleUpdate(formData: FormData) {
        formData.append('assetId', asset.id);
        const result = await updateAsset(formData);
        if (result.type === 'success') {
            toast.success(result.message);
            setEditOpen(false);
        } else {
            toast.error(result.message);
        }
    }

    async function handleDelete() {
        const result = await deleteAsset(asset.id);
        if (result.type === 'success') {
            toast.success(result.message);
            setDeleteOpen(false);
        } else {
            toast.error(result.message);
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-red-600 focus:text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Equipo: {asset.tool.name}</DialogTitle>
                        <DialogDescription>
                            Modifique los detalles del equipo. Click en guardar cuando termine.
                        </DialogDescription>
                    </DialogHeader>
                    <form action={handleUpdate} className="space-y-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="serialNumber" className="text-right">Serial</Label>
                            <Input id="serialNumber" name="serialNumber" defaultValue={asset.serialNumber} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="branch" className="text-right">Sede</Label>
                            <div className="col-span-3">
                                <Select name="branchId" defaultValue={asset.branchId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione una sede" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map(b => (
                                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">Estado</Label>
                            <div className="col-span-3">
                                <Select name="status" defaultValue={asset.status}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="OPERATIONAL">Operativo</SelectItem>
                                        <SelectItem value="MAINTENANCE">En Mantenimiento</SelectItem>
                                        <SelectItem value="DAMAGED">Dañado</SelectItem>
                                        <SelectItem value="LOST">Perdido</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Guardar Cambios</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Está seguro de eliminar este equipo?</DialogTitle>
                        <DialogDescription>
                            Esta acción no se puede deshacer. Se eliminará el equipo <strong>{asset.tool.name}</strong> (Serial: {asset.serialNumber}) y todo su historial de mantenimiento.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete}>Confirmar Eliminación</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
