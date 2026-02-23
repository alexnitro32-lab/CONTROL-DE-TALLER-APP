'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOutAction } from '@/lib/actions/auth';
import { Power as PowerIcon, Menu, X, LayoutDashboard, Building2, Wrench, Users, ClipboardList, Home, Warehouse, History } from 'lucide-react';

const links = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Sedes', href: '/dashboard/sedes', icon: Building2 },
    { name: 'Equipos Taller', href: '/dashboard/assets', icon: Wrench },
    { name: 'Técnicos', href: '/dashboard/technicians', icon: Users },
    { name: 'Solicitudes', href: '/dashboard/requests', icon: ClipboardList },
    { name: 'Arreglo Locativo', href: '/dashboard/locative-repairs', icon: Home },
    { name: 'Herramienta Almacén', href: '/dashboard/warehouse', icon: Warehouse },
    { name: 'Historial Reparaciones', href: '/dashboard/maintenance-history', icon: History },
];

interface SideNavProps {
    role?: string;
}

export default function SideNav({ role }: SideNavProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const filteredLinks = links.filter(link => {
        if (role === 'ADMIN') return true;
        if (role === 'TECHNICIAN') {
            return link.name === 'Dashboard';
        }
        return false;
    });

    const NavContent = () => (
        <>
            <div className="flex flex-col space-y-1">
                {filteredLinks.map((link) => {
                    const LinkIcon = link.icon;
                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex h-[48px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-800 hover:text-white
                ${pathname === link.href ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400'}
              `}
                        >
                            <LinkIcon className="h-5 w-5 shrink-0" />
                            <p>{link.name}</p>
                        </Link>
                    );
                })}
            </div>
            <div className="mt-auto pt-4 border-t border-zinc-800">
                <form action={signOutAction}>
                    <button className="flex h-[48px] w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-red-900/20 hover:text-red-400">
                        <PowerIcon className="h-5 w-5 shrink-0" />
                        <span>Cerrar Sesión</span>
                    </button>
                </form>
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:flex h-full flex-col bg-zinc-950 text-white p-4 w-64 border-r border-zinc-800">
                <div className="mb-8 px-2">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <Wrench className="h-5 w-5 text-white" />
                        </div>
                        <span>Control Taller</span>
                    </div>
                </div>
                <div className="flex flex-col grow justify-between">
                    <NavContent />
                </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between bg-zinc-950 text-white p-4 sticky top-0 z-50 border-b border-zinc-800">
                <div className="flex items-center gap-2 font-bold text-lg">
                    <div className="bg-blue-600 p-1 rounded-lg">
                        <Wrench className="h-4 w-4 text-white" />
                    </div>
                    <span>Control Taller</span>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                >
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Drawer Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden animate-in fade-in duration-200"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Mobile Drawer */}
            <div className={`fixed inset-y-0 left-0 w-72 bg-zinc-950 text-white p-5 z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <Wrench className="h-5 w-5 text-white" />
                        </div>
                        <span>Menú</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-1 text-zinc-400">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="flex flex-col grow justify-between overflow-y-auto">
                    <NavContent />
                </div>
            </div>
        </>
    );
}
