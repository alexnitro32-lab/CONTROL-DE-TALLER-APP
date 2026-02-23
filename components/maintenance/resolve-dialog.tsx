
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { resolveMaintenance } from '@/lib/actions/maintenance-resolution';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';

interface ResolveMaintenanceDialogProps {
    maintenance: any;
}

export function ResolveMaintenanceDialog({ maintenance }: ResolveMaintenanceDialogProps) {
    const [open, setOpen] = useState(false);

    async function handleSubmit(formData: FormData) {
        formData.append('maintenanceId', maintenance.id);
        const result = await resolveMaintenance(formData);

        if (result.type === 'success') {
            toast.success(result.message);
            setOpen(false);
        } else {
            toast.error(result.message);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="mr-2 h-4 w-4" /> Gestionar / Finalizar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Finalizar Mantenimiento</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-sm text-muted-foreground">
                    <p className="mb-2"><strong>Equipo:</strong> {maintenance.asset.tool.name}</p>
                    <p className="mb-4"><strong>Fallo Reportado:</strong> {maintenance.description}</p>
                    <hr className="my-4" />
                    <p>Complete los datos para cerrar este reporte y devolver el equipo a operación.</p>
                </div>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Fecha de Gestión / Solución</Label>
                        <Input name="resolvedDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                    </div>
                    <div className="space-y-2">
                        <Label>Costo Final del Arreglo ({new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(maintenance.cost)} est.)</Label>
                        <Input name="finalCost" type="number" step="1" defaultValue={Math.round(maintenance.cost)} required />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Confirmar Solución</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
