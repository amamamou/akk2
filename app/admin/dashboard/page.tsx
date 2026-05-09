import React from "react";
import { UserPlus, User, Wifi, ClipboardList } from "lucide-react";
import AdminDashboardHeader from "./components/DashboardHeader";

export const metadata = {
  title: "Admin Dashboard",
};

const clients = [
  { id: "c1", name: "Zen Yoga Studio", type: "Yoga Studio", status: "Active", players: 3, users: 2 },
  { id: "c2", name: "Retail Space Co", type: "Retail Store", status: "Active", players: 8, users: 5 },
  { id: "c3", name: "Wellness Center", type: "Wellness Center", status: "Inactive", players: 5, users: 1 },
  { id: "c4", name: "Harmony Wellness Spa", type: "Spa", status: "Trial", players: 2, users: 1 },
];

const activities = [
  { id: 1, title: "New client registered", detail: "Harmony Wellness Spa", time: "5m ago", type: "client" },
  { id: 2, title: "User created", detail: "john@example.com - Venue Manager", time: "12m ago", type: "user" },
  { id: 3, title: "Player connected", detail: "PLR-012-XYZ at Zen Yoga Studio", time: "28m ago", type: "player" },
  { id: 4, title: "Client updated", detail: "Retail Space Co - Added 3 new players", time: "1h ago", type: "client" },
  { id: 5, title: "User role changed", detail: "alice@yogastudio.com - Admin → Super Admin", time: "2h ago", type: "user" },
];

const alerts = [
  { id: 'a1', title: 'Player PLR-003-DEF offline for 2 hours', subtitle: 'Wellness Center', tone: 'yellow' },
  { id: 'a2', title: 'License renewal due in 7 days', subtitle: 'Zen Yoga Studio', tone: 'blue' },
];

function StatusBadge({ status }: { status: string }) {
  const base = "inline-flex items-center px-3 py-1 text-xs font-medium rounded-full";
  if (status === "Active") return <span className={base + " bg-green-50 text-green-700"}>{status}</span>;
  if (status === "Inactive") return <span className={base + " bg-gray-50 text-gray-700"}>{status}</span>;
  return <span className={base + " bg-blue-50 text-blue-700"}>{status}</span>;
}

function IconBox({ children, bg = "bg-gray-50" }: { children: React.ReactNode; bg?: string }) {
  return (
    <div className={`h-9 w-9 rounded-full flex items-center justify-center ${bg} text-gray-700`}>{children}</div>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="flex-1 overflow-auto bg-gray-50/30">
      <AdminDashboardHeader />
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Client Overview */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-md bg-gray-50 flex items-center justify-center text-gray-700">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.5" rx="1"/><rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.5" rx="1"/><rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.5" rx="1"/><rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.5" rx="1"/></svg>
                  </div>
                  <h3 className="text-lg font-semibold">Client Overview</h3>
                </div>
                <a href="/admin/clients" className="text-sm text-gray-600 hover:text-gray-900">Manage Clients →</a>
              </div>

              <div className="p-0">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase">
                      <th className="py-3 px-6">Client</th>
                      <th className="py-3 px-6">Type</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6">Players</th>
                      <th className="py-3 px-6">Users</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clients.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6 font-medium text-gray-800">{c.name}</td>
                        <td className="py-4 px-6 text-gray-600">{c.type}</td>
                        <td className="py-4 px-6">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="py-4 px-6 text-gray-600">{c.players}</td>
                        <td className="py-4 px-6 text-gray-600">{c.users}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Recent Activity */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
              </div>
              <div className="p-0">
                <ul className="divide-y divide-gray-100">
                  {activities.map((a) => (
                    <li key={a.id} className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-start gap-4">
                        <IconBox bg={a.type === 'client' ? 'bg-green-50' : a.type === 'user' ? 'bg-blue-50' : 'bg-purple-50'}>
                          {a.type === 'client' && <ClipboardList className="h-4 w-4" />}
                          {a.type === 'user' && <User className="h-4 w-4" />}
                          {a.type === 'player' && <Wifi className="h-4 w-4" />}
                        </IconBox>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{a.title}</p>
                          <p className="text-sm text-gray-500 mt-1">{a.detail}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">{a.time}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold">System Alerts</h3>
              </div>
              <div className="p-4 space-y-3">
                {alerts.map((al) => (
                  <div key={al.id} className={`${al.tone === 'yellow' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'} rounded-md p-4 border`}>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-gray-900">{al.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{al.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold">Quick Actions</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <a href="/admin/users" className="flex items-center gap-4 rounded-lg bg-gray-50 hover:bg-gray-100 px-4 py-3 text-sm text-gray-800">
                    <div className="h-9 w-9 rounded-md bg-white border border-gray-100 flex items-center justify-center text-gray-700"> 
                      <UserPlus className="h-4 w-4" />
                    </div>
                    Manage Users
                  </a>

                  <a href="/admin/clients" className="flex items-center gap-4 rounded-lg bg-gray-50 hover:bg-gray-100 px-4 py-3 text-sm text-gray-800">
                    <div className="h-9 w-9 rounded-md bg-white border border-gray-100 flex items-center justify-center text-gray-700"> 
                      <ClipboardList className="h-4 w-4" />
                    </div>
                    Manage Clients
                  </a>

                  <a href="/admin/players" className="flex items-center gap-4 rounded-lg bg-gray-50 hover:bg-gray-100 px-4 py-3 text-sm text-gray-800">
                    <div className="h-9 w-9 rounded-md bg-white border border-gray-100 flex items-center justify-center text-gray-700"> 
                      <Wifi className="h-4 w-4" />
                    </div>
                    Manage Players
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
