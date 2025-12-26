import React from 'react';
import { LayoutDashboard, FileText, Upload, Settings, Menu, LogOut, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { useUpload } from '../context/UploadContext';

const Layout = ({ children }) => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const { user, logout } = useUpload();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: FileText, label: 'Risk Report', path: '/analysis' },
        { icon: Settings, label: 'Cheat Sheet', path: '/cheatsheet' },
        { icon: Users, label: 'Community Vault', path: '/community' },
        { icon: Upload, label: 'File Manager', path: '/uploads' },
    ];

    return (
        <div className="min-h-screen bg-background text-white flex overflow-hidden">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex flex-col w-64 glass-panel m-4 rounded-2xl p-4">
                <div className="flex items-center gap-3 px-4 py-4 mb-8">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <span className="font-bold text-lg">S</span>
                    </div>
                    <h1 className="font-bold text-xl tracking-tight">Semester<span className="text-primary">Survival</span></h1>
                </div>

                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                                location.pathname === item.path
                                    ? "bg-primary/20 text-primary border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                                    : "hover:bg-white/5 text-slate-400 hover:text-white"
                            )}
                        >
                            <item.icon size={20} className={cn(
                                "transition-transform duration-300 group-hover:scale-110",
                                location.pathname === item.path ? "text-primary" : "text-slate-400 group-hover:text-white"
                            )} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="mt-auto p-4 glass-card rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border-2 border-primary/30 flex items-center justify-center">
                            <span className="text-sm font-bold">{user?.email?.[0]?.toUpperCase() || 'S'}</span>
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold truncate w-32">{user?.email?.split('@')[0] || 'Student'}</p>
                            <p className="text-xs text-slate-400 truncate w-32">{user?.email || 'Account'}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut size={16} /> Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative z-10 p-4 md:p-6 lg:p-8">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between mb-6 glass-panel p-4 rounded-xl sticky top-0 z-50">
                    <div className="font-bold text-lg flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs">S</div>
                        SemesterSurvival
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-xl p-6 pt-24 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex flex-col space-y-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-4 px-6 py-4 rounded-xl text-lg font-medium transition-all",
                                        location.pathname === item.path
                                            ? "bg-primary/20 text-primary border border-primary/20"
                                            : "bg-surface/50 text-slate-400"
                                    )}
                                >
                                    <item.icon size={24} />
                                    {item.label}
                                </Link>
                            ))}

                            <hr className="border-white/10 my-4" />

                            <button
                                onClick={logout}
                                className="flex items-center gap-4 px-6 py-4 rounded-xl text-lg font-medium bg-red-500/10 text-red-400 w-full"
                            >
                                <LogOut size={24} /> Log Out
                            </button>
                        </div>
                    </div>
                )}

                {children}
            </main>
        </div>
    );
};

export default Layout;
