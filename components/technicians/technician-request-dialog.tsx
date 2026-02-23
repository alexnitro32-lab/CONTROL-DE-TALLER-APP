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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createRequest } from '@/lib/actions/requests';
import { toast } from 'sonner';
import { PlusCircle } from 'lucide-react';

interface Props {
    userId: string;
    branchId: string;
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Enviando...' : 'Enviar'}
        </Button>
    );
}

export function TechnicianRequestDialog({ userId, branchId }: Props) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState('REQUEST');

    async function handleAction(_prevState: unknown, formData: FormData) {
        formData.set('userId', userId);
        formData.set('branchId', branchId);
        formData.set('type', type);
        const result = await createRequest(_prevState, formData);
        if (result?.success) {
            toast.success(result.message || 'Solicitud enviada correctamente.');
            setOpen(false);
        } else if (result?.message) {
            toast.error(result.message);
        }
        return result;
    }

    const [state, formAction] = useActionState(handleAction, null);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="default">
                    <PlusCircle className="mr-2 h-4 w-4" /> Nueva Solicitud / Reporte
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Crear Solicitud o Reporte</DialogTitle>
                    <DialogDescription>
                        Solicita herramientas o reporta un daño o pérdida. El administrador será notificado.
                    </DialogDescription>
                </DialogHeader>
                <form action={formAction} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Tipo de solicitud</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="REQUEST">🔧 Solicitud de Herramienta</SelectItem>
                                <SelectItem value="DAMAGE_REPORT">⚠️ Reporte de Daño de Equipo</SelectItem>
                                <SelectItem value="LOSS_REPORT">❌ Reporte de Pérdida</SelectItem>
                                <SelectItem value="LOCATIVE">🏠 Arreglo Locativo (Sede)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder={
                                type === 'REQUEST'
                                    ? 'Ej: Necesito un taladro percutor para obra nueva...'
                                    : type === 'DAMAGE_REPORT'
                                        ? 'Ej: La amoladora SN-001 tiene el disco roto...'
                                        : type === 'LOSS_REPORT'
                                            ? 'Ej: El martillo con serial SN-123 no aparece en inventario...'
                                            : 'Ej: Gotera en el techo del taller o pintura de fachada...'
                            }
                            rows={4}
                            required
                        />
                        {state?.errors?.description && (
                            <p className="text-xs text-red-500">{state.errors.description}</p>
                        )}
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
