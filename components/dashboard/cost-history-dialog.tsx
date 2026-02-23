
'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface MonthlyCost {
    month: string; // "Agosto 2025"
    year: number;
    monthIndex: number; // 0-11
    amount: number;
}

interface CostHistoryDialogProps {
    monthlyData: MonthlyCost[];
    totalLast30Days: number;
    title?: string;
}

export function CostHistoryDialog({ monthlyData, totalLast30Days, title }: CostHistoryDialogProps) {
    // Format currency helper
    const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Card className="cursor-pointer hover:bg-slate-50 transition-colors border-blue-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{title || "Gasto Mantenimiento (30d)"}</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700">{fmt(totalLast30Days)}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" /> Ver historial mensual
                        </p>
                    </CardContent>
                </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Historial de Gastos de Mantenimiento</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mes</TableHead>
                                <TableHead className="text-right">Total Gastado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {monthlyData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                                        No hay registros de gastos.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                monthlyData.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium capitalize">{item.month}</TableCell>
                                        <TableCell className="text-right">{fmt(item.amount)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
