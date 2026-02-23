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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { returnToolAction } from '@/lib/actions/assignments';
import { toast } from 'sonner';

export function ReturnToolDialog({ assignmentId, toolName, branches }: { assignmentId: string; toolName: string; branches: { id: string; name: string }[] }) {
    const [open, setOpen] = React.useState(false);
    const [state, dispatch] = useActionState(returnToolAction, null);

    React.useEffect(() => {
        if (state?.message === 'Herramienta devuelta.') {
            setOpen(false);
            toast.success(state.message);
        } else if (state?.message) {
            toast.error(state.message);
        }
    }, [state]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Devolver</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Devolver Herramienta</DialogTitle>
                    <DialogDescription>
                        Devolver <strong>{toolName}</strong> al inventario.
                    </DialogDescription>
                </DialogHeader>
                <form action={dispatch}>
                    <input type="hidden" name="assignmentId" value={assignmentId} />
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="branchId" className="text-right">Sede</Label>
                            <Select name="branchId" required>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Seleccionar sede de retorno" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map(b => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return <Button type="submit" disabled={pending}>{pending ? 'Procesando...' : 'Confirmar Devolución'}</Button>;
}
