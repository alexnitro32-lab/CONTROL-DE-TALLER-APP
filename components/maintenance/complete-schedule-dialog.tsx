
'use client';

import { useState } from 'react';
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
import { completeScheduledMaintenance } from '@/lib/actions/maintenance-schedule';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

interface CompleteScheduleProps {
    asset: any;
    branchId: string;
}

export function CompleteScheduledMaintenanceDialog({ asset, branchId }: CompleteScheduleProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        const cost = parseFloat(formData.get('cost') as string);
        const nextDateStr = formData.get('nextDate') as string;

        if (!nextDateStr) {
            toast.error("Debes seleccionar la próxima fecha de mantenimiento.");
            setLoading(false);
            return;
        }

        const nextDate = new Date(nextDateStr);
        // Adjust timezone if needed, simple fix
        const nextDateObj = new Date(nextDateStr + 'T12:00:00');

        const result = await completeScheduledMaintenance(asset.id, nextDateObj, cost, branchId);

        if (result.type === 'success') {
            toast.success(result.message);
            setOpen(false);
        } else {
            toast.error(result.message || 'Error desconocido');
        }
        setLoading(false);
    }

    // Default next date suggestion: current target + frequency (if exists) or + 180 days
    const today = new Date();
    const freq = asset.tool.maintenanceFreq || 180;
    const suggestedDate = new Date(today.getTime() + freq * 24 * 60 * 60 * 1000);
    const suggestedDateStr = suggestedDate.toISOString().split('T')[0];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Completar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Mantenimiento Preventivo</DialogTitle>
                    <DialogDescription>
                        Confirma que se realizó el mantenimiento a <strong>{asset.tool.name}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="cost">Costo del Mantenimiento ($)</Label>
                        <Input id="cost" name="cost" type="number" step="1" min="0" defaultValue="0" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nextDate">Fecha del Próximo Mantenimiento</Label>
                        <Input
                            id="nextDate"
                            name="nextDate"
                            type="date"
                            defaultValue={suggestedDateStr}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Sugerida: hoy + {freq} días.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Registrando...' : 'Confirmar y Guardar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
