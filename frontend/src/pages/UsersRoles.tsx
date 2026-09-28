import React, { useState } from 'react';
import { 
  Users, Shield, UserPlus, Edit2, Trash2, CheckCircle2, XCircle, Search, 
  Filter, MoreVertical, ShieldCheck, Lock, UserCheck, UserX, KeyRound, 
  X, Check, AlertCircle, ArrowUpRight
} from 'lucide-react';

interface UserItem {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  roleColor: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
  clearance: string;
  clearanceColor: string;
  avatarBg: string;
}

const initialUsers: UserItem[] = [
  { 
    id: 1, 
    username: 'admin', 
    name: 'System Administrator', 
    email: 'admin@ibvap.gov', 
    role: 'Administrator', 
    roleColor: 'bg-red-500/10 text-red-400 border-red-500/30',
    status: 'Active', 
    lastLogin: '10 mins ago',
    clearance: 'Level 5',
    clearanceColor: 'bg-red-500/20 text-red-400 border-red-500/40',
    avatarBg: 'bg-red-600'
  },
  { 
    id: 2, 
    username: 'commander01', 
    name: 'John Doe', 
    email: 'j.doe@ibvap.gov', 
    role: 'Commander', 
    roleColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    status: 'Active', 
    lastLogin: '1 hour ago',
    clearance: 'Level 4',
    clearanceColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    avatarBg: 'bg-blue-600'
  },
  { 
    id: 3, 
    username: 'operator01', 
    name: 'Jane Smith', 
    email: 'j.smith@ibvap.gov', 
    role: 'Operator', 
    roleColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    status: 'Active', 
    lastLogin: '3 hours ago',
    clearance: 'Level 3',
    clearanceColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    avatarBg: 'bg-emerald-600'
  },
  { 
    id: 4, 
    username: 'analyst01', 
    name: 'Bob Wilson', 
    email: 'b.wilson@ibvap.gov', 
    role: 'Analyst', 
    roleColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    status: 'Inactive', 
    lastLogin: '2 days ago',
    clearance: 'Level 2',
    clearanceColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    avatarBg: 'bg-purple-600'
  },
  { 
    id: 5, 
    username: 'auditor01', 
    name: 'Alice Brown', 
    email: 'a.brown@ibvap.gov', 
    role: 'Auditor', 
    roleColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    status: 'Active', 
    lastLogin: '5 mins ago',
    clearance: 'Level 4',
    clearanceColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    avatarBg: 'bg-amber-600'
  },
  { 
    id: 6, 
    username: 'viewer01', 
    name: 'Robert Davis', 
    email: 'r.davis@ibvap.gov', 
    role: 'Viewer', 
    roleColor: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    status: 'Active', 
    lastLogin: '1 hour ago',
    clearance: 'Level 1',
    clearanceColor: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
    avatarBg: 'bg-slate-600'
  },
  { 
    id: 7, 
    username: 'support01', 
    name: 'Sarah Connor', 
    email: 'support@ibvap.gov', 
    role: 'Support', 
    roleColor: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    status: 'Active', 
    lastLogin: '4 hours ago',
    clearance: 'Level 2',
    clearanceColor: 'bg-pink-500/20 text-pink-400 border-pink-500/40',
    avatarBg: 'bg-pink-600'
  }
];

