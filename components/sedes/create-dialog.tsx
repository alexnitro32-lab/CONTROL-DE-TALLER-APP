'use client';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createBranch } from '@/lib/actions/sedes';
import { useState, useEffect } from "react";
import { toast } from "sonner";

const initialState = {
    message: '',
    errors: {},
};

export function CreateBranchDialog() {
    const [open, setOpen] = useState(false);
    const [state, dispatch] = useActionState(createBranch, initialState);

    useEffect(() => {
        if (state?.message === 'Sede creada exitosamente.') {
            setOpen(false);
            toast.success(state.message);
        } else if (state?.message) {
            toast.error(state.message);
        }
    }, [state]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Agregar Sede</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Agregar Nueva Sede</DialogTitle>
                    <DialogDescription>
                        Ingrese los detalles de la nueva sede aquí.
                    </DialogDescription>
                </DialogHeader>
                <form action={dispatch}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nombre
                            </Label>
                            <Input id="name" name="name" className="col-span-3" required />
                        </div>
                        {state?.errors?.name && <p className="text-red-500 text-sm ml-24">{state.errors.name}</p>}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-right">
                                Dirección
                            </Label>
                            <Input id="address" name="address" className="col-span-3" />
                        </div>
                        {state?.errors?.address && <p className="text-red-500 text-sm ml-24">{state.errors.address}</p>}
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

    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Guardando...' : 'Guardar Sede'}
        </Button>
    );
}
