'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { deleteLocativeRepair } from '@/lib/actions/locative';
import { toast } from 'sonner';

interface Props {
    id: string;
}

export function DeleteLocativeRepairButton({ id }: Props) {
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        if (!confirm('¿Estás seguro de que deseas eliminar este reporte?')) {
            return;
        }

        setLoading(true);
        const result = await deleteLocativeRepair(id);
        setLoading(false);
        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            disabled={loading}
            onClick={handleDelete}
            className="text-zinc-400 hover:text-red-600"
            title="Eliminar Reporte"
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    );
}
