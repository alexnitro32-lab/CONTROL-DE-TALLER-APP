'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { assignSimpleTool, removeSimpleAssignment } from '@/lib/actions/assignments';
import { toast } from 'sonner';
import { Plus, MoreHorizontal, Trash2 } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SimpleTool { id: string; name: string; }

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: "Asignar Herramienta" Dialog
// ─────────────────────────────────────────────────────────────────────────────
export function AssignToolDialog({ technicianId, branchName, allTools }: {
    technicianId: string;
    branchName: string;
    allTools: SimpleTool[];
}) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<'existing' | 'new'>('existing');
    const [selectedToolId, setSelectedToolId] = useState('');
    const [newToolName, setNewToolName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);

    function reset() {
        setMode('existing');
        setSelectedToolId('');
        setNewToolName('');
        setQuantity(1);
    }

    async function handleSubmit() {
        if (mode === 'existing' && !selectedToolId) {
            toast.error('Selecciona una herramienta.');
            return;
        }
        if (mode === 'new' && !newToolName.trim()) {
            toast.error('Ingresa el nombre de la herramienta.');
            return;
        }
        setLoading(true);
        const result = await assignSimpleTool(
            technicianId,
            mode === 'existing' ? selectedToolId : null,
            mode === 'new' ? newToolName.trim() : null,
            quantity
        );
        if (result.type === 'success') {
            toast.success(result.message);
            reset();
            setOpen(false);
        } else {
            toast.error(result.message);
        }
        setLoading(false);
    }

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Asignar Herramienta
            </Button>

            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Asignar Herramienta al Técnico</DialogTitle>
                        <DialogDescription>
                            Sede: <strong>{branchName}</strong>. Selecciona o crea la herramienta a asignar.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Mode toggle */}
                        <div className="flex gap-2">
                            <Button
                                variant={mode === 'existing' ? 'default' : 'outline'}
                                size="sm"
                                className="flex-1"
                                onClick={() => setMode('existing')}
                                type="button"
                            >
                                Herramienta existente
                            </Button>
                            <Button
                                variant={mode === 'new' ? 'default' : 'outline'}
                                size="sm"
                                className="flex-1"
                                onClick={() => setMode('new')}
                                type="button"
                            >
                                + Nueva herramienta
                            </Button>
                        </div>

                        {mode === 'existing' ? (
                            <div className="space-y-2">
                                <Label>Herramienta</Label>
                                <Select value={selectedToolId} onValueChange={setSelectedToolId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona una herramienta..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allTools.length === 0 ? (
                                            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                                                No hay herramientas registradas.
                                            </div>
                                        ) : (
                                            allTools.map(t => (
                                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="new-tool-name">Nombre de la herramienta</Label>
                                <Input
                                    id="new-tool-name"
                                    placeholder="Ej: Juego de llaves, Martillo, Destornilladores..."
                                    value={newToolName}
                                    onChange={e => setNewToolName(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Si ya existe una herramienta con ese nombre, se reutilizará automáticamente.
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="qty">Cantidad</Label>
                            <Input
                                id="qty"
                                type="number"
                                min={1}
                                value={quantity}
                                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Asignando...' : 'Asignar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Row actions for simple tool assignments
// ─────────────────────────────────────────────────────────────────────────────
export function AssignmentRowActions({ assignmentId, toolName, technicianId }: {
    assignmentId: string;
    toolName: string;
    technicianId: string;
}) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleRemove() {
        setLoading(true);
        const result = await removeSimpleAssignment(assignmentId, technicianId);
        if (result.type === 'success') { toast.success(result.message); setConfirmOpen(false); }
        else toast.error(result.message);
        setLoading(false);
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => setConfirmOpen(true)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" /> Quitar herramienta
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Quitar herramienta?</DialogTitle>
                        <DialogDescription>
                            Se quitará <strong>{toolName}</strong> de este técnico.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleRemove} disabled={loading}>
                            {loading ? 'Quitando...' : 'Confirmar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
