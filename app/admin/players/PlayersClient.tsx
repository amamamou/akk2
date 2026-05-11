"use client";

import React, { useMemo, useState } from 'react';
// Using raw <img> for external avatar hosts (avoids next/image host restrictions)
import AdminHeader from '../components/AdminHeader';
import AdminTable, { Column } from '../components/AdminTable';
import AdminAddModal from '../components/AdminAddModal';
import { Edit3, MoreHorizontal, FileText, Lock } from 'lucide-react';

type PlayerRow = { id: string; name: string; deviceId: string; location: string; client?: string; status: 'online'|'offline'; ip?: string; currentAudio?: string; lastActive?: string };

const MOCK: PlayerRow[] = [
  { id: 'p1', name: 'Studio One', deviceId: 'PLR-012-XYZ', location: 'Control Room', client: 'Zen Yoga Studio', status: 'online', ip: '192.168.1.12', currentAudio: 'Morning Mix', lastActive: '2m ago' },
  { id: 'p2', name: 'Lobby Player', deviceId: 'PLR-045-ABC', location: 'Reception', client: 'Retail Space Co', status: 'offline', ip: '192.168.1.45', currentAudio: '—', lastActive: '3h ago' },
];

function StatusBadge({ s }: { s: 'online'|'offline' }) {
  return <span className={`text-xs px-2 py-0.5 rounded ${s === 'online' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{s}</span>;
}

export default function PlayersClient() {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [rows, setRows] = useState<PlayerRow[]>(MOCK);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDevice, setNewDevice] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newIp, setNewIp] = useState('');

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(p => `${p.name} ${p.location}`.toLowerCase().includes(t));
  }, [q, rows]);

  const columns: Column<PlayerRow>[] = [
    { key: 'name', label: 'Player Name', render: (r) => (<div className="truncate"><span className="font-medium text-gray-900">{r.name}</span></div>) },
    { key: 'deviceId', label: 'Device ID', render: (r) => <span className="text-gray-600">{r.deviceId}</span> },
    { key: 'location', label: 'Location', render: (r) => <span className="text-gray-600">{r.location}</span> },
    { key: 'client', label: 'Client', render: (r) => <span className="text-gray-600">{r.client ?? '—'}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge s={r.status} /> },
    { key: 'ip', label: 'IP Address', render: (r) => <span className="text-gray-600">{r.ip ?? '—'}</span> },
    { key: 'currentAudio', label: 'Current Audio', render: (r) => <span className="text-gray-600">{r.currentAudio ?? '—'}</span> },
    { key: 'lastActive', label: 'Last Active', render: (r) => <span className="text-gray-600">{r.lastActive ?? '—'}</span> },
    { key: 'actions', label: 'Actions', className: 'w-32', render: (r) => (
      <div className="flex items-center justify-end gap-2">
        <a href={`/admin/players/${r.id}`} title="View player" aria-label={`View ${r.name}`} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-600 hover:text-[#1f2d3d] hover:bg-gray-100 focus:outline-none">
          <FileText size={16} />
        </a>
        <a href={`/admin/players/${r.id}/edit`} title="Edit player" aria-label={`Edit ${r.name}`} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-600 hover:text-[#1f2d3d] hover:bg-gray-100 focus:outline-none">
          <Edit3 size={16} />
        </a>
        <a href="#" title="Lock player" aria-label={`Lock ${r.name}`} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-red-600 hover:bg-red-50 focus:outline-none">
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
      <AdminHeader title="Players" subtitle="Manage playback endpoints" onAdd={() => setAddOpen(true)} searchValue={q} setSearchValue={setQ} />

      <div className="flex-1 overflow-auto">
        <div className="px-6 py-4">
          <AdminTable columns={columns} rows={filtered} selected={selected} onSelect={(id, checked) => setSelected(s => checked ? [...s, id] : s.filter(x => x !== id))} onSelectAll={(checked) => setSelected(checked ? filtered.map(r=>r.id) : [])} onRowClick={(r) => window.location.href = `/admin/players/${r.id}`} onDeleteSelected={(ids) => setRows(prev => prev.filter(p => !ids.includes(p.id)))} />
        </div>
      </div>

      <AdminAddModal open={addOpen} onClose={() => setAddOpen(false)} title="Add player" saveDisabled={!newName || !newDevice} onSave={() => {
        const id = `p${Date.now().toString(36)}`;
        setRows(prev => [{ id, name: newName, deviceId: newDevice, location: newLocation || 'Unknown', client: newClient || undefined, status: 'offline', ip: newIp || undefined, currentAudio: '—', lastActive: 'now' }, ...prev]);
        setAddOpen(false);
        setNewName(''); setNewDevice(''); setNewLocation(''); setNewClient(''); setNewIp('');
      }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Player name" className="w-full px-3 py-2 border border-gray-100 rounded-md" />
          <input value={newDevice} onChange={(e) => setNewDevice(e.target.value)} placeholder="Device ID" className="w-full px-3 py-2 border border-gray-100 rounded-md" />
          <input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Location" className="w-full px-3 py-2 border border-gray-100 rounded-md" />
          <input value={newClient} onChange={(e) => setNewClient(e.target.value)} placeholder="Client" className="w-full px-3 py-2 border border-gray-100 rounded-md" />
          <input value={newIp} onChange={(e) => setNewIp(e.target.value)} placeholder="IP address" className="w-full px-3 py-2 border border-gray-100 rounded-md col-span-2" />
        </div>
      </AdminAddModal>
    </div>
  );
}
