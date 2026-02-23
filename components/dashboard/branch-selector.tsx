import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, ArrowRight } from 'lucide-react';
import { Branch } from '@prisma/client';

interface BranchSelectorProps {
    branches: (Branch & { _count: { users: number; assets: number } })[];
}

export function BranchSelector({ branches }: BranchSelectorProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch) => (
                <Link key={branch.id} href={`/dashboard/branch/${branch.id}`} className="block group">
                    <Card className="h-full transition-all hover:border-primary hover:shadow-md group-hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-bold text-primary max-w-[80%] truncate" title={branch.name}>
                                {branch.name}
                            </CardTitle>
                            <Building2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 mt-2">
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>{branch._count.users} Técnicos</span>
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <span className="font-semibold mr-1">{branch._count.assets}</span> Equipos Activos
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                Gestionar Sede <ArrowRight className="ml-1 h-4 w-4" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
             <Link href="/dashboard/branches/new" className="block group">
                <Card className="h-full flex flex-col items-center justify-center border-dashed border-2 hover:border-primary hover:bg-muted/50 transition-all cursor-pointer min-h-[180px]">
                    <div className="rounded-full bg-primary/10 p-3 mb-2 group-hover:bg-primary/20 transition-colors">
                        <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-medium text-muted-foreground group-hover:text-primary transition-colors">
                        Crear Nueva Sede
                    </span>
                </Card>
            </Link>
        </div>
    );
}
