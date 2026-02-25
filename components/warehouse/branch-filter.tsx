'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
    branches: { id: string; name: string }[];
}

export function WarehouseBranchFilter({ branches }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentBranchId = searchParams.get('branchId') || 'all';

    const handleValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === 'all') {
            params.delete('branchId');
        } else {
            params.set('branchId', value);
        }
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Filtrar por Sede:</span>
            <Select value={currentBranchId} onValueChange={handleValueChange}>
                <SelectTrigger className="w-[200px] h-9">
                    <SelectValue placeholder="Todas las sedes" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas las sedes</SelectItem>
                    {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                            {b.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
