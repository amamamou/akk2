"use client";

import React, { useMemo, useState } from 'react';
import AdminHeader from '../components/AdminHeader';
import AdminAddModal from '../components/AdminAddModal';
import AdminToast from '../components/AdminToast';
import { ADMIN_CLIENTS } from '../data/clients';
import AdminTable, { Column } from '../components/AdminTable';
import { FileText, Edit3, Mail, Lock, MoreHorizontal } from 'lucide-react';

type UserRow = { id: string; firstName: string; lastName: string; email: string; role: string; status: string; client?: string; created: string };

export default function UsersClient() {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [rows, setRows] = useState<UserRow[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Client');
  const [toastOpen, setToastOpen] = useState(false);
  const [newClientSelect, setNewClientSelect] = useState(ADMIN_CLIENTS[0]?.name ?? '');

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(u => `${u.firstName} ${u.lastName} ${u.email} ${u.role}`.toLowerCase().includes(t));
  }, [q, rows]);

    const columns: Column<UserRow>[] = [
      {
        key: 'name',
        label: 'Name',
        render: (r) => (
          <div className="truncate">
            <div className="font-medium text-gray-900">{`${r.firstName} ${r.lastName}`}</div>
          </div>
        ),
      },
      { key: 'email', label: 'Email', render: (r) => (<div className="flex items-center gap-2 text-gray-600"><Mail size={14} />{r.email}</div>) },
      { key: 'role', label: 'Role', render: (r) => <span className="text-xs px-2 py-0.5 rounded text-gray-700 bg-gray-100">{r.role}</span> },
      { key: 'status', label: 'Status', render: (r) => <span className="text-xs px-2 py-0.5 rounded text-green-700 bg-green-100">{r.status}</span> },
      { key: 'client', label: 'Client', render: (r) => <span className="text-gray-600">{r.client ?? '—'}</span> },
      { key: 'created', label: 'Created', render: (r) => <span className="text-gray-600">{r.created}</span> },
      { key: 'actions', label: 'Actions', className: 'w-32', render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <a href={`/admin/users/${r.id}`} title="View user" aria-label={`View ${r.firstName} ${r.lastName}`} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-600 hover:text-[#1f2d3d] hover:bg-gray-100 focus:outline-none">
            <FileText size={16} />
          </a>
          <a href={`/admin/users/${r.id}/edit`} title="Edit user" aria-label={`Edit ${r.firstName} ${r.lastName}`} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-600 hover:text-[#1f2d3d] hover:bg-gray-100 focus:outline-none">
            <Edit3 size={16} />
          </a>
          <a href="#" title="Lock user" aria-label={`Lock ${r.firstName} ${r.lastName}`} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-red-600 hover:bg-red-50 focus:outline-none">
            <Lock size={16} />
          </a>
          <a href="#" title="More" aria-label={`More actions for ${r.firstName} ${r.lastName}`} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:bg-gray-100 focus:outline-none">
            <MoreHorizontal size={16} />
          </a>
        </div>
      ) },
    ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <AdminHeader title="Users" subtitle="Manage accounts and roles" onAdd={() => setAddOpen(true)} searchValue={q} setSearchValue={setQ} />
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-4">
          <AdminTable
            columns={columns}
            rows={filtered}
            selected={selected}
            onSelect={(id, checked) => setSelected(s => checked ? [...s, id] : s.filter(x => x !== id))}
            onSelectAll={(checked) => setSelected(checked ? filtered.map(r=>r.id) : [])}
            onRowClick={(r) => window.location.href = `/admin/users/${r.id}`}
            onDeleteSelected={(ids) => setRows(prev => prev.filter(p => !ids.includes(p.id)))}
          />
        </div>
      </div>

      <AdminAddModal open={addOpen} onClose={() => setAddOpen(false)} title="Add user" saveDisabled={!newFirst || !newLast || !newEmail} onSave={() => {
        const id = `u${Date.now().toString(36)}`;
        setRows(prev => [{ id, firstName: newFirst, lastName: newLast, email: newEmail, role: newRole, status: 'Active', client: newClientSelect, created: new Date().toISOString().slice(0,10) }, ...prev]);
        setAddOpen(false);
        setToastOpen(true);
        setTimeout(() => setToastOpen(false), 2500);
        setNewFirst(''); setNewLast(''); setNewEmail(''); setNewRole('Client'); setNewClientSelect(ADMIN_CLIENTS[0]?.name ?? '');
      }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input value={newFirst} onChange={(e) => setNewFirst(e.target.value)} placeholder="First name" className="w-full px-3 py-2 border border-gray-100 rounded-md" />
          <input value={newLast} onChange={(e) => setNewLast(e.target.value)} placeholder="Last name" className="w-full px-3 py-2 border border-gray-100 rounded-md" />
          <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 border border-gray-100 rounded-md col-span-2" />
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full px-3 py-2 border border-gray-100 rounded-md">
            <option>Admin</option>
            <option>Content Manager</option>
            <option>Client</option>
          </select>
          <select value={newClientSelect} onChange={(e) => setNewClientSelect(e.target.value)} className="w-full px-3 py-2 border border-gray-100 rounded-md">
            {ADMIN_CLIENTS.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </AdminAddModal>
      <AdminToast open={toastOpen} message="User added" />
    </div>
  );
}
