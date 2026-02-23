'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', {
            ...Object.fromEntries(formData),
            redirectTo: '/dashboard',
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Credenciales inválidas.';
                default:
                    return 'Algo salió mal en el login.';
            }
        }

        // NextAuth v5 throws a redirect error on success, we must re-throw it
        if ((error as any).digest?.includes('NEXT_REDIRECT') || (error as any).message?.includes('NEXT_REDIRECT')) {
            throw error;
        }

        return 'Error de conexión o datos inválidos.';
    }
}

export async function signOutAction() {
    await signOut({ redirectTo: '/login' });
}
