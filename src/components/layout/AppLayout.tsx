import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Link as LinkIcon, FileText, FileEdit, CheckSquare, Settings, LogOut, Moon, Sun, ChevronLeft, ChevronRight, Tags, Database, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export const DashboardLayout = () => {
  const { logout, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage('sidebar-collapsed', false);

  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { label: 'Links', icon: <LinkIcon size={20} />, path: '/dashboard/links' },
    { label: 'Notes', icon: <FileText size={20} />, path: '/dashboard/notes' },
    { label: 'Quick Temp', icon: <FileEdit size={20} />, path: '/dashboard/temporary-notes' },
    { label: 'Tasks', icon: <CheckSquare size={20} />, path: '/dashboard/tasks' },
    { label: 'Finance', icon: <Wallet size={20} />, path: '/dashboard/finance' },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-[rgba(15,18,28,0.65)] backdrop-blur-[24px] transition-all duration-300 ease-in-out z-10 shadow-[8px_0_40px_rgba(0,0,0,0.18)] ring-1 ring-white/[0.02] ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="p-6 flex items-center justify-between">
          {!isSidebarCollapsed && <h2 className="font-bold text-lg tracking-tight whitespace-nowrap">AJ Workspace</h2>}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-muted hover:text-text-main transition-colors ml-auto p-1 bg-border/20 hover:bg-border/50 rounded"
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              title={isSidebarCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-180 ease-out text-sm font-medium overflow-hidden ${
                  isActive 
                    ? 'bg-[var(--primary-soft)] text-primary shadow-sm ring-1 ring-[var(--primary)]/20' 
                    : 'text-muted hover:bg-white/5 hover:text-text-main'
                }`
              }
            >
              <div className="shrink-0">{item.icon}</div>
              {!isSidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 flex flex-col gap-1 relative mt-2">
          <NavLink
            to="/dashboard/categories"
            title={isSidebarCollapsed ? "Categories" : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-180 ease-out text-sm font-medium overflow-hidden ${
                isActive 
                  ? 'bg-[var(--primary-soft)] text-primary shadow-sm ring-1 ring-[var(--primary)]/20' 
                  : 'text-muted hover:bg-white/5 hover:text-text-main'
              }`
            }
          >
            <div className="shrink-0"><Tags size={20} /></div>
            {!isSidebarCollapsed && <span className="whitespace-nowrap">Categories</span>}
          </NavLink>
          
          <NavLink
            to="/dashboard/data"
            title={isSidebarCollapsed ? "Data Management" : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-180 ease-out text-sm font-medium overflow-hidden ${
                isActive 
                  ? 'bg-[var(--primary-soft)] text-primary shadow-sm ring-1 ring-[var(--primary)]/20' 
                  : 'text-muted hover:bg-white/5 hover:text-text-main'
              }`
            }
          >
            <div className="shrink-0"><Database size={20} /></div>
            {!isSidebarCollapsed && <span className="whitespace-nowrap">Data Management</span>}
          </NavLink>
          
          <NavLink
            to="/dashboard/settings"
            title={isSidebarCollapsed ? "Settings" : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-180 ease-out text-sm font-medium overflow-hidden ${
                isActive 
                  ? 'bg-[var(--primary-soft)] text-primary shadow-sm ring-1 ring-[var(--primary)]/20' 
                  : 'text-muted hover:bg-white/5 hover:text-text-main'
              }`
            }
          >
            <div className="shrink-0"><Settings size={20} /></div>
            {!isSidebarCollapsed && <span className="whitespace-nowrap">Settings</span>}
          </NavLink>
          <button 
            onClick={toggleTheme} 
            title={isSidebarCollapsed ? "Toggle Theme" : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-180 ease-out text-sm font-medium text-muted hover:bg-white/5 hover:text-text-main text-left overflow-hidden"
          >
            <div className="shrink-0">{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</div>
            {!isSidebarCollapsed && <span className="whitespace-nowrap">Theme</span>}
          </button>
          
          <div className="flex items-center justify-between px-3 py-2 mt-4">
            {!isSidebarCollapsed && <span className="text-sm font-medium truncate max-w-[120px]">{profile?.displayName || 'User'}</span>}
            <button onClick={logout} className={`text-muted hover:text-red-500 transition-colors ${isSidebarCollapsed ? 'mx-auto' : ''}`} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[rgba(10,12,18,0.7)] backdrop-blur-2xl flex justify-between px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-50 shadow-[0_-20px_40px_rgba(0,0,0,0.15)] ring-1 ring-white/5">
        {[
          { label: 'Dash', icon: <LayoutDashboard size={22} />, path: '/dashboard' },
          { label: 'Notes', icon: <FileText size={22} />, path: '/dashboard/notes' },
          { label: 'Tasks', icon: <CheckSquare size={22} />, path: '/dashboard/tasks' },
          { label: 'Finance', icon: <Wallet size={22} />, path: '/dashboard/finance' },
          { label: 'Tools', icon: <Settings size={22} />, path: '/dashboard/management' }
        ].map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1.5 py-2 px-3 rounded-2xl transition-all duration-200 ${
                isActive ? 'text-primary bg-[var(--primary-soft)]' : 'text-muted hover:text-text-main'
              }`
            }
          >
            {item.icon}
            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
