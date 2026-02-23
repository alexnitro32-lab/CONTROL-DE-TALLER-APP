'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { updateInventoryItem, deleteInventoryItem } from '@/lib/actions/inventory';
import { toast } from 'sonner';
import { Pencil, Trash2 } from 'lucide-react';

export function EditInventoryDialog({ item }: { item: any }) {
    const [open, setOpen] = React.useState(false);
    const [formState, dispatch] = useActionState(updateInventoryItem, null);

    React.useEffect(() => {
        if (formState?.message === 'Item actualizado.') {
            setOpen(false);
            toast.success(formState.message);
        } else if (formState?.message) {
            toast.error(formState.message);
        }
    }, [formState]);

    const handleDelete = async () => {
        if (confirm('¿Está seguro de eliminar este item del inventario?')) {
            const res = await deleteInventoryItem(item.branchId, item.toolId);
            if (res.message === 'Item eliminado.') {
                setOpen(false);
                toast.success(res.message);
            } else {
                toast.error(res.message);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Inventario: {item.tool.name}</DialogTitle>
                    <DialogDescription>
                        Modifique la cantidad o el estado.
                    </DialogDescription>
                </DialogHeader>
                <form action={dispatch}>
                    <input type="hidden" name="branchId" value={item.branchId} />
                    <input type="hidden" name="toolId" value={item.toolId} />
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="quantity" className="text-right">Cantidad</Label>
                            <Input id="quantity" name="quantity" type="number" min="0" defaultValue={item.quantity} className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">Estado</Label>
                            <Select name="status" defaultValue={item.status}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OPERATIONAL">Operativo</SelectItem>
                                    <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                                    <SelectItem value="DAMAGED">Dañado</SelectItem>
                                    <SelectItem value="DECOMMISSIONED">Fuera de Servicio</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="flex justify-between sm:justify-between">
                        <Button type="button" variant="destructive" size="icon" onClick={handleDelete}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return <Button type="submit" disabled={pending}>{pending ? 'Guardando...' : 'Guardar Cambios'}</Button>;
}
