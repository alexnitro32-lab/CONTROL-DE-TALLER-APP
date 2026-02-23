
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateAssetMaintenanceDate } from '@/lib/actions/asset-update';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UpdateDateProps {
    assetId: string;
    date?: Date | null;
}

export function UpdateAssetMaintenanceDate({ assetId, date }: UpdateDateProps) {
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        if (!date) return '';
        try {
            return new Date(date).toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    });
    const [open, setOpen] = useState(false);

    async function handleUpdate() {
        if (!selectedDate) return;

        const newDate = new Date(selectedDate);
        // Adjust for timezone offset if needed, or take as UTC
        // Simple fix: append T12:00:00 to avoid timezone shifts on date-only strings
        const dateObj = new Date(selectedDate + 'T12:00:00');

        const result = await updateAssetMaintenanceDate(assetId, dateObj);

        if (result.type === 'success') {
            toast.success(result.message);
            setOpen(false);
        } else {
            toast.error(result.message);
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    size="sm"
                    className={cn(
                        "w-[140px] pl-3 text-left font-normal h-8",
                        !selectedDate && "text-muted-foreground"
                    )}
                >
                    {selectedDate ? (
                        new Date(selectedDate + 'T12:00:00').toLocaleDateString()
                    ) : (
                        <span>Sin Fecha</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Seleccionar Fecha</Label>
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleUpdate} className="w-full">
                        Actualizar Fecha
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
