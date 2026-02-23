'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
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
import { assignTool } from '@/lib/actions/assignments';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

type User = {
    id: string;
    name: string;
    email: string;
};

export function AssignToolDialog({ item, technicians }: { item: any, technicians: User[] }) {
    const [open, setOpen] = React.useState(false);
    const [formState, dispatch] = useActionState(assignTool, null);

    React.useEffect(() => {
        if (formState?.message === 'Herramienta asignada.') {
            setOpen(false);
            toast.success(formState.message);
        } else if (formState?.message) {
            toast.error(formState.message);
        }
    }, [formState]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" title="Asignar a Técnico">
                    <UserPlus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Asignar Herramienta: {item.tool.name}</DialogTitle>
                    <DialogDescription>
                        Seleccione el técnico y la cantidad a asignar.
                    </DialogDescription>
                </DialogHeader>
                <form action={dispatch}>
                    <input type="hidden" name="toolId" value={item.toolId} />
                    <input type="hidden" name="branchId" value={item.branchId} />

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="userId" className="text-right">Técnico</Label>
                            <Select name="userId" required>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Seleccione un técnico" />
                                </SelectTrigger>
                                <SelectContent>
                                    {technicians.map((tech) => (
                                        <SelectItem key={tech.id} value={tech.id}>
                                            {tech.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="quantity" className="text-right">Cantidad</Label>
                            <Input
                                id="quantity"
                                name="quantity"
                                type="number"
                                min="1"
                                max={item.quantity}
                                defaultValue="1"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-500 text-right">Disponible: {item.quantity}</p>
                    </div>
                    <DialogFooter>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return <Button type="submit" disabled={pending}>{pending ? 'Asignando...' : 'Asignar'}</Button>;
}
