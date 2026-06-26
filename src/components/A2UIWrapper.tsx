import React, { useState, useEffect } from 'react';
import { Map, Calendar, ArrowRightLeft, CalendarCheck, Loader2, ExternalLink, FileSpreadsheet, Plus, RefreshCw, LogOut } from 'lucide-react';
import { initAuth, googleSignIn, getAccessToken, logout } from '../lib/auth';
import { createEvent, getUpcomingEvents } from '../lib/calendar';
import { createLogisticsSheet, appendRowToSheet, getSheetRows, SheetRow } from '../lib/sheets';
import { addDays, setHours, setMinutes, format } from 'date-fns';
import { User } from 'firebase/auth';
import Markdown from 'react-markdown';

export function A2UIWrapper() {
  const [syncedState, setSyncedState] = useState<any>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  
  const [estimateData, setEstimateData] = useState<{text: string, places: any[]} | null>(null);
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false);

  // Google Sheets integration state
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(localStorage.getItem('logistics_spreadsheet_id'));
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(localStorage.getItem('logistics_spreadsheet_url'));
  const [sheetRows, setSheetRows] = useState<string[][]>([]);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isLoadingSheetData, setIsLoadingSheetData] = useState(false);
  const [sheetStatusMsg, setSheetStatusMsg] = useState<string | null>(null);
  const [isExportingEstimate, setIsExportingEstimate] = useState(false);

  useEffect(() => {
    fetchEstimate();
    const unsubscribe = initAuth(
      (user, token) => {
        setNeedsAuth(false);
        setUser(user);
        loadEvents(token);
        if (spreadsheetId) {
          loadSheetData(token, spreadsheetId);
        }
      },
      () => setNeedsAuth(true)
    );
    return () => unsubscribe();
  }, [spreadsheetId]);

  useEffect(() => {
    const syncSheetsToken = async () => {
      const token = await getAccessToken();
      if (token && spreadsheetId) {
        try {
          await fetch('/api/save-sheets-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, spreadsheetId })
          });
        } catch (e) {
          console.error("Failed to sync Sheets config to server:", e);
        }
      }
    };
    syncSheetsToken();
  }, [user, spreadsheetId]);

  const loadSheetData = async (token: string, id: string) => {
    setIsLoadingSheetData(true);
    try {
      const rows = await getSheetRows(token, id);
      setSheetRows(rows);
    } catch (error) {
      console.error('Failed to load sheet data:', error);
    } finally {
      setIsLoadingSheetData(false);
    }
  };

  const handleCreateSheet = async () => {
    if (needsAuth) {
      alert("Please connect Google Workspace first.");
      return;
    }
    setIsCreatingSheet(true);
    setSheetStatusMsg("Creating spreadsheet on Google Drive...");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("No access token found");
      const result = await createLogisticsSheet(token);
      setSpreadsheetId(result.spreadsheetId);
      setSpreadsheetUrl(result.spreadsheetUrl);
      localStorage.setItem('logistics_spreadsheet_id', result.spreadsheetId);
      localStorage.setItem('logistics_spreadsheet_url', result.spreadsheetUrl);
      setSheetStatusMsg("Spreadsheet created successfully! Initializing log rows...");
      
      // Append initial setup row
      await appendRowToSheet(token, result.spreadsheetId, {
        timestamp: new Date().toLocaleString(),
        activityType: 'INITIALIZATION',
        details: 'Lamborghini Logistics Tracker Created',
        status: 'SUCCESS'
      });
      
      await loadSheetData(token, result.spreadsheetId);
      setSheetStatusMsg(null);
    } catch (error) {
      console.error('Failed to create sheet:', error);
      alert('Failed to create spreadsheet on Google Drive. Make sure popups are enabled.');
      setSheetStatusMsg(null);
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleSyncSheetNow = async () => {
    const token = await getAccessToken();
    if (token && spreadsheetId) {
      await loadSheetData(token, spreadsheetId);
    }
  };

  const handleExportEstimate = async () => {
    if (!estimateData || !spreadsheetId) return;
    setIsExportingEstimate(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("No access token found");
      
      const summaryText = estimateData.text.replace(/[#*`]/g, '').slice(0, 150) + '...';
      
      await appendRowToSheet(token, spreadsheetId, {
        timestamp: new Date().toLocaleString(),
        activityType: 'LOGISTICS_ESTIMATE',
        details: summaryText,
        status: 'SUCCESS'
      });
      
      await loadSheetData(token, spreadsheetId);
      alert("Delivery Estimate successfully exported to Google Sheets!");
    } catch (error) {
      console.error('Failed to export estimate:', error);
      alert('Failed to export estimate to Google Sheets.');
    } finally {
      setIsExportingEstimate(false);
    }
  };

  const loadEvents = async (token: string) => {
    setIsLoadingEvents(true);
    try {
      const data = await getUpcomingEvents(token);
      setUpcomingEvents(data.items || []);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const fetchEstimate = async () => {
    setIsLoadingEstimate(true);
    try {
      const res = await fetch('/api/delivery-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: 'Hwy 201 near Khon Kaen, Thailand (16.4386 N, 102.8287 E)',
          origin: 'Slick Mobile Dispatch Hub, Khon Kaen'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setEstimateData(data);
      }
    } catch (error) {
      console.error('Failed to fetch estimate:', error);
    } finally {
      setIsLoadingEstimate(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setNeedsAuth(false);
        setUser(result.user);
        await loadEvents(result.accessToken);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Generate some realistic slots based on current time
  const tomorrow = addDays(new Date(), 1);
  const slots = [
    setHours(setMinutes(tomorrow, 0), 10),
    setHours(setMinutes(tomorrow, 0), 14),
    setHours(setMinutes(addDays(tomorrow, 1), 0), 9),
    setHours(setMinutes(addDays(tomorrow, 1), 0), 15),
  ];

  const handleSlotClick = async (slotTime: Date) => {
    const confirmed = window.confirm(
      `Book mobile fitting on ${format(slotTime, 'MMM dd - hh:mm a')} and add it to your Google Calendar?`
    );
    
    if (!confirmed) return;
    
    if (needsAuth) {
       alert("Please sign in to Google first to sync with your calendar.");
       return;
    }

    try {
      const token = await getAccessToken();
      if (!token) throw new Error("No valid token");
      
      const endTime = new Date(slotTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours
      
      await createEvent(
        token, 
        'Lamborghini Mobile Tire Fitting (UHP Agent)', 
        slotTime, 
        endTime
      );
      
      syncToDealerAgent(format(slotTime, 'MMM dd - hh:mm a'));
      await loadEvents(token);

      if (spreadsheetId) {
        try {
          await appendRowToSheet(token, spreadsheetId, {
            timestamp: new Date().toLocaleString(),
            activityType: 'FITTING_BOOKING',
            details: `Scheduled fitting for ${format(slotTime, 'MMM dd - hh:mm a')}`,
            status: 'SUCCESS'
          });
          await loadSheetData(token, spreadsheetId);
        } catch (err) {
          console.error("Failed to append row to Google Sheets:", err);
        }
      }
    } catch (error) {
      console.error('Failed to book event:', error);
      alert('Failed to book event in Google Calendar');
    }
  };

  const syncToDealerAgent = (slot: string) => {
    setSyncedState({
      status: 'SYNCED',
      timestamp: new Date().toISOString(),
      action: 'CONFIRM_FITTING_SLOT',
      payload: { slot }
    });
  };

  return (
    <div className="space-y-6 mt-12 border-t border-editorial-border pt-8">
      <div className="flex items-center justify-between border-b border-editorial-border pb-4 mb-6">
        <h2 className="text-xl font-serif italic text-white flex items-center gap-3">
          <ArrowRightLeft className="w-6 h-6 text-editorial-orange" />
          A2UI Client Wrapper (Website B Mockup)
        </h2>
        <span className="text-[10px] font-mono text-editorial-orange bg-editorial-orange/5 px-2 py-0.5 border border-editorial-orange/20 uppercase tracking-widest">
          INTERCEPT MODE ACTIVE
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map iframe mockup */}
        <section className="bg-black border border-editorial-border rounded-none flex flex-col h-[400px] relative">
           <div className="px-4 py-3 border-b border-editorial-border flex items-center justify-between bg-black shrink-0 z-20 relative">
             <div className="flex items-center gap-2">
               <Map className="w-4 h-4 text-editorial-orange" />
               <h3 className="text-[11px] font-bold tracking-widest uppercase text-[#E0E0E0]">MCP App: Delivery Logistics</h3>
             </div>
             {isLoadingEstimate && <Loader2 className="w-3 h-3 text-editorial-orange animate-spin" />}
           </div>
           
           <div className="flex-1 bg-[#050505] relative flex flex-col overflow-y-auto">
             {/* Map Grid Background */}
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
             
             <div className="p-4 z-10 relative">
               <div className="bg-black border border-editorial-border p-3 mb-4 shadow-lg flex items-center justify-between">
                 <div>
                   <div className="text-[10px] uppercase tracking-widest opacity-50 mb-1">Live Estimate</div>
                   <div className="font-mono text-[11px] text-editorial-orange">
                     {isLoadingEstimate ? 'CALCULATING...' : 'REAL-TIME MAPS GROUNDING'}
                   </div>
                 </div>
                 {!isLoadingEstimate && estimateData && (
                   <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                 )}
               </div>

               {estimateData && (
                 <div className="space-y-4">
                   <div className="prose prose-invert prose-sm font-mono text-[11px] leading-relaxed opacity-80 max-w-none">
                     <Markdown>{estimateData.text}</Markdown>
                      {spreadsheetId && (
                        <button 
                          onClick={handleExportEstimate}
                          disabled={isExportingEstimate}
                          className="mt-4 w-full flex items-center justify-center gap-2 border border-editorial-border hover:border-editorial-orange hover:text-editorial-orange bg-[#050505] py-2 text-[10px] uppercase tracking-widest font-mono transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isExportingEstimate ? (
                            <Loader2 className="w-3 h-3 animate-spin text-editorial-orange" />
                          ) : (
                            <FileSpreadsheet className="w-3 h-3 text-editorial-orange" />
                          )}
                          Export Estimate to Google Sheets
                        </button>
                      )}
                   </div>
                   
                   {estimateData.places && estimateData.places.length > 0 && (
                     <div className="mt-4 border-t border-editorial-border pt-4">
                       <h4 className="text-[10px] uppercase tracking-widest opacity-50 mb-2">Maps Sources</h4>
                       <div className="flex flex-col gap-2">
                         {estimateData.places.map((place: any, i: number) => (
                           <a key={i} href={place.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-black border border-editorial-border p-2 hover:border-editorial-orange transition-colors">
                             <span className="text-[10px] font-mono text-[#E0E0E0] truncate mr-2">{place.title || place.uri}</span>
                             <ExternalLink className="w-3 h-3 text-editorial-orange shrink-0" />
                           </a>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               )}
             </div>
             
             <div className="sticky bottom-0 mt-auto bg-gradient-to-t from-black to-transparent p-4 flex items-center justify-center pointer-events-none z-20">
                <span className="text-[10px] font-mono tracking-widest text-[#E0E0E0] opacity-50 border border-editorial-border px-3 py-1 bg-black/80">SECURE IFRAME SANDBOX</span>
             </div>
           </div>
        </section>

        {/* Calendar iframe mockup */}
        <section className="bg-black border border-editorial-border rounded-none flex flex-col h-[400px] relative">
           <div className="px-4 py-3 border-b border-editorial-border flex items-center justify-between bg-black shrink-0 z-20 relative">
             <div className="flex items-center gap-2">
               <Calendar className="w-4 h-4 text-editorial-orange" />
               <h3 className="text-[11px] font-bold tracking-widest uppercase text-[#E0E0E0]">MCP App: Google Calendar Integration</h3>
             </div>
             {user && (
                <div className="text-[10px] font-mono opacity-50">
                  {user.email}
                </div>
             )}
           </div>
           
           <div className="flex-1 bg-[#050505] p-4 flex flex-col relative overflow-y-auto">
             {needsAuth ? (
               <div className="flex flex-col items-center justify-center h-full z-10 relative space-y-4">
                  <p className="text-[11px] font-mono opacity-70 text-center px-8">
                    Connect your Google Calendar to view existing schedule and instantly book the mobile fitting service.
                  </p>
                  <button 
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black text-[11px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                    {isLoggingIn ? 'Connecting...' : 'Connect Calendar'}
                  </button>
               </div>
             ) : (
               <div className="z-10 relative flex flex-col h-full space-y-6">
                 
                 <div>
                   <div className="text-[10px] opacity-60 mb-3 font-mono uppercase tracking-widest">
                     Select Fitting Slot
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     {slots.map((slot, i) => (
                       <button 
                         key={i}
                         onClick={() => handleSlotClick(slot)}
                         className="p-3 border border-editorial-border hover:border-editorial-orange bg-black text-[#E0E0E0] text-[10px] font-mono text-left transition-colors hover:text-editorial-orange cursor-pointer flex flex-col gap-1"
                       >
                         <span>{format(slot, 'MMM dd')}</span>
                         <span className="text-white text-xs">{format(slot, 'hh:mm a')}</span>
                       </button>
                     ))}
                   </div>
                 </div>

                 {syncedState && (
                   <div className="bg-green-900/10 border border-green-500/20 p-3 shrink-0">
                     <div className="text-[10px] font-bold tracking-widest uppercase text-green-400 mb-1 flex items-center gap-2">
                       <CalendarCheck className="w-3 h-3" />
                       Added to Google Calendar & A2UI Synced
                     </div>
                     <div className="font-mono text-[9px] text-[#E0E0E0] opacity-70">
                       Slot: {syncedState.payload.slot}<br/>
                       Action: {syncedState.action}<br/>
                       Synced at: {new Date(syncedState.timestamp).toLocaleTimeString()}
                     </div>
                   </div>
                 )}

                 <div className="flex-1 overflow-hidden flex flex-col min-h-[120px]">
                   <div className="text-[10px] opacity-60 mb-2 font-mono uppercase tracking-widest border-t border-editorial-border pt-4">
                     Your Upcoming Schedule
                   </div>
                   <div className="overflow-y-auto space-y-2 pr-2">
                     {isLoadingEvents ? (
                        <div className="text-[10px] font-mono opacity-50 animate-pulse">Loading events...</div>
                     ) : upcomingEvents.length === 0 ? (
                        <div className="text-[10px] font-mono opacity-50">No upcoming events found.</div>
                     ) : (
                        upcomingEvents.slice(0, 5).map(event => (
                          <div key={event.id} className="text-[10px] font-mono border-l-2 border-editorial-orange pl-2 py-1">
                            <div className="text-[#E0E0E0] truncate">{event.summary || 'Busy'}</div>
                            <div className="opacity-50">
                              {event.start?.dateTime 
                                ? format(new Date(event.start.dateTime), 'MMM dd, h:mm a') 
                                : event.start?.date 
                                  ? format(new Date(event.start.date), 'MMM dd')
                                  : 'Unknown time'}
                            </div>
                          </div>
                        ))
                     )}
                   </div>
                 </div>
                 
               </div>
             )}
             
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20" style={{ pointerEvents: 'none' }}>
                <span className="text-[10px] font-mono tracking-widest text-[#E0E0E0] opacity-50 border border-editorial-border px-3 py-1 bg-black/80" style={{ pointerEvents: 'none' }}>SECURE IFRAME SANDBOX</span>
             </div>
           </div>
        </section>
      </div>

      {/* Google Sheets Live Sync Integration */}
      <section className="bg-black border border-editorial-border p-4 mt-6 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
        
        <div className="flex items-center justify-between border-b border-editorial-border pb-3 mb-4 z-10 relative">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-editorial-orange" />
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-[#E0E0E0]">MCP App: Google Sheets Integration</h3>
          </div>
          {spreadsheetId && (
            <span className="text-[9px] font-mono text-green-400 bg-green-400/5 px-2 py-0.5 border border-green-400/20 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
              Live Sync Enabled
            </span>
          )}
        </div>

        {needsAuth ? (
          <div className="text-center py-8 z-10 relative space-y-4">
            <p className="text-[11px] font-mono opacity-70 max-w-lg mx-auto">
              Activate real-time reporting by connecting your Google Workspace. This logs mobile tire booking times and route logistics to a spreadsheet in your Google Drive.
            </p>
            <button 
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="px-4 py-2 bg-white text-black text-[11px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Connect Google Workspace
            </button>
          </div>
        ) : (
          <div className="z-10 relative space-y-6">
            {!spreadsheetId ? (
              <div className="p-6 border border-dashed border-editorial-border bg-black/40 text-center space-y-4">
                <p className="text-[11px] font-mono opacity-70">
                  No active Lamborghini Logistics Sheet linked. Create a dedicated tracking spreadsheet on your Google Drive to automatically store activity logs.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={handleCreateSheet}
                    disabled={isCreatingSheet}
                    className="flex items-center gap-2 px-4 py-2 bg-editorial-orange text-white text-[11px] font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isCreatingSheet ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Create Tracker Spreadsheet
                  </button>
                  
                  <span className="text-[10px] font-mono opacity-40">OR</span>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Paste Spreadsheet ID..." 
                      id="manualSheetId"
                      className="bg-black border border-editorial-border px-3 py-1.5 font-mono text-[10px] text-white focus:border-editorial-orange outline-none w-48"
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          const val = (e.currentTarget as HTMLInputElement).value.trim();
                          if (val) {
                            setSpreadsheetId(val);
                            localStorage.setItem('logistics_spreadsheet_id', val);
                            const token = await getAccessToken();
                            if (token) loadSheetData(token, val);
                          }
                        }
                      }}
                    />
                    <button 
                      onClick={async () => {
                        const val = (document.getElementById('manualSheetId') as HTMLInputElement)?.value.trim();
                        if (val) {
                          setSpreadsheetId(val);
                          localStorage.setItem('logistics_spreadsheet_id', val);
                          const token = await getAccessToken();
                          if (token) loadSheetData(token, val);
                        }
                      }}
                      className="px-3 py-1.5 border border-editorial-border hover:border-editorial-orange text-[10px] uppercase font-mono cursor-pointer"
                    >
                      Link
                    </button>
                  </div>
                </div>

                {sheetStatusMsg && (
                  <div className="text-[10px] font-mono text-editorial-orange animate-pulse">
                    {sheetStatusMsg}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#050505] border border-editorial-border p-3.5">
                  <div className="space-y-1">
                    <div className="text-[10px] uppercase tracking-widest opacity-40 font-mono">Linked Document</div>
                    <a 
                      href={spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-mono font-medium text-white hover:text-editorial-orange transition-colors"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
                      Lamborghini Logistics & Fitting Tracker
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <div className="text-[9px] font-mono text-gray-500 truncate max-w-md">ID: {spreadsheetId}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSyncSheetNow}
                      disabled={isLoadingSheetData}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-editorial-border hover:border-editorial-orange bg-black text-[#E0E0E0] text-[10px] font-mono transition-colors cursor-pointer"
                      title="Sync Now"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingSheetData ? 'animate-spin' : ''}`} />
                      Refresh Data
                    </button>

                    <button
                      onClick={async () => {
                        const token = await getAccessToken();
                        if (token) {
                          try {
                            await appendRowToSheet(token, spreadsheetId, {
                              timestamp: new Date().toLocaleString(),
                              activityType: 'MANUAL_TEST',
                              details: 'Diagnostic heartbeat log dispatched from Editorial Dashboard',
                              status: 'SUCCESS'
                            });
                            await loadSheetData(token, spreadsheetId);
                          } catch (err) {
                            alert('Failed to insert log entry');
                          }
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-editorial-border hover:border-editorial-orange bg-black text-[#E0E0E0] text-[10px] font-mono transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-editorial-orange" />
                      Log Test Entry
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm("Disconnect spreadsheet? It will remain in Google Drive but will no longer be tracked in this session.")) {
                          setSpreadsheetId(null);
                          setSpreadsheetUrl(null);
                          localStorage.removeItem('logistics_spreadsheet_id');
                          localStorage.removeItem('logistics_spreadsheet_url');
                          setSheetRows([]);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-red-950 hover:border-red-500 bg-black text-red-400 hover:text-red-500 text-[10px] font-mono transition-all cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      Unlink
                    </button>
                  </div>
                </div>

                <div className="border border-editorial-border bg-[#020202]">
                  <div className="px-4 py-2 border-b border-editorial-border bg-black flex justify-between items-center">
                    <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">Live Sheet Rows (A2:D100)</span>
                    <span className="text-[9px] font-mono opacity-40">{sheetRows.length} rows loaded</span>
                  </div>

                  <div className="overflow-x-auto">
                    {isLoadingSheetData ? (
                      <div className="p-8 text-center text-[10px] font-mono opacity-50 animate-pulse">
                        Retrieving logs from Google Spreadsheet...
                      </div>
                    ) : sheetRows.length === 0 ? (
                      <div className="p-8 text-center text-[10px] font-mono opacity-50">
                        Spreadsheet is empty or headers-only. Book a slot or dispatch a test log to view spreadsheet records.
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-[10px] font-mono">
                        <thead>
                          <tr className="border-b border-editorial-border text-gray-500">
                            <th className="p-3">Timestamp</th>
                            <th className="p-3">Activity Type</th>
                            <th className="p-3">Details / Event</th>
                            <th className="p-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-editorial-border/40 text-[#E0E0E0]">
                          {sheetRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                              <td className="p-3 whitespace-nowrap opacity-70">{row[0]}</td>
                              <td className="p-3">
                                <span className={`px-1.5 py-0.5 border text-[9px] font-semibold uppercase tracking-wider ${
                                  row[1] === 'FITTING_BOOKING' ? 'text-editorial-orange border-editorial-orange/20 bg-editorial-orange/5' :
                                  row[1] === 'LOGISTICS_ESTIMATE' ? 'text-blue-400 border-blue-400/20 bg-blue-400/5' :
                                  row[1] === 'INITIALIZATION' ? 'text-purple-400 border-purple-400/20 bg-purple-400/5' :
                                  'text-gray-400 border-editorial-border bg-gray-400/5'
                                }`}>
                                  {row[1] || 'LOG_ENTRY'}
                                </span>
                              </td>
                              <td className="p-3 max-w-xs sm:max-w-md md:max-w-lg truncate">{row[2]}</td>
                              <td className="p-3 text-right">
                                <span className="text-green-400 font-bold uppercase text-[9px] tracking-wider">
                                  {row[3] || 'SUCCESS'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="bg-black border border-editorial-border p-4 mt-6">
         <div className="flex items-center justify-between mb-3">
           <h4 className="text-[11px] font-bold tracking-widest uppercase text-[#E0E0E0]">Example Integration Code (For Website B Devs)</h4>
           {user && (
             <button onClick={logout} className="text-[9px] uppercase tracking-widest opacity-50 hover:opacity-100 hover:text-editorial-orange font-mono underline">
               Disconnect Account
             </button>
           )}
         </div>
         <pre className="font-mono text-[10px] text-[#E0E0E0] overflow-x-auto bg-[#050505] p-4 border border-editorial-border">
{`// A2UI Wrapper - Intercepting Iframe Events
window.addEventListener('message', (event) => {
  // 1. Verify origin
  if (event.origin !== 'https://trusted-mcp-provider.com') return;

  // 2. Parse payload
  const data = event.data;
  
  if (data.type === 'A2UI_STATE_TRANSITION' && data.app === 'calendar') {
    const bookingSlot = data.payload.bookingSlot;
    
    // 3. Sync state back to Dealer Agent (Website A)
    fetch('https://api.website-a.com/a2a/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'sync_booking_state',
        params: { slot: bookingSlot, refId: 'ORD-XYZ' },
        id: crypto.randomUUID()
      })
    }).then(res => console.log('Dealer Agent Synced', res));
  }
});`}
         </pre>
      </section>
    </div>
  );
}

