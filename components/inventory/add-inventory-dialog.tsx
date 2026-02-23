'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Need tabs? Yes.
import { addInventory, createTool } from '@/lib/actions/inventory';
import { toast } from 'sonner';

// Define Tool type locally or import
type Tool = {
    id: string;
    name: string;
    type: string;
};

export function AddInventoryDialog({ branchId, tools }: { branchId: string; tools: Tool[] }) {
    const [open, setOpen] = React.useState(false);
    const [mode, setMode] = React.useState<'select' | 'create'>('select');

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Agregar Item
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Agregar al Inventario</DialogTitle>
                    <DialogDescription>
                        {mode === 'select'
                            ? 'Seleccione una herramienta existente o cree una nueva.'
                            : 'Ingrese los detalles de la nueva herramienta.'}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={mode} onValueChange={(v: string) => setMode(v as 'select' | 'create')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="select">Seleccionar Existente</TabsTrigger>
                        <TabsTrigger value="create">Crear Nueva</TabsTrigger>
                    </TabsList>

                    <TabsContent value="select">
                        <SelectToolForm branchId={branchId} tools={tools} onSuccess={() => setOpen(false)} />
                    </TabsContent>

                    <TabsContent value="create">
                        <CreateToolForm branchId={branchId} onSuccess={() => setOpen(false)} />
                    </TabsContent>
                </Tabs>

            </DialogContent>
        </Dialog>
    );
}

function SelectToolForm({ branchId, tools, onSuccess }: { branchId: string; tools: Tool[]; onSuccess: () => void }) {
    const [open, setOpen] = React.useState(false);
    const [value, setValue] = React.useState('');
    const [formState, dispatch] = useActionState(addInventory, null);

    React.useEffect(() => {
        if (formState?.message === 'Inventario actualizado.') {
            toast.success(formState.message);
            onSuccess();
        } else if (formState?.message) {
            toast.error(formState.message);
        }
    }, [formState, onSuccess]);

    return (
        <form action={dispatch} className="space-y-4 pt-4">
            <input type="hidden" name="branchId" value={branchId} />

            <div className="flex flex-col space-y-2">
                <Label>Herramienta</Label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                        >
                            {value
                                ? tools.find((tool) => tool.id === value)?.name
                                : "Buscar herramienta..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                        <Command>
                            <CommandInput placeholder="Buscar tool..." />
                            <CommandList>
                                <CommandEmpty>No encontrada.</CommandEmpty>
                                <CommandGroup>
                                    {tools.map((tool) => (
                                        <CommandItem
                                            key={tool.id}
                                            value={tool.name}
                                            onSelect={(currentValue: string) => {
                                                setValue(tool.id === value ? "" : tool.id);
                                                setOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value === tool.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {tool.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                <input type="hidden" name="toolId" value={value} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                    <Label htmlFor="quantity">Cantidad</Label>
                    <Input id="quantity" name="quantity" type="number" min="1" defaultValue="1" required />
                </div>
                <div className="flex flex-col space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select name="status" defaultValue="OPERATIONAL">
                        <SelectTrigger>
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="OPERATIONAL">Operativo</SelectItem>
                            <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                            <SelectItem value="DAMAGED">Dañado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <DialogFooter>
                <SubmitInventoryButton />
            </DialogFooter>
        </form>
    );
}

function CreateToolForm({ branchId, onSuccess }: { branchId: string; onSuccess: () => void }) {
    // This form creates a tool AND optionally adds it to inventory immediately?
    // For now, let's just create the tool in catalog.
    // User can then select it.
    // Or better: Create and Add.
    // Let's implement simple tool creation first.

    const [formState, dispatch] = useActionState(createTool, null);

    React.useEffect(() => {
        if (formState?.message === 'Herramienta creada.') {
            toast.success(formState.message);
            // Ideally we auto-select it, but for now just close or switch tab?
            // onSuccess(); // Close dialog
            // But we want to add inventory too.
            // Let's just create it in catalog for now.
            onSuccess();
        } else if (formState?.message) {
            toast.error(formState.message);
        }
    }, [formState, onSuccess]);

    return (
        <form action={dispatch} className="space-y-4 pt-4">
            <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Nombre</Label>
                    <Input id="name" name="name" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">Tipo</Label>
                    <Select name="type" defaultValue="TOOL">
                        <SelectTrigger className="col-span-3">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="TOOL">Herramienta</SelectItem>
                            <SelectItem value="EQUIPMENT">Equipo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="serialNumber" className="text-right">Serial</Label>
                    <Input id="serialNumber" name="serialNumber" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="maintenanceFreq" className="text-right">Frec. Mant. (días)</Label>
                    <Input id="maintenanceFreq" name="maintenanceFreq" type="number" className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
                <SubmitToolButton />
            </DialogFooter>
        </form>
    )
}

function SubmitInventoryButton() {
    const { pending } = useFormStatus();
    return <Button type="submit" disabled={pending}>{pending ? 'Agregando...' : 'Agregar al Inventario'}</Button>;
}

function SubmitToolButton() {
    const { pending } = useFormStatus();
    return <Button type="submit" disabled={pending}>{pending ? 'Creando...' : 'Crear Herramienta'}</Button>;
}
