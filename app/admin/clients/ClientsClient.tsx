"use client";

import React, { useEffect, useMemo, useState } from 'react';
// Using raw <img> for external avatar hosts (avoids next/image host restrictions)
import AdminHeader from '../components/AdminHeader';
import AdminTable, { Column } from '../components/AdminTable';
import AdminAddModal from '../components/AdminAddModal';
import AdminToast from '../components/AdminToast';
import { Building, User, Mail as MailIcon, Phone as PhoneIcon } from 'lucide-react';
import { Edit3, MoreHorizontal, FileText, Lock } from 'lucide-react';
import { getApiClient } from '@/lib/api-client';
import type { ClientInfo } from '@/types/api';

type ClientRow = { id: string; name: string; businessType?: string; contactName?: string; email?: string; phone?: string; status?: string; players?: number; created?: string };

const MOCK: ClientRow[] = [
  { id: 'c1', name: 'Zen Yoga Studio', businessType: 'Yoga Studio', contactName: 'Hannah Lee', email: 'contact@zenyoga.example', phone: '+1 555 1234', status: 'Active', players: 3, created: '2023-04-12' },
  { id: 'c2', name: 'Retail Space Co', businessType: 'Retail Store', contactName: 'Tom Becker', email: 'info@retailspace.example', phone: '+1 555 9876', status: 'Active', players: 8, created: '2022-11-20' },
];

