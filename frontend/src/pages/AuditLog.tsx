import React, { useState } from 'react';
import { 
  FileText, Search, Filter, Download, User, Activity, AlertCircle, 
  CheckCircle2, ShieldAlert, ShieldCheck, Lock, Terminal, Clock, 
  Eye, X, ArrowUpRight, Check, Hash
} from 'lucide-react';

interface AuditItem {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details: string;
  result: 'Success' | 'Failure';
  ip: string;
  hash: string;
}

const mockLogs: AuditItem[] = Array.from({ length: 24 }, (_, i) => {
  const actions = ['LOGIN', 'CAMERA_CHANGE', 'ZONE_CHANGE', 'EVIDENCE_ACCESS', 'CONFIG_CHANGE', 'INCIDENT_CHANGE'];
  const users = ['admin', 'commander01', 'operator01', 'auditor01', 'analyst01'];
  const resources = ['System Core', 'Camera: BOP-01', 'Evidence: EVD-17598', 'Zone: Sector-04-Red', 'AI Model: ByteTrack', 'ANPR DB'];
  const results: ('Success' | 'Failure')[] = i === 4 || i === 11 || i === 19 ? ['Failure'] : ['Success'];
  
  const action = actions[i % actions.length];
  const user = users[i % users.length];
  const resource = resources[i % resources.length];

  return {
    id: `LOG-2026-${(10482 + i).toString()}`,
    timestamp: new Date(Date.now() - i * 1000 * 60 * 18).toISOString().replace('T', ' ').substring(0, 19),
    user,
    action,
    resource,
    details: `${user} executed ${action} on ${resource} [Param: state_sync=ok]`,
    result: results[0],
    ip: `10.200.10.${10 + (i % 8)}`,
    hash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`
  };
});

const getActionColor = (action: string) => {
  switch (action) {
    case 'LOGIN': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    case 'EVIDENCE_ACCESS': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    case 'CAMERA_CHANGE': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    case 'INCIDENT_CHANGE': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    case 'CONFIG_CHANGE': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    case 'ZONE_CHANGE': return 'text-red-400 bg-red-500/10 border-red-500/30';
    default: return 'text-slate-400 bg-slate-800 border-slate-700';
  }
};

export function AuditLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditItem | null>(null);

  const filteredLogs = mockLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUser = userFilter === 'ALL' || log.user === userFilter;
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesSearch && matchesUser && matchesAction;
  });

  const handleExportAuditTrail = () => {
    const exportData = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        classification: 'RESTRICTED // LAW ENFORCEMENT & MILITARY ONLY',
        chainIntegrity: 'VERIFIED',
        merkleRoot: '0x8f2d4e9c1b7a3f5e9d2c4b8a1f7e3d5c9b2a4f8e1d7c3b5a9f2e4d8c1b7a3f5e',
        totalRecords: filteredLogs.length
      },
      auditLogs: filteredLogs
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IBVAP-AuditTrail-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col bg-[#070B12] text-slate-200 overflow-y-auto space-y-5">
      
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0A0F18]/90 border border-slate-800/80 p-4 rounded-xl shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              System Audit Log
            </h1>
            <p className="text-slate-400 text-xs">Immutable cryptographic record of all border surveillance actions</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-emerald-400 text-xs font-mono">
            <ShieldCheck size={15} />
            <span>CHAIN INTEGRITY: VERIFIED</span>
          </div>

          <button 
            onClick={handleExportAuditTrail}
            className="bg-[#0B111B] hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-700 shadow-sm cursor-pointer"
          >
            <Download size={14} className="text-cyan-400" />
            Export Audit Trail
          </button>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-blue-500/30 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Activity size={22} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white font-mono">14,235</div>
              <div className="text-xs text-slate-400">Total Events (24h)</div>
            </div>
          </div>
          <div className="flex items-end gap-1 h-8 opacity-75">
            {[40, 50, 45, 60, 70, 85, 95].map((h, i) => (
              <div key={i} className="w-1.5 bg-blue-500/40 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-amber-500/30 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Lock size={22} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-amber-400 font-mono">42</div>
              <div className="text-xs text-slate-400">Evidence Access</div>
            </div>
          </div>
          <div className="flex items-end gap-1 h-8 opacity-75">
            {[20, 30, 40, 35, 50, 45, 60].map((h, i) => (
              <div key={i} className="w-1.5 bg-amber-500/40 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-red-500/30 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              <AlertCircle size={22} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-red-400 font-mono">12</div>
              <div className="text-xs text-slate-400">Failed Actions</div>
            </div>
          </div>
          <div className="flex items-end gap-1 h-8 opacity-75">
            {[10, 5, 20, 15, 30, 10, 25].map((h, i) => (
              <div key={i} className="w-1.5 bg-red-500/40 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-purple-500/30 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <Terminal size={22} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-purple-400 font-mono">8</div>
              <div className="text-xs text-slate-400">Config Changes</div>
            </div>
          </div>
          <div className="flex items-end gap-1 h-8 opacity-75">
            {[50, 40, 60, 55, 45, 70, 65].map((h, i) => (
              <div key={i} className="w-1.5 bg-purple-500/40 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
        
        {/* Filter Toolbar */}
        <div className="p-3.5 border-b border-slate-800/80 flex flex-wrap gap-2.5 bg-[#080E18] items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search audit logs by ID, user, action, or resource..." 
              className="w-full pl-9 pr-4 py-1.5 bg-[#070B12] border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-cyan-500 text-slate-200 placeholder-slate-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <select 
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="bg-[#070B12] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Users</option>
              <option value="admin">admin</option>
              <option value="commander01">commander01</option>
              <option value="operator01">operator01</option>
              <option value="auditor01">auditor01</option>
              <option value="analyst01">analyst01</option>
            </select>

            <select 
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-[#070B12] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Actions</option>
              <option value="LOGIN">LOGIN</option>
              <option value="EVIDENCE_ACCESS">EVIDENCE_ACCESS</option>
              <option value="CAMERA_CHANGE">CAMERA_CHANGE</option>
              <option value="INCIDENT_CHANGE">INCIDENT_CHANGE</option>
              <option value="CONFIG_CHANGE">CONFIG_CHANGE</option>
              <option value="ZONE_CHANGE">ZONE_CHANGE</option>
            </select>

            <div className="text-[11px] text-slate-500 font-mono px-2">
              Showing {filteredLogs.length} events
            </div>
          </div>
        </div>

        {/* Audit Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-slate-400 uppercase tracking-wider bg-[#080E18] border-b border-slate-800/80">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredLogs.map((log) => (
                <tr 
                  key={log.id}
                  className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="py-2.5 px-4 font-mono font-bold text-cyan-400">{log.id}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-400 flex items-center gap-1.5">
                    <Clock size={12} className="text-slate-500" />
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-300 font-bold">
                        {log.user.substring(0, 2).toUpperCase()}
                      </span>
                      {log.user}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-300 font-mono text-xs">{log.resource}</td>
                  <td className="py-2.5 px-4">
                    {log.result === 'Success' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                        <CheckCircle2 size={13} /> SUCCESS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-400 font-bold text-[11px]">
                        <AlertCircle size={13} /> FAILURE
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{log.ip}</td>
                  <td className="py-2.5 px-4 text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                      className="text-cyan-400 hover:text-cyan-300 p-1 hover:bg-slate-800 rounded"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Drawer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0F18] border border-slate-800 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Audit Entry: {selectedLog.id}</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#070B12] rounded-lg border border-slate-800">
                <div>
                  <div className="text-slate-500 text-[10px]">TIMESTAMP</div>
                  <div className="font-mono text-slate-200 mt-0.5">{selectedLog.timestamp}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">OPERATOR</div>
                  <div className="font-semibold text-cyan-400 mt-0.5">{selectedLog.user}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">ACTION TYPE</div>
                  <div className="font-semibold text-white mt-0.5">{selectedLog.action}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">EXECUTION RESULT</div>
                  <div className={selectedLog.result === 'Success' ? 'text-emerald-400 font-bold mt-0.5' : 'text-red-400 font-bold mt-0.5'}>
                    {selectedLog.result}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-slate-400 font-semibold mb-1">Details & Params:</div>
                <div className="p-3 bg-[#070B12] rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
                  {selectedLog.details}
                </div>
              </div>

              <div>
                <div className="text-slate-400 font-semibold mb-1">Cryptographic Proof:</div>
                <div className="p-3 bg-[#070B12] rounded-lg border border-slate-800 font-mono text-[10px] text-slate-400 flex items-center justify-between">
                  <span>SHA-256 Hash: <span className="text-emerald-400">{selectedLog.hash}</span></span>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
                    TAMPER-PROOF
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
export default AuditLog;
