import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, UserCheck, BookOpen, FileQuestion, Users,
  BarChart3, Library, FileText, User, LogOut, Menu, X, ChevronRight
} from 'lucide-react';

export const TrainerLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/trainer', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Trainer Profile', path: '/trainer/profile', icon: <UserCheck className="w-4 h-4" /> },
    { label: 'Courses', path: '/trainer/courses', icon: <BookOpen className="w-4 h-4" /> },
    { label: 'Questionnaires', path: '/trainer/questionnaires', icon: <FileQuestion className="w-4 h-4" /> },
    { label: 'Trainees', path: '/trainer/trainees', icon: <Users className="w-4 h-4" /> },
    { label: 'Performance', path: '/trainer/performance', icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Trainer Library', path: '/trainer/library', icon: <Library className="w-4 h-4" /> },
    { label: 'Resources', path: '/trainer/resources', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className="font-extrabold text-sm tracking-tight text-gray-900">
            CAPACITY <span className="text-emerald-600">CONNECT</span>
          </span>
        </div>
        <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
          TRAINER
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 p-5 flex flex-col justify-between transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          <Link to="/" className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-gray-950 block leading-tight">
                CAPACITY <span className="text-emerald-600">CONNECT</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                Trainer Portal
              </span>
            </div>
          </Link>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      : 'text-gray-600 hover:text-gray-950 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
              {user?.full_name?.charAt(0) || 'T'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-gray-900 truncate">{user?.full_name}</div>
              <div className="text-[10px] text-gray-400 truncate font-mono">{user?.email}</div>
            </div>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Outlet */}
      <main className="flex-1 p-4 sm:p-8 md:p-10 max-w-7xl mx-auto w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};