export default function ClientsClient() {
  const apiClient = getApiClient();
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [rows, setRows] = useState<ClientRow[]>(MOCK);
  const [isLoading, setIsLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [toastOpen, setToastOpen] = useState(false);
  const initialNameRef = React.useRef<HTMLInputElement>(null as unknown as HTMLInputElement);

  useEffect(() => {
    let cancelled = false;
    const loadClients = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.listClients();
        if (cancelled) return;

        if (response?.clients && Array.isArray(response.clients)) {
          const clientRows: ClientRow[] = response.clients.map((client: ClientInfo) => ({
            id: client.id,
            name: client.name,
            businessType: client.businessType || 'General',
            contactName: client.contactPerson || '',
            email: client.email || '',
            phone: client.phone || '',
            status: client.status === 'ACTIVE' ? 'Active' : client.status === 'TRIAL' ? 'Trial' : 'Inactive',
            players: 0, // TODO: fetch from player counts if available
            created: client.createdAt ? new Date(client.createdAt).toISOString().slice(0, 10) : '',
          }));
          setRows(clientRows);
        } else {
          // Fall back to mock data if API doesn't return clients
          setRows(MOCK);
        }
      } catch (error) {
        console.error('Failed to load clients:', error);
        // Fall back to mock data on error
        setRows(MOCK);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadClients();
    return () => {
      cancelled = true;
    };
  }, [apiClient]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(c => `${c.name} ${c.contactName ?? ''} ${c.email ?? ''} ${c.businessType ?? ''}`.toLowerCase().includes(t));
  }, [q, rows]);

  const columns: Column<ClientRow>[] = [
    { key: 'name', label: 'Client Name', render: (r) => (<div className="truncate"><span className="font-medium text-gray-900">{r.name}</span></div>) },
    { key: 'businessType', label: 'Business Type', render: (r) => <span className="text-gray-600">{r.businessType ?? '—'}</span> },
    { key: 'contactName', label: 'Contact', render: (r) => <span className="text-gray-600">{r.contactName ?? '—'}</span> },
    { key: 'email', label: 'Email', render: (r) => <span className="text-gray-600">{r.email ?? '—'}</span> },
    { key: 'phone', label: 'Phone', render: (r) => <span className="text-gray-600">{r.phone ?? '—'}</span> },
    { key: 'status', label: 'Status', render: (r) => <span className="text-xs px-2 py-0.5 rounded text-green-700 bg-green-100">{r.status}</span> },
    { key: 'players', label: 'Players', render: (r) => <span className="text-gray-600">{r.players ?? 0}</span> },
    { key: 'created', label: 'Created', render: (r) => <span className="text-gray-600">{r.created ?? '—'}</span> },
    { key: 'actions', label: 'Actions', className: 'w-32', render: (r) => (
      <div className="flex items-center justify-end gap-2">
        <a href={`/admin/clients/${r.id}`} title="View client" aria-label={`View ${r.name}`} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-600 hover:text-[#1f2d3d] hover:bg-gray-100 focus:outline-none">
          <FileText size={16} />
        </a>
        <a href={`/admin/clients/${r.id}/edit`} title="Edit client" aria-label={`Edit ${r.name}`} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-600 hover:text-[#1f2d3d] hover:bg-gray-100 focus:outline-none">
          <Edit3 size={16} />
        </a>
        <a href="#" title="Lock client" aria-label={`Lock ${r.name}`} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-red-600 hover:bg-red-50 focus:outline-none">
          <Lock size={16} />
        </a>
        <a href="#" title="More" aria-label={`More actions for ${r.name}`} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:bg-gray-100 focus:outline-none">
          <MoreHorizontal size={16} />
        </a>
      </div>
    ) },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <AdminHeader title="Clients" subtitle="Clients and projects" onAdd={() => setAddOpen(true)} searchValue={q} setSearchValue={setQ} />
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-4">
          <AdminTable columns={columns} rows={filtered} selected={selected} onSelect={(id, checked) => setSelected(s => checked ? [...s, id] : s.filter(x => x !== id))} onSelectAll={(checked) => setSelected(checked ? filtered.map(r=>r.id) : [])} onRowClick={(r) => window.location.href = `/admin/clients/${r.id}`} onDeleteSelected={(ids) => setRows(prev => prev.filter(p => !ids.includes(p.id)))} />
        </div>
      </div>

      <AdminAddModal open={addOpen} onClose={() => setAddOpen(false)} title="Add client" initialFocusRef={initialNameRef} saveDisabled={!newName} onSave={async () => {
        try {
          const newClient = await apiClient.createClient({
            name: newName,
            businessType: newType || 'General',
            contactPerson: newContact || '',
            email: newEmail || '',
            phone: newPhone || '',
          });

          const id = newClient?.client?.id || `c${Date.now().toString(36)}`;
          setRows(prev => [{ id, name: newName, businessType: newType || 'General', contactName: newContact || '', email: newEmail || '', phone: newPhone || '', status: 'Active', players: 0, created: new Date().toISOString().slice(0,10) }, ...prev]);
          setAddOpen(false);
          setToastOpen(true);
          setTimeout(() => setToastOpen(false), 2500);
          setNewName(''); setNewType(''); setNewContact(''); setNewEmail(''); setNewPhone('');
        } catch (error) {
          console.error('Failed to create client:', error);
          // Still add to UI optimistically
          const id = `c${Date.now().toString(36)}`;
          setRows(prev => [{ id, name: newName, businessType: newType || 'General', contactName: newContact || '', email: newEmail || '', phone: newPhone || '', status: 'Active', players: 0, created: new Date().toISOString().slice(0,10) }, ...prev]);
          setAddOpen(false);
          setToastOpen(true);
          setTimeout(() => setToastOpen(false), 2500);
          setNewName(''); setNewType(''); setNewContact(''); setNewEmail(''); setNewPhone('');
        }
      }}>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Client name</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Building className="h-4 w-4" />
              </div>
              <input ref={initialNameRef} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Harmony Wellness Spa" className="w-full pl-11 pr-3 py-2 border border-gray-100 rounded-md shadow-sm focus:ring-2 focus:ring-[#A473FF]/30" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Business type</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User className="h-4 w-4" />
                </div>
                <input value={newType} onChange={(e) => setNewType(e.target.value)} placeholder="e.g. Spa, Retail" className="w-full pl-11 pr-3 py-2 border border-gray-100 rounded-md shadow-sm focus:ring-2 focus:ring-[#A473FF]/30" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-600 mb-1 block">Contact name</label>
              <input value={newContact} onChange={(e) => setNewContact(e.target.value)} placeholder="Contact person's full name" className="w-full px-3 py-2 border border-gray-100 rounded-md shadow-sm focus:ring-2 focus:ring-[#A473FF]/30" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Contact email</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <MailIcon className="h-4 w-4" />
                </div>
                <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@example.com" className="w-full pl-11 pr-3 py-2 border border-gray-100 rounded-md shadow-sm focus:ring-2 focus:ring-[#A473FF]/30" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-600 mb-1 block">Phone</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <PhoneIcon className="h-4 w-4" />
                </div>
                <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+1 555 1234" className="w-full pl-11 pr-3 py-2 border border-gray-100 rounded-md shadow-sm focus:ring-2 focus:ring-[#A473FF]/30" />
              </div>
            </div>
          </div>
        </div>
      </AdminAddModal>
      <AdminToast open={toastOpen} message="Client added" />
    </div>
  );
}
