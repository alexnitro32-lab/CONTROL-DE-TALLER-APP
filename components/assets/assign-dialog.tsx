'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { assignAsset } from '@/lib/actions/assets';
import { toast } from 'sonner';
import { ArrowRightLeft } from 'lucide-react';

interface AssignAssetDialogProps {
    assetId: string;
    assetName: string;
    technicians: { id: string; name: string }[];
    branchId: string;
}

export function AssignAssetDialog({ assetId, assetName, technicians, branchId }: AssignAssetDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedTech, setSelectedTech] = useState('');

    async function handleAssign() {
        if (!selectedTech) return toast.error('Seleccione un técnico.');

        const result = await assignAsset(assetId, selectedTech, branchId);
        if (result.message.includes('correctamente')) {
            toast.success(result.message);
            setOpen(false);
        } else {
            toast.error(result.message);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <ArrowRightLeft className="mr-2 h-4 w-4" /> Asignar / Mover
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Asignar {assetName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Seleccionar Técnico</Label>
                        <Select onValueChange={setSelectedTech}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="SHOP">-- Devolver a Taller --</SelectItem>
                                {technicians.map(tech => (
                                    <SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleAssign} className="w-full">Confirmar Asignación</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
