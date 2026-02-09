
export interface ForensicReport {
  verdict: "ANOMALY_DETECTED" | "NOMINAL_TRUTH";
  forensic_report: {
    failure_index: number;
    compromised_hardware: string[];
    physics_breach_summary: string;
  };
  simulation_reset_parameters: {
    spawn_at_pos: [number, number];
    injected_truth: {
      g: number;
      rho: number;
      mass: number;
      target: [number, number];
      gain: number;
    };
  };
  imagePrompt: string;
  pythonLogs: string[];
}
