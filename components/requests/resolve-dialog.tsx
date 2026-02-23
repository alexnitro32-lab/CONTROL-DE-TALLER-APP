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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { resolveRequest } from '@/lib/actions/requests';
import { toast } from 'sonner';
import { Eye } from 'lucide-react';

interface Request {
    id: string;
    description: string;
    status: string;
    branchId: string;
    user: { name: string };
    cost?: number | null;
    expectedFixDate?: Date | null;
}

export function ResolveRequestDialog({ req }: { req: Request }) {
    const [open, setOpen] = useState(false);
    const [status, setStatus] = useState(req.status);
    const [cost, setCost] = useState(req.cost?.toString() || '0');
    const [expectedFixDate, setExpectedFixDate] = useState(
        req.expectedFixDate ? new Date(req.expectedFixDate).toISOString().split('T')[0] : ''
    );
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.append('id', req.id);
        formData.append('branchId', req.branchId);

        const result = await resolveRequest(formData);

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
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" /> Ver / Resolver
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Detalle de la Solicitud</DialogTitle>
                    <DialogDescription>
                        Información enviada por <strong>{req.user.name}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-4 rounded-lg bg-gray-50 p-4 border text-sm">
                        <div className="grid grid-cols-3 gap-2">
                            <span className="font-semibold text-gray-500 uppercase text-[10px]">Descripción:</span>
                            <span className="col-span-2">{req.description}</span>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">Estado</Label>
                            <Select name="status" value={status} onValueChange={setStatus}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING">Pendiente</SelectItem>
                                    <SelectItem value="APPROVED">Aprobado</SelectItem>
                                    <SelectItem value="REJECTED">Rechazado / Negado</SelectItem>
                                    <SelectItem value="RESOLVED">Resuelto / Finalizado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="expectedFixDate" className="text-right whitespace-nowrap">F. Solución</Label>
                            <Input
                                id="expectedFixDate"
                                name="expectedFixDate"
                                type="date"
                                value={expectedFixDate}
                                onChange={(e) => setExpectedFixDate(e.target.value)}
                                className="col-span-3"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cost" className="text-right">Costo ($)</Label>
                            <Input
                                id="cost"
                                name="cost"
                                type="number"
                                step="0.01"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                className="col-span-3"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cerrar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