const rolesData = [
  { 
    name: 'Administrator', 
    color: 'bg-red-500/15 text-red-400 border-red-500/30', 
    clearance: 'Level 5',
    desc: 'Full system access, infrastructure configuration, cryptographic master keys and user management.',
    permissions: ['All System Modules', 'Root Terminal', 'User Admin', 'KMS Key Custody', 'Audit Purge']
  },
  { 
    name: 'Commander', 
    color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', 
    clearance: 'Level 4',
    desc: 'Tactical oversight, alert dispatching, multi-camera tracking approval, and incident resolution.',
    permissions: ['Command Center', 'Map Intelligence', 'PTZ Override', 'Incident Escalation', 'Export Evidence']
  },
  { 
    name: 'Operator', 
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', 
    clearance: 'Level 3',
    desc: 'Real-time border surveillance, manual PTZ steer, quick incident logging, and live perimeter monitoring.',
    permissions: ['Live Surveillance', 'PTZ Manual', 'Virtual Fences', 'Acknowledge Alerts']
  },
  { 
    name: 'Analyst', 
    color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', 
    clearance: 'Level 2',
    desc: 'Historical intelligence queries, ANPR database search, heatmap trends, and forensic video analysis.',
    permissions: ['Analytics Hub', 'Video Analyzer', 'Heatmaps', 'ANPR Search', 'Read-Only Logs']
  },
  { 
    name: 'Auditor', 
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', 
    clearance: 'Level 4',
    desc: 'Cryptographic compliance verification, immutable audit trail inspection, and tamper-proof verification.',
    permissions: ['Audit Log', 'Evidence Integrity Check', 'Chain of Custody', 'Compliance Export']
  },
  { 
    name: 'Viewer', 
    color: 'bg-slate-500/15 text-slate-300 border-slate-500/30', 
    clearance: 'Level 1',
    desc: 'Public or inter-agency dashboard viewing with redacted streams and zero control privileges.',
    permissions: ['Redacted Live Feeds', 'Public Status Page']
  },
];

