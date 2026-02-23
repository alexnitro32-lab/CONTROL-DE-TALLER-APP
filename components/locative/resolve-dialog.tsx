'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { resolveLocativeRepair } from '@/lib/actions/locative';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

interface Props {
    repair: {
        id: string;
        description: string;
        cost: number | null;
    };
}

export function ResolveLocativeRepairDialog({ repair }: Props) {
    const [open, setOpen] = useState(false);
    const [cost, setCost] = useState<number>(repair.cost || 0);
    const [resolvedDate, setResolvedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    async function handleResolve() {
        setLoading(true);
        const result = await resolveLocativeRepair(repair.id, cost, resolvedDate);
        setLoading(false);

        if (result.success) {
            toast.success(result.message);
            setOpen(false);
        } else {
            toast.error(result.message);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Resolver
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Finalizar Arreglo Locativo</DialogTitle>
                    <DialogDescription>
                        Ingresa el costo final y la fecha de resolución para cerrar el reporte:
                        <br />
                        <strong className="text-zinc-900 mt-2 block">{repair.description}</strong>
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="resolvedDate">Fecha de Resolución</Label>
                        <Input
                            id="resolvedDate"
                            type="date"
                            value={resolvedDate}
                            onChange={(e) => setResolvedDate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="finalCost">Costo Total Ejecutado ($)</Label>
                        <Input
                            id="finalCost"
                            type="number"
                            value={cost}
                            onChange={(e) => setCost(parseFloat(e.target.value))}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button
                        disabled={loading}
                        onClick={handleResolve}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        {loading ? 'Procesando...' : 'Confirmar Resolución'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
