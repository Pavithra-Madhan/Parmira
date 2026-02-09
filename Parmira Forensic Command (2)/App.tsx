
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { runForensicAudit, generateForensicImage } from './geminiService';
import { ForensicReport } from './types';

const SAMPLE_TELEMETRY = `[
  {"index": 0, "pos": [100, 100], "sensed_g": 0.08, "voltage": 12.0, "gain": 0.05, "vel": 10},
  {"index": 1, "pos": [110, 105], "sensed_g": 0.08, "voltage": 11.9, "gain": 0.05, "vel": 12},
  {"index": 2, "pos": [125, 115], "sensed_g": 0.15, "voltage": 8.4, "gain": -0.05, "vel": 45},
  {"index": 3, "pos": [140, 90], "sensed_g": 0.22, "voltage": 4.2, "gain": -0.05, "vel": 88}
]`;

const App: React.FC = () => {
  const [logs, setLogs] = useState(SAMPLE_TELEMETRY);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<ForensicReport | null>(null);
  const [plotUrl, setPlotUrl] = useState<string | null>(null);
  const [reconstructionUrl, setReconstructionUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("SYSTEM_IDLE");

  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [report, isAnalyzing]);

  const initiateAudit = useCallback(async () => {
    if (!logs.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setReport(null);
    setPlotUrl(null);
    setReconstructionUrl(null);
    setStatus("INITIATING_AUDIT");

    try {
      setStatus("EXECUTING_PYTHON_DIAGNOSTICS");
      const { report: forensicData, plotUrl: plot } = await runForensicAudit(logs);
      setReport(forensicData);
      if (plot) setPlotUrl(plot);

      setStatus("GENERATING_MULTIMODAL_EVIDENCE");
      if (forensicData.imagePrompt) {
        const image = await generateForensicImage(forensicData.imagePrompt);
        setReconstructionUrl(image);
      }
      setStatus("AUDIT_COMPLETE");
    } catch (err: any) {
      setError(err.message || "Forensic runtime exception.");
      setStatus("SYSTEM_ERROR");
    } finally {
      setIsAnalyzing(false);
    }
  }, [logs]);

  return (
    <div className="relative min-h-screen bg-[#020617] text-[#94a3b8] p-4 lg:p-8 flex flex-col gap-6">
      <div className="scanline" />
      
      {/* Header HUD */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-sky-500/50 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-sky-400 italic">
            PARMIRA <span className="text-white not-italic">FORENSIC COMMAND</span>
          </h1>
          <p className="text-[10px] mono text-sky-800 mt-1 uppercase tracking-widest">
            Deep-Scan Digital Twin Protocol // God-Mode Logic: Active
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-1 mt-4 md:mt-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold">SYSTEM INTEGRITY:</span>
            <span className={`text-xs font-black mono blinking ${report?.verdict === 'ANOMALY_DETECTED' ? 'text-red-500' : 'text-emerald-500'}`}>
              {status}
            </span>
          </div>
          <div className="w-48 h-1 bg-sky-950 rounded-full overflow-hidden">
             <div className="h-full bg-sky-500 transition-all duration-1000" style={{ width: isAnalyzing ? '75%' : report ? '100%' : '10%' }} />
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow">
        {/* Left: Input Console */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <section className="bg-slate-900/50 border border-sky-900/50 p-4 flex flex-col cyber-glow h-[350px]">
            <div className="flex justify-between items-center mb-2 border-b border-sky-900/30 pb-1">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-sky-500">
                [ Blackbox_Telemetry_Input ]
              </h2>
            </div>
            <textarea
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
              className="flex-grow bg-black/40 p-3 mono text-[11px] text-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-500/30 resize-none border border-sky-900/20"
              placeholder="Paste raw log data..."
            />
            <button
              onClick={initiateAudit}
              disabled={isAnalyzing}
              className={`mt-4 py-4 font-black text-sm tracking-widest uppercase border-2 transition-all ${
                isAnalyzing ? 'border-amber-500 text-amber-500' : 'border-sky-500 text-sky-500 hover:bg-sky-500 hover:text-black'
              }`}
            >
              {isAnalyzing ? 'AUDITING...' : 'INITIATE DEEP AUDIT'}
            </button>
          </section>

          {/* Python Execution Trace */}
          <section className="bg-slate-900/50 border border-sky-900/50 p-4 flex flex-col flex-grow">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-sky-500 mb-2">
              [ Python_Diagnostics_Log ]
            </h2>
            <div ref={terminalRef} className="flex-grow bg-black/60 p-3 mono text-[10px] text-sky-700 overflow-y-auto dossier-scroll">
               {isAnalyzing && <p className="animate-pulse">>> ACCESSING REASONING_ENGINE...</p>}
               {report?.pythonLogs.map((log, idx) => (
                 <p key={idx} className="mb-1 leading-tight">{`>> ${log}`}</p>
               ))}
               {!report && !isAnalyzing && <p className="opacity-20 italic">Awaiting telemetry uplink...</p>}
            </div>
          </section>
        </div>

        {/* Center/Right: Visual & Dossier */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
            
            {/* Visual Evidence Viewport */}
            <section className="bg-slate-900/50 border border-sky-900/50 p-4 flex flex-col">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-sky-500 mb-4 flex justify-between">
                <span>[ Scientific_Reconstruction ]</span>
                {plotUrl && <span className="text-[8px] text-sky-800">MATPLOTLIB_V3</span>}
              </h2>
              <div className="flex-grow relative bg-black/50 border border-sky-900/20 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-hidden flex items-center justify-center p-2">
                   {plotUrl ? (
                     <img src={plotUrl} alt="Diagnostics Plot" className="max-h-full max-w-full object-contain" />
                   ) : reconstructionUrl ? (
                     <img src={reconstructionUrl} alt="3D Reconstruction" className="max-h-full max-w-full object-cover" />
                   ) : (
                     <div className="text-center opacity-10">
                       <p className="text-[10px]">AWAITING VISUAL RENDER</p>
                     </div>
                   )}
                </div>
                {reconstructionUrl && plotUrl && (
                  <div className="h-1/3 border-t border-sky-900/30 overflow-hidden">
                    <img src={reconstructionUrl} alt="Nano Banana Reconstruction" className="h-full w-full object-cover opacity-60 hover:opacity-100 transition-opacity" />
                  </div>
                )}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent animate-spin rounded-full" />
                      <span className="text-[10px] mono text-sky-500 uppercase tracking-widest animate-pulse">Processing Evidence</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Forensic Dossier */}
            <section className="bg-slate-900/50 border border-sky-900/50 p-4 flex flex-col h-[500px] md:h-auto">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-sky-500 mb-4">
                [ Forensic_Dossier_Final ]
              </h2>
              <div className="flex-grow overflow-y-auto dossier-scroll space-y-4">
                {report ? (
                  <>
                    <div className={`p-3 border ${report.verdict === 'ANOMALY_DETECTED' ? 'border-red-500/50 bg-red-950/20' : 'border-emerald-500/50 bg-emerald-950/20'}`}>
                      <p className={`font-black uppercase text-xs ${report.verdict === 'ANOMALY_DETECTED' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {report.verdict}
                      </p>
                      <p className="text-[11px] text-slate-300 mt-2 italic leading-relaxed">
                        {report.forensic_report.physics_breach_summary}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                       <div className="bg-sky-950/20 p-2 border border-sky-900/30">
                         <p className="text-sky-700 font-bold mb-1">FAILURE_INDEX</p>
                         <p className="text-white font-black">{report.forensic_report.failure_index}</p>
                       </div>
                       <div className="bg-sky-950/20 p-2 border border-sky-900/30">
                         <p className="text-sky-700 font-bold mb-1">SUSPECTED_HARDWARE</p>
                         <p className="text-red-400 font-black">{report.forensic_report.compromised_hardware.join(', ')}</p>
                       </div>
                    </div>

                    <div className="bg-black/60 p-3 border border-sky-900/30">
                      <p className="text-[10px] text-sky-700 font-bold uppercase tracking-widest mb-2 border-b border-sky-900/30 pb-1">
                        Simulation_Bridge_Override
                      </p>
                      <pre className="text-[10px] text-sky-400 whitespace-pre-wrap leading-tight">
                        {JSON.stringify(report.simulation_reset_parameters, null, 2)}
                      </pre>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center opacity-10 italic text-[10px] text-center">
                    NO ACTIVE REPORT TRACES FOUND IN BUFFER
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* Footer System Branding */}
      <footer className="mt-auto pt-4 border-t border-sky-900/30 flex justify-between items-center opacity-20 text-[9px] mono uppercase tracking-widest">
        <div>Parmira_Core_v4.2 // Logic_Engine: G3_Flash</div>
        <div className="hidden md:block">Security Protocol: High-Sec Encryption Active</div>
        <div>Timestamp: {new Date().toISOString()}</div>
      </footer>

      {/* Global Error Banner */}
      {error && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-red-950 border-2 border-red-500 p-4 z-50 shadow-2xl animate-bounce max-w-lg w-full">
           <div className="flex items-center gap-4">
             <span className="text-2xl font-black text-red-500">!</span>
             <p className="text-xs text-red-200 mono">{error}</p>
             <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-white">✕</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
