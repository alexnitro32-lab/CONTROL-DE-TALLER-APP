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
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createRequest } from '@/lib/actions/requests';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

export function CreateRequestDialog({ branchId, userId }: { branchId: string; userId: string }) {
    const [open, setOpen] = React.useState(false);
    const [formState, dispatch] = useActionState(createRequest, null);

    React.useEffect(() => {
        if (formState?.message === 'Solicitud creada exitosamente.') {
            setOpen(false);
            toast.success(formState.message);
        } else if (formState?.message) {
            toast.error(formState.message);
        }
    }, [formState]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    Reportar Novedad
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nueva Solicitud / Reporte</DialogTitle>
                    <DialogDescription>
                        Describa el problema o solicitud.
                    </DialogDescription>
                </DialogHeader>
                <form action={dispatch}>
                    <input type="hidden" name="branchId" value={branchId} />
                    <input type="hidden" name="userId" value={userId} />

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">Tipo</Label>
                            <Select name="type" required defaultValue="REQUEST">
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="REQUEST">Solicitud General</SelectItem>
                                    <SelectItem value="DAMAGE_REPORT">Reporte de Daño</SelectItem>
                                    <SelectItem value="LOSS_REPORT">Reporte de Pérdida</SelectItem>
                                    <SelectItem value="MAINTENANCE_REPORT">Mantenimiento</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">Detalle</Label>
                            <Textarea
                                id="description"
                                name="description"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="evidenceUrl" className="text-right">Link (Foto/Doc)</Label>
                            <Input id="evidenceUrl" name="evidenceUrl" className="col-span-3" placeholder="http://..." />
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
    return <Button type="submit" disabled={pending}>{pending ? 'Enviando...' : 'Enviar Solicitud'}</Button>;
}
