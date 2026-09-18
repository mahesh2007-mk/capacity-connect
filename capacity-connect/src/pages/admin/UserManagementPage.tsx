import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { User, UserRole, UserStatus } from '@/types';
import { useToast } from '@/context/ToastContext';
import {
  Users, UserCheck, Shield, CheckCircle2, XCircle,
  AlertTriangle, Filter, Search, UserX, UserPlus
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminUsers(
        roleFilter !== 'all' ? roleFilter : undefined,
        statusFilter !== 'all' ? statusFilter : undefined
      );
      setUsers(res || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (userId: number, newStatus: string, role?: string) => {
    try {
      await api.updateUserStatus(userId, { status: newStatus, role });
      showToast(`User status updated to ${newStatus}`, 'success');
      await loadUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user', 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200 uppercase tracking-wider">
            Identity & Access Governance
          </span>
          <h1 className="text-2xl font-black text-gray-950 mt-1">User Management & Approvals</h1>
          <p className="text-xs text-gray-500">
            Approve pending faculty trainer registrations, manage roles, and activate/deactivate accounts.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-subtle flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Roles</option>
            <option value="trainee">Trainees</option>
            <option value="trainer">Trainers</option>
            <option value="admin">Administrators</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending Approval</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-gray-500">Loading user records...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-xs text-gray-500">
          No users found matching your filters.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Registered Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{u.full_name}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                          u.role === 'admin'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : u.role === 'trainer'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-brand-50 text-brand-800 border-brand-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          u.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 animate-pulse'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(u.id, 'active')}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(u.id, 'deactivated')}
                              className="px-3 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[11px] transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {u.status === 'active' && u.role !== 'admin' && (
                          <button
                            onClick={() => handleUpdateStatus(u.id, 'deactivated')}
                            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-rose-50 text-gray-700 hover:text-rose-700 font-medium text-[11px] transition-colors"
                          >
                            Deactivate
                          </button>
                        )}

                        {u.status === 'deactivated' && (
                          <button
                            onClick={() => handleUpdateStatus(u.id, 'active')}
                            className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] transition-colors"
                          >
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
