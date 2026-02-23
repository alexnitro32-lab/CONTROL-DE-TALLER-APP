'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createTechnician } from '@/lib/actions/users';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

export function CreateTechnicianDialog({ branchId }: { branchId: string }) {
    const [open, setOpen] = useState(false);

    async function handleSubmit(formData: FormData) {
        const result = await createTechnician(formData);
        if (result.message.includes('correctamente')) {
            toast.success(result.message);
            setOpen(false);
        } else {
            toast.error(result.message);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" /> Crear Técnico
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Nuevo Técnico</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <input type="hidden" name="branchId" value={branchId} />

                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input name="name" required placeholder="Ej: Juan Perez" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Usuario (Email)</Label>
                        <Input name="email" type="email" required placeholder="juan@taller.com" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input name="password" type="password" required />
                    </div>

                    <Button type="submit" className="w-full">Crear Usuario</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
