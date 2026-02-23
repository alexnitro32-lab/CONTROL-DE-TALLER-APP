'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ClipboardCheck } from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { markInventoryCheck } from '@/lib/actions/users';
import { toast } from 'sonner';

interface Props {
    assetId: string;
    branchId: string;
    assetName: string;
}

export function MarkInventoryButton({ assetId, branchId, assetName }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleConfirm() {
        setLoading(true);
        const result = await markInventoryCheck(assetId, branchId);
        if (result.type === 'success') {
            toast.success(result.message);
            setOpen(false);
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    }

    return (
        <>
            <Button size="sm" variant="outline" className="text-blue-600 border-blue-200" onClick={() => setOpen(true)}>
                <ClipboardCheck className="mr-1 h-4 w-4" /> Inventariar
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Inventario</DialogTitle>
                        <DialogDescription>
                            ¿Confirmas que realizaste el inventario físico de <strong>{assetName}</strong>?
                            Esto registrará la fecha de hoy como el último control trimestral.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button onClick={handleConfirm} disabled={loading}>
                            {loading ? 'Registrando...' : 'Confirmar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
