'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BranchFilterProps {
    branches: { id: string; name: string }[];
}

export function BranchFilter({ branches }: BranchFilterProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const currentBranchId = searchParams.get('branchId') || 'all';

    function handleFilterChange(id: string) {
        const params = new URLSearchParams(searchParams);
        if (id === 'all') {
            params.delete('branchId');
        } else {
            params.set('branchId', id);
        }
        replace(`${pathname}?${params.toString()}`);
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filtrar por Sede:</span>
            <Select value={currentBranchId} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-[200px] bg-white">
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
