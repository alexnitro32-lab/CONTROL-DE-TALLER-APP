'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateTechnician, deleteTechnician } from '@/lib/actions/users';
import { toast } from 'sonner';

interface Props {
    technician: { id: string; name: string; email: string; branchId: string | null };
    branches: { id: string; name: string }[];
}

export function TechnicianActions({ technician, branches }: Props) {
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleUpdate(formData: FormData) {
        setLoading(true);
        formData.append('id', technician.id);
        const result = await updateTechnician(formData);
        if (result.type === 'success') {
            toast.success(result.message);
            setEditOpen(false);
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    }

    async function handleDelete() {
        setLoading(true);
        const result = await deleteTechnician(technician.id);
        if (result.type === 'success') {
            toast.success(result.message);
            setDeleteOpen(false);
        } else {
            toast.error(result.message);
        }
        setLoading(false);
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
                        <DialogTitle>Editar Técnico</DialogTitle>
                        <DialogDescription>Modifica los datos del técnico. La contraseña solo se actualizará si ingresas una nueva.</DialogDescription>
                    </DialogHeader>
                    <form action={handleUpdate} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nombre</Label>
                            <Input name="name" defaultValue={technician.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Correo</Label>
                            <Input name="email" type="email" defaultValue={technician.email} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Nueva Contraseña (opcional)</Label>
                            <Input name="password" type="password" placeholder="Dejar en blanco para no cambiar" />
                        </div>
                        <div className="space-y-2">
                            <Label>Sede</Label>
                            <Select name="branchId" defaultValue={technician.branchId ?? ''}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar sede" /></SelectTrigger>
                                <SelectContent>
                                    {branches.map(b => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Guardar Cambios'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar técnico?</DialogTitle>
                        <DialogDescription>
                            Se eliminará a <strong>{technician.name}</strong> y perderá acceso a la plataforma. Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                            {loading ? 'Eliminando...' : 'Confirmar Eliminación'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
