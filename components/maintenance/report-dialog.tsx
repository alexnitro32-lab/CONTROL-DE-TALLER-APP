
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createMaintenanceReport } from '@/lib/actions/maintenance';
import { toast } from 'sonner';

interface ReportNoveltyDialogProps {
    asset: any;
}

export function ReportNoveltyDialog({ asset }: ReportNoveltyDialogProps) {
    const [open, setOpen] = useState(false);

    async function handleSubmit(formData: FormData) {
        formData.append('assetId', asset.id);
        const result = await createMaintenanceReport(formData);

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
                <Button variant="destructive" size="sm">Reportar Novedad</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reportar Novedad - {asset.tool.name}</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Descripción del Fallo</Label>
                        <Textarea name="description" placeholder="Describa el problema..." required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Fecha Reporte</Label>
                            <Input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Fecha Estimada Arreglo</Label>
                            <Input name="expectedFixDate" type="date" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Costo Aproximado</Label>
                        <Input name="cost" type="number" step="1" placeholder="0" />
                    </div>

                    <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">Guardar Reporte</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
