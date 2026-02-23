'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateLocativeRepair } from '@/lib/actions/locative';
import { toast } from 'sonner';
import { Edit2 } from 'lucide-react';

interface Props {
    userId: string;
    branches: { id: string; name: string }[];
    repair: {
        id: string;
        branchId: string;
        description: string;
        cost: number | null;
        expectedFixDate: Date | null;
    };
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Actualizando...' : 'Guardar Cambios'}
        </Button>
    );
}

export function EditLocativeRepairDialog({ userId, branches, repair }: Props) {
    const [open, setOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<string>(repair.branchId);

    async function handleAction(prevState: any, formData: FormData) {
        formData.set('userId', userId);
        if (selectedBranch) formData.set('branchId', selectedBranch);

        const result = await updateLocativeRepair(repair.id, prevState, formData);
        if (result?.success) {
            toast.success(result.message);
            setOpen(false);
        } else if (result?.message) {
            toast.error(result.message);
        }
        return result;
    }

    const [state, formAction] = useActionState(handleAction, null);

    const defaultDate = repair.expectedFixDate
        ? new Date(repair.expectedFixDate).toISOString().split('T')[0]
        : '';

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-900">
                    <Edit2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Arreglo Locativo</DialogTitle>
                    <DialogDescription>
                        Corrige los detalles del reporte o ajusta el presupuesto.
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Sede</Label>
                        <Select value={selectedBranch} onValueChange={setSelectedBranch} required>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {branches.map((b) => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            name="description"
                            defaultValue={repair.description}
                            rows={3}
                            required
                        />
                        {state?.errors?.description && (
                            <p className="text-xs text-red-500">{state.errors.description}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="expectedFixDate">Fecha Programada</Label>
                            <Input id="expectedFixDate" name="expectedFixDate" type="date" defaultValue={defaultDate} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cost">Costo Est. ($)</Label>
                            <Input id="cost" name="cost" type="number" defaultValue={repair.cost || 0} step="0.01" />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