export function UsersRoles() {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Operator');
  const [newClearance, setNewClearance] = useState('Level 3');

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  const toggleSelectUser = (id: number) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const deleteUser = (id: number) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    setSelectedUserIds(prev => prev.filter(x => x !== id));
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newEmail) return;

    const roleObj = rolesData.find(r => r.name === newRole);
    const newUser: UserItem = {
      id: Date.now(),
      username: newUsername,
      name: newName || newUsername,
      email: newEmail,
      role: newRole,
      roleColor: roleObj?.color || 'bg-slate-500/10 text-slate-300 border-slate-500/30',
      status: 'Active',
      lastLogin: 'Just now',
      clearance: newClearance,
      clearanceColor: newClearance === 'Level 5' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                      newClearance === 'Level 4' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                      newClearance === 'Level 3' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                      'bg-blue-500/20 text-blue-400 border-blue-500/40',
      avatarBg: 'bg-cyan-600'
    };

    setUsers([newUser, ...users]);
    setShowAddModal(false);
    setNewUsername('');
    setNewName('');
    setNewEmail('');
  };

  const activeUsersCount = users.filter(u => u.status === 'Active').length;
  const inactiveUsersCount = users.filter(u => u.status === 'Inactive').length;

  return (
    <div className="p-4 md:p-6 h-full flex flex-col bg-[#070B12] text-slate-200 overflow-y-auto space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0A0F18]/90 border border-slate-800/80 p-4 rounded-xl shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Users className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Users & Roles (RBAC)</h1>
            <p className="text-slate-400 text-xs">Manage platform access, users, and role-based permissions</p>
          </div>
        </div>

        {/* Right Action Controls: Search, Filter, Add User */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users, roles, or email..."
              className="w-full bg-[#080E18] border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button 
            onClick={() => setStatusFilter(prev => prev === 'ALL' ? 'Active' : prev === 'Active' ? 'Inactive' : 'ALL')}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              statusFilter !== 'ALL' ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-[#080E18] border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter: {statusFilter}</span>
          </button>

          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
          >
            <UserPlus className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-4 border-b border-slate-800/80 pb-0.5">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2.5 px-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" /> User Management
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-2.5 px-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'roles'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" /> Roles & Permissions
        </button>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Users */}
        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-blue-500/30 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Users size={22} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white font-mono">{users.length}</div>
              <div className="text-xs text-slate-400">Total Users</div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">↑ 12% vs last month</div>
            </div>
          </div>
          <div className="flex items-end gap-1 h-8 opacity-75">
            {[40, 50, 45, 60, 70, 85, 95].map((h, i) => (
              <div key={i} className="w-1.5 bg-blue-500/40 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <UserCheck size={22} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-emerald-400 font-mono">{activeUsersCount}</div>
              <div className="text-xs text-slate-400">Active Users</div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">{Math.round((activeUsersCount / users.length) * 100)}% of total</div>
            </div>
          </div>
          <div className="flex items-end gap-1 h-8 opacity-75">
            {[70, 75, 80, 70, 85, 90, 88].map((h, i) => (
              <div key={i} className="w-1.5 bg-emerald-500/40 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        {/* Inactive Users */}
        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-red-500/30 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              <UserX size={22} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-red-400 font-mono">{inactiveUsersCount}</div>
              <div className="text-xs text-slate-400">Inactive Users</div>
              <div className="text-[10px] text-red-400 font-semibold mt-0.5">{Math.round((inactiveUsersCount / users.length) * 100)}% of total</div>
            </div>
          </div>
          <div className="flex items-end gap-1 h-8 opacity-75">
            {[30, 25, 20, 30, 15, 10, 12].map((h, i) => (
              <div key={i} className="w-1.5 bg-red-500/40 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        {/* Total Roles */}
        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-purple-500/30 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <Shield size={22} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-purple-400 font-mono">{rolesData.length}</div>
              <div className="text-xs text-slate-400">Total Roles</div>
              <div className="text-[10px] text-purple-400 font-semibold mt-0.5">Role-based access</div>
            </div>
          </div>
          <div className="flex items-end gap-1 h-8 opacity-75">
            {[60, 60, 60, 60, 60, 60, 60].map((h, i) => (
              <div key={i} className="w-1.5 bg-purple-500/40 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>

      {/* Main Table or Roles Grid */}
      {activeTab === 'users' ? (
        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              All Users ({filteredUsers.length})
            </h2>
            {selectedUserIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{selectedUserIds.length} selected</span>
                <button 
                  onClick={() => setSelectedUserIds([])}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1 bg-red-500/10 rounded"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-slate-400 uppercase tracking-wider bg-[#080E18] border-b border-slate-800/80">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input 
                      type="checkbox"
                      checked={selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.length}
                      onChange={toggleSelectAll}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                    />
                  </th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Login</th>
                  <th className="py-3 px-4">Clearance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u.id);
                  const initials = u.username.slice(0, 2).toUpperCase();

                  return (
                    <tr 
                      key={u.id} 
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isSelected ? 'bg-cyan-500/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectUser(u.id)}
                          className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${u.avatarBg} flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm`}>
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{u.username}</div>
                            <div className="text-[11px] text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${u.roleColor}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                        {u.lastLogin}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase border ${u.clearanceColor}`}>
                          {u.clearance}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            title="Edit User"
                            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            title="Delete User"
                            onClick={() => deleteUser(u.id)}
                            className="p-1.5 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                          <button 
                            title="More Options"
                            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Roles & Permissions Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rolesData.map(r => (
            <div key={r.name} className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className={`px-3 py-1 rounded-md text-xs font-bold border ${r.color}`}>
                      {r.name}
                    </span>
                    <span className="ml-2 text-[10px] font-mono text-slate-400">
                      {r.clearance}
                    </span>
                  </div>
                  <Shield size={18} className="text-slate-500" />
                </div>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">{r.desc}</p>
                
                <div className="mt-4 pt-3 border-t border-slate-800/60">
                  <div className="text-[11px] font-semibold text-slate-300 mb-2">Granted Permissions:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.permissions.map(p => (
                      <span key={p} className="text-[10px] bg-[#080E18] text-slate-400 border border-slate-800 px-2 py-0.5 rounded">
                        ✓ {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  {users.filter(u => u.role === r.name).length} Users Assigned
                </span>
                <button className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1">
                  Edit Role <ArrowUpRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0F18] border border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-cyan-400" /> Enroll New User
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Username</label>
                <input 
                  type="text" 
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. patrol_officer04"
                  className="w-full bg-[#070B12] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Marcus Vance"
                  className="w-full bg-[#070B12] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. m.vance@ibvap.gov"
                  className="w-full bg-[#070B12] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Assigned Role</label>
                  <select 
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-[#070B12] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {rolesData.map(r => (
                      <option key={r.name} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Security Clearance</label>
                  <select 
                    value={newClearance}
                    onChange={(e) => setNewClearance(e.target.value)}
                    className="w-full bg-[#070B12] border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Level 1">Level 1 (Basic)</option>
                    <option value="Level 2">Level 2 (Confidential)</option>
                    <option value="Level 3">Level 3 (Secret)</option>
                    <option value="Level 4">Level 4 (Top Secret)</option>
                    <option value="Level 5">Level 5 (Cosmic / Root)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
export default UsersRoles;
