import React, { useEffect, useState, useRef } from 'react';
import { AgentCard, InventoryItem, LogEntry } from './types';
import { Terminal, Box, ShieldCheck, Activity, Send, Package, Zap, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { A2UIWrapper } from './components/A2UIWrapper';

export default function App() {
  const [agentCard, setAgentCard] = useState<AgentCard | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [simulating, setSimulating] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchState = async () => {
    try {
      const [cardRes, invRes, logsRes] = await Promise.all([
        fetch('/api/agent-card'),
        fetch('/api/inventory'),
        fetch('/api/logs')
      ]);
      setAgentCard(await cardRes.json());
      setInventory(await invRes.json());
      setLogs(await logsRes.json());
    } catch (e) {
      console.error('Error fetching state', e);
    }
  };

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 2000); // Polling for updates
    return () => clearInterval(interval);
  }, []);


  // Automatic scroll removed for manual scrolling as requested


  const simulateConciergeRequest = async (scenario: 'success' | 'low-stock' | 'auth-fail') => {
    setSimulating(true);
    let params: any = {
      item: 'Michelin',
      quantity: 4,
      maxPrice: 800,
      paymentNote: 'valid-ap2-note'
    };

    if (scenario === 'low-stock') {
      params.quantity = 20; // Will trigger input-required
    } else if (scenario === 'auth-fail') {
      params.paymentNote = 'invalid-note';
    }

    try {
      await fetch('/api/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'negotiate_order',
          params,
          id: Math.floor(Math.random() * 1000)
        })
      });
      fetchState();
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-editorial-bg text-[#E0E0E0] font-sans selection:bg-editorial-orange/30">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-editorial-border bg-black p-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-6 mt-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif italic text-white flex items-center gap-3">
              <Server className="w-8 h-8 text-editorial-orange" />
              Website A Dashboard
            </h1>
            <p className="text-[10px] tracking-widest uppercase opacity-50 mt-1 font-sans">Agent Instance <span className="font-mono text-editorial-orange tracking-tighter normal-case">UHP-ST-NODE-017</span></p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] uppercase font-bold tracking-widest-plus opacity-80">A2A Server Active</span>
            </div>
            <div className="px-3 py-1 border border-editorial-border rounded-full text-[10px] font-bold tracking-widest-plus text-editorial-orange uppercase">
              AGENT CARD V2.4
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Agent Card & Simulation Controls */}
          <div className="space-y-6">
            <section className="bg-black border border-editorial-border rounded-none overflow-hidden">
              <div className="px-4 py-3 border-b border-editorial-border flex items-center gap-2 bg-black">
                <Activity className="w-4 h-4 text-editorial-orange" />
                <h2 className="text-[11px] font-bold tracking-widest uppercase text-[#E0E0E0]">Published Agent Card</h2>
              </div>
              <div className="p-4">
                {agentCard ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] tracking-widest uppercase opacity-50 mb-1">ID</div>
                      <div className="font-mono text-sm text-editorial-orange">{agentCard.id}</div>
                    </div>
                    <div>
                      <div className="text-[10px] tracking-widest uppercase opacity-50 mb-1">Role</div>
                      <div className="text-sm text-[#E0E0E0]">{agentCard.role}</div>
                    </div>
                    <div>
                      <div className="text-[10px] tracking-widest uppercase opacity-50 mb-1">Endpoints</div>
                      <div className="space-y-1">
                        <div className="font-mono text-xs bg-[#050505] p-2 rounded-none border border-editorial-border flex items-center justify-between">
                          <span className="opacity-50">RPC</span>
                          <span className="text-editorial-orange">{agentCard.endpoints.rpc}</span>
                        </div>
                        <div className="font-mono text-xs bg-[#050505] p-2 rounded-none border border-editorial-border flex items-center justify-between">
                          <span className="opacity-50">CARD</span>
                          <span className="text-editorial-orange">{agentCard.endpoints.card}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] tracking-widest uppercase opacity-50 mb-2">Capabilities</div>
                      <div className="flex flex-wrap gap-2">
                        {agentCard.skills.map(skill => (
                          <span key={skill} className="px-2 py-1 text-[10px] font-mono tracking-widest uppercase bg-editorial-orange/5 border border-editorial-orange/20 text-[#E0E0E0]">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                    <div className="h-10 bg-gray-800 rounded w-full"></div>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-black border border-editorial-border rounded-none overflow-hidden">
              <div className="px-4 py-3 border-b border-editorial-border flex items-center gap-2 bg-black">
                <Zap className="w-4 h-4 text-editorial-orange" />
                <h2 className="text-[11px] font-bold tracking-widest uppercase text-[#E0E0E0]">Simulation Controls</h2>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-[10px] opacity-60 mb-4 font-mono leading-relaxed">Trigger incoming JSON-RPC requests from a mock Concierge Agent to observe A2A negotiation.</p>
                <button 
                  onClick={() => simulateConciergeRequest('success')}
                  disabled={simulating}
                  className="w-full flex items-center justify-between p-3 bg-[#050505] hover:bg-editorial-orange/5 border border-editorial-border hover:border-editorial-orange rounded-none transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest font-bold"
                >
                  <span className="text-[#E0E0E0]">Standard Order</span>
                  <Send className="w-4 h-4 text-editorial-orange" />
                </button>
                <button 
                  onClick={() => simulateConciergeRequest('low-stock')}
                  disabled={simulating}
                  className="w-full flex items-center justify-between p-3 bg-[#050505] hover:bg-editorial-orange/5 border border-editorial-border hover:border-editorial-orange rounded-none transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest font-bold"
                >
                  <span className="text-[#E0E0E0]">High Quantity (Negotiation)</span>
                  <Send className="w-4 h-4 text-editorial-orange" />
                </button>
                <button 
                  onClick={() => simulateConciergeRequest('auth-fail')}
                  disabled={simulating}
                  className="w-full flex items-center justify-between p-3 bg-[#050505] hover:bg-editorial-orange/5 border border-editorial-border hover:border-editorial-orange rounded-none transition-all disabled:opacity-50 text-[10px] uppercase tracking-widest font-bold"
                >
                  <span className="text-[#E0E0E0]">Invalid AP2 Note (Reject)</span>
                  <ShieldCheck className="w-4 h-4 text-editorial-orange" />
                </button>
              </div>
            </section>
          </div>

          {/* Middle & Right Columns */}
          <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
            
            {/* Inventory (MCP Connected) */}
            <section className="bg-editorial-panel border border-editorial-border rounded-none overflow-hidden shrink-0">
              <div className="px-4 py-3 border-b border-editorial-border flex items-center justify-between bg-black">
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-editorial-orange" />
                  <h2 className="text-[11px] font-bold tracking-widest uppercase text-[#E0E0E0]">Internal Inventory (MCP Server)</h2>
                </div>
                <span className="text-[10px] font-mono text-editorial-orange bg-editorial-orange/5 px-2 py-0.5 border border-editorial-orange/20 uppercase tracking-widest">CONNECTED</span>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] tracking-widest uppercase opacity-50 bg-[#050505] border-b border-editorial-border">
                    <tr>
                      <th className="px-4 py-3 font-normal">SKU</th>
                      <th className="px-4 py-3 font-normal">Brand / Model</th>
                      <th className="px-4 py-3 font-normal text-right">Price</th>
                      <th className="px-4 py-3 font-normal text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map(item => (
                      <tr key={item.id} className="border-b border-editorial-border/50 hover:bg-black transition-colors">
                        <td className="px-4 py-3 font-mono text-xs opacity-60">{item.sku}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-serif italic">{item.brand}</div>
                          <div className="text-[11px] opacity-60 font-mono mt-0.5">{item.model} • {item.size}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm">${item.price}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex px-2 py-1 text-[10px] font-mono tracking-widest uppercase border ${item.stock > 10 ? 'bg-green-900/20 text-green-400 border-green-500/20' : item.stock > 0 ? 'bg-orange-900/20 text-editorial-orange border-editorial-orange/20' : 'bg-red-900/20 text-red-400 border-red-500/20'}`}>
                            {item.stock} unit{item.stock !== 1 ? 's' : ''}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* A2A Terminal Logs */}
            <section className="bg-black border border-editorial-border rounded-none overflow-hidden flex flex-col h-[400px] shrink-0">
              <div className="px-4 py-3 border-b border-editorial-border flex items-center justify-between bg-black shrink-0">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-editorial-orange" />
                  <h2 className="text-[11px] font-bold tracking-widest uppercase text-[#E0E0E0]">Protocol Trace (JSON-RPC)</h2>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-editorial-border"></div>
                  <div className="w-1.5 h-1.5 bg-editorial-border"></div>
                  <div className="w-1.5 h-1.5 bg-editorial-border"></div>
                </div>
              </div>
              <div className="p-4 overflow-y-auto font-mono text-[10px] leading-relaxed flex-1 space-y-4 bg-[#050505]">
                <AnimatePresence initial={false}>
                  {logs.slice(0, 4).reverse().map((log) => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="border-l pl-3 py-1 space-y-1"
                      style={{
                        borderColor: 
                          log.type === 'A2A_IN' ? '#60a5fa' : 
                          log.type === 'A2A_OUT' ? '#4ade80' : 
                          log.type === 'MCP_SYNC' ? '#c084fc' :
                          log.type === 'AP2_AUTH' ? '#FF3E00' : 'rgba(255,255,255,0.1)'
                      }}
                    >
                      <div className="flex items-center gap-2 opacity-50">
                        <span>{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit', fractionalSecondDigits: 3 })}</span>
                        <span className={`px-1.5 py-0.5 border text-[9px] uppercase tracking-widest font-bold
                          ${log.type === 'A2A_IN' ? 'bg-blue-900/20 text-blue-400 border-blue-500/20' : ''}
                          ${log.type === 'A2A_OUT' ? 'bg-green-900/20 text-green-400 border-green-500/20' : ''}
                          ${log.type === 'MCP_SYNC' ? 'bg-purple-900/20 text-purple-400 border-purple-500/20' : ''}
                          ${log.type === 'AP2_AUTH' ? 'bg-orange-900/20 text-editorial-orange border-editorial-orange/20' : ''}
                          ${log.type === 'INFO' ? 'bg-white/5 text-white/60 border-white/10' : ''}
                        `}>
                          {log.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[#E0E0E0]">{log.message}</div>
                      {log.details && (
                        <div className="mt-2 p-2 bg-[#0A0A0A] border border-editorial-border overflow-x-auto text-[10px] text-editorial-orange">
                          <pre>{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={logsEndRef} />
              </div>
            </section>

          </div>
        </div>
        
        {/* A2UI Wrapper Mockup */}
        <A2UIWrapper />
      </div>
    </div>
  );
}
