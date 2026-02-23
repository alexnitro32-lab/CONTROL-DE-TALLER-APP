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
import { createLocativeRepair } from '@/lib/actions/locative';
import { toast } from 'sonner';
import { PlusCircle, Home } from 'lucide-react';

interface Props {
    userId: string;
    branches: { id: string; name: string }[];
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Reportando...' : 'Reportar Arreglo'}
        </Button>
    );
}

export function CreateLocativeRepairDialog({ userId, branches }: Props) {
    const [open, setOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<string>('');

    async function handleAction(prevState: any, formData: FormData) {
        formData.set('userId', userId);
        if (selectedBranch) formData.set('branchId', selectedBranch);

        const result = await createLocativeRepair(prevState, formData);
        if (result?.success) {
            toast.success(result.message);
            setOpen(false);
            setSelectedBranch('');
        } else if (result?.message) {
            toast.error(result.message);
        }
        return result;
    }

    const [state, formAction] = useActionState(handleAction, null);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                    <PlusCircle className="mr-2 h-4 w-4" /> Nuevo Arreglo Locativo
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Home className="h-5 w-5 text-emerald-600" />
                        Reportar Arreglo o Adecuación
                    </DialogTitle>
                    <DialogDescription>
                        Registra daños en la infraestructura o solicitudes de adecuación para una sede.
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Sede</Label>
                        <Select value={selectedBranch} onValueChange={setSelectedBranch} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una sede" />
                            </SelectTrigger>
                            <SelectContent>
                                {branches.map((b) => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción del Arreglo / Necesidad</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Ej: Gotera en el techo del taller, pintura de fachada, cambio de luminarias..."
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
                            <Input id="expectedFixDate" name="expectedFixDate" type="date" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cost">Presupuesto / Costo Est.</Label>
                            <Input id="cost" name="cost" type="number" placeholder="0" step="0.01" />
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
