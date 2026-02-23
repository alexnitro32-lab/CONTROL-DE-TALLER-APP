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
import { CalendarDays } from 'lucide-react';
import { updateTechnicianInventoryDate } from '@/lib/actions/users';
import { toast } from 'sonner';

export function UpdateInventoryDateDialog({
    userId,
    currentDate
}: {
    userId: string;
    currentDate: Date | null
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(currentDate ? new Date(currentDate).toISOString().split('T')[0] : '');

    async function handleSubmit() {
        if (!date) {
            toast.error('Selecciona una fecha');
            return;
        }
        setLoading(true);
        const result = await updateTechnicianInventoryDate(userId, date);
        if (result.type === 'success') {
            toast.success(result.message);
            setOpen(false);
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {currentDate ? 'Actualizar Inventario' : 'Registrar Inventario'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Fecha de Inventario</DialogTitle>
                    <DialogDescription>
                        Ingresa la fecha en la que se realizó el último control físico de herramientas a este técnico.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="date">Fecha del último control</Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
