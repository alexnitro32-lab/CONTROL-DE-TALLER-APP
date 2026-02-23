import SideNav from '@/components/ui/sidenav';
import { auth } from '@/auth';

export default async function Layout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    const userRole = session?.user?.role || 'TECHNICIAN';

    return (
        <div className="flex h-screen flex-col md:flex-row md:overflow-hidden bg-gray-50">
            <div className="flex-none md:w-64">
                <SideNav role={userRole} />
            </div>
            <div className="flex-grow p-4 md:p-8 lg:p-12 md:overflow-y-auto">
                <main className="max-w-7xl mx-auto h-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
