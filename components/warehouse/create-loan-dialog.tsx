'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createLoan } from '@/lib/actions/loans';
import { toast } from 'sonner';
import { PackageOpen } from 'lucide-react';

interface Props {
    technicians: { id: string; name: string }[];
    assets: { id: string; serialNumber: string; tool: { name: string } }[];
    isAdmin?: boolean;
    currentUserId?: string;
}

export function CreateLoanDialog({ technicians, assets, isAdmin = true, currentUserId }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        formData.append('isAdmin', isAdmin.toString());
        if (!isAdmin && currentUserId) {
            formData.append('userId', currentUserId);
        }

        const res = await createLoan(formData);
        setLoading(false);
        if (res.success) {
            toast.success(res.message);
            setOpen(false);
        } else {
            toast.error(res.message);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={isAdmin ? "default" : "outline"} size={isAdmin ? "default" : "sm"}>
                    <PackageOpen className="mr-2 h-4 w-4" />
                    {isAdmin ? 'Registrar Préstamo' : 'Solicitar Herramienta Almacén'}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isAdmin ? 'Nuevo Préstamo de Almacén' : 'Solicitar de Almacén'}</DialogTitle>
                    <DialogDescription>
                        {isAdmin ? 'Asigna una herramienta del taller a un técnico temporalmente.' : 'Solicita una herramienta disponible en el almacén del taller.'}
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4 py-4">
                    {isAdmin && (
                        <div className="space-y-2">
                            <Label>Técnico Responsable</Label>
                            <Select name="userId" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar técnico" />
                                </SelectTrigger>
                                <SelectContent>
                                    {technicians.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Herramienta Disponible</Label>
                        <Select name="assetId" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Buscar herramienta..." />
                            </SelectTrigger>
                            <SelectContent>
                                {assets.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>
                                        {a.tool.name} - {a.serialNumber}
                                    </SelectItem>
                                ))}
                                {assets.length === 0 && (
                                    <p className="p-2 text-xs text-muted-foreground text-center">No hay herramientas disponibles en almacén.</p>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="expectedReturn">Fecha Devolución</Label>
                            <Input id="expectedReturn" name="expectedReturn" type="date" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notas / Destino</Label>
                            <Input id="notes" name="notes" placeholder="Opcional..." />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Procesando...' : isAdmin ? 'Registrar' : 'Enviar Solicitud'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
