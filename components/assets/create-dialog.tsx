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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createAsset, searchTools } from '@/lib/actions/assets';
import { toast } from 'sonner';
import { Plus, Check } from 'lucide-react';



interface CreateAssetDialogProps {
    branchId?: string;
    branches?: { id: string; name: string }[];
    tools?: any[]; // Keep for compatibility if needed, though search is used now
}

export function CreateAssetDialog({ branchId, branches }: CreateAssetDialogProps) {
    const [open, setOpen] = useState(false);

    // Form State
    const [toolName, setToolName] = useState("");
    const [category, setCategory] = useState("");
    const [existingTool, setExistingTool] = useState<{ id: string; name: string; category?: string | null } | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    // Passive Check on Blur
    async function handleNameBlur() {
        if (toolName.length < 2) return;

        setIsChecking(true);
        // Clean basic search
        const results = await searchTools(toolName);

        // Find exact or very close match
        const exactMatch = results.find(t => t.name.toLowerCase() === toolName.toLowerCase());

        if (exactMatch) {
            setExistingTool(exactMatch);
            toast.info(`Equipo encontrado: ${exactMatch.name}`);
        } else {
            setExistingTool(null);
            // If we have results but not exact, maybe user wants to know? 
            // For simplicity requested by user: assume new if not exact/selected.
        }
        setIsChecking(false);
    }

    async function handleSubmit(formData: FormData) {
        // Logic
        if (existingTool) {
            formData.append('isNewTool', 'false');
            formData.append('toolId', existingTool.id);
        } else {
            // Validate New Tool
            if (!category) {
                toast.error("Para equipos nuevos, debes seleccionar una Categoría.");
                return;
            }
            formData.append('isNewTool', 'true');
            formData.append('newToolName', toolName);
            formData.append('newToolCategory', category);
        }

        const result = await createAsset(formData);

        if (result.message.includes('correctamente')) {
            toast.success(result.message);
            setOpen(false);
            // Reset
            setToolName("");
            setCategory("");
            setExistingTool(null);
        } else {
            toast.error(result.message);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Registrar Equipo
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Registrar Equipo</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-6 pt-4">
                    {branchId ? (
                        <input type="hidden" name="branchId" value={branchId} />
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="branchId">Sede / Taller</Label>
                            <Select name="branchId" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar Sede" />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches?.map(b => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="toolName">Nombre del Equipo / Herramienta</Label>
                            <Input
                                name="toolName"
                                placeholder="Ej: Taladro Percutor, Pulidora..."
                                value={toolName}
                                onChange={(e) => {
                                    setToolName(e.target.value);
                                    if (existingTool) setExistingTool(null); // Reset if changed
                                }}
                                onBlur={handleNameBlur}
                                required
                            />
                            {isChecking && <p className="text-xs text-muted-foreground animate-pulse">Verificando existencia...</p>}
                        </div>

                        {/* Logic Feedback UI */}
                        {existingTool ? (
                            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-md flex items-start gap-3">
                                <Check className="h-4 w-4 text-blue-600 mt-1" />
                                <div>
                                    <h5 className="font-medium leading-none tracking-tight mb-1">Equipo Existente</h5>
                                    <div className="text-sm [&_p]:leading-relaxed">
                                        Este equipo ya está en el catálogo ({existingTool.category || 'Sin Cat.'}).
                                        Se agregará una nueva unidad.
                                    </div>
                                </div>
                            </div>
                        ) : (
                            toolName.length > 2 && !isChecking && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                    <Label htmlFor="newToolCategory">Categoría (Equipo Nuevo)</Label>
                                    <Select name="newToolCategory" value={category} onValueChange={setCategory}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar Manual / Eléctrica" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MANUAL">Herramienta Manual</SelectItem>
                                            <SelectItem value="ELECTRIC">Herramienta Eléctrica</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Es la primera vez que registras "<strong>{toolName}</strong>". Por favor define su categoría.
                                    </p>
                                </div>
                            )
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="serialNumber">Número de Serial</Label>
                        <Input name="serialNumber" placeholder="Ej: SN-123456" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="purchaseDate">Fecha de Compra</Label>
                            <Input name="purchaseDate" type="date" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cost">Costo de Adquisición</Label>
                            <Input name="cost" type="number" step="1" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lastMaintenanceDate">Fecha de mantenimiento</Label>
                        <Input name="lastMaintenanceDate" type="date" />
                    </div>

                    <Button type="submit" className="w-full">
                        {existingTool ? 'Agregar Unidad' : 'Registrar Nuevo'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

