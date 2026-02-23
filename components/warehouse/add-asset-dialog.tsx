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
import { registerWarehouseAsset } from '@/lib/actions/loans';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface Props {
    branches: { id: string; name: string }[];
    tools: { id: string; name: string }[];
}

export function AddWarehouseAssetDialog({ branches, tools }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        const res = await registerWarehouseAsset(formData);
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
                <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Equipo en Almacén
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nuevo Equipo para Almacén</DialogTitle>
                    <DialogDescription>
                        Registra una nueva herramienta física que estará disponible para préstamos en el taller.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Sede de Origen / Custodia</Label>
                        <Select name="branchId" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar sede" />
                            </SelectTrigger>
                            <SelectContent>
                                {branches.map((b) => (
                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="toolName">Nombre de la Herramienta</Label>
                        <Input
                            id="toolName"
                            name="toolName"
                            list="tools-list"
                            placeholder="Ej: Scanner Bosch, Gato Hidráulico..."
                            required
                        />
                        <datalist id="tools-list">
                            {tools.map((t) => (
                                <option key={t.id} value={t.name} />
                            ))}
                        </datalist>
                        <p className="text-[10px] text-muted-foreground">Si el nombre no existe, se creará uno nuevo en el catálogo.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="serialNumber">Número de Serial (Único)</Label>
                            <Input id="serialNumber" name="serialNumber" placeholder="SN-12345" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cost">Costo de Adquisición</Label>
                            <Input id="cost" name="cost" type="number" step="0.01" placeholder="0.00" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="purchaseDate">Fecha de Compra</Label>
                        <Input id="purchaseDate" name="purchaseDate" type="date" />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Registrando...' : 'Registrar en Almacén'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
