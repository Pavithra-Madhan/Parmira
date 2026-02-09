
import { GoogleGenAI, Type } from "@google/genai";
import { ForensicReport } from "./types";

export async function runForensicAudit(logsJson: string): Promise<{report: ForensicReport, plotUrl?: string}> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const systemInstruction = `You are the Lead Forensic Analyst for the Parmira Digital Twin Universe.
You have God-Mode awareness of the fundamental constants of this reality.

THE PARMIRA UNIVERSE CONSTANTS:
- sensed_g: 0.08
- sensed_rho: 1.225
- sensed_mass: 2.0
- gain: 0.05
- voltage: 12.0V
- imu_bias: [0.0, 0.0]
- target: [800.0, 375.0]

FORENSIC PROTOCOL:
1. ANY deviation from these values is a "Physics Breach."
2. Use Python Code Execution to plot the telemetry data (velocity, position, voltage).
3. The script MUST highlight the "Breach Point" visually using Matplotlib.
4. If the plot doesn't clearly show the anomaly, RE-RUN the script with adjusted scales (up to 10 attempts).
5. Identify the hardware failure based on variable correlation (e.g., gain flip = logic board inversion).
6. Provide a simulation bridge JSON to restore truth at the point of breach.

STRICT BOUNDARY: Do NOT mention external factors like wind, friction, or external interference. Only reference Parmira variables.

Output MUST be a JSON object conforming to the required schema.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze these Parmira telemetry logs: ${logsJson}`,
    config: {
      systemInstruction,
      tools: [{ codeExecution: {} }],
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 24000 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          verdict: { type: Type.STRING, enum: ["ANOMALY_DETECTED", "NOMINAL_TRUTH"] },
          forensic_report: {
            type: Type.OBJECT,
            properties: {
              failure_index: { type: Type.INTEGER },
              compromised_hardware: { type: Type.ARRAY, items: { type: Type.STRING } },
              physics_breach_summary: { type: Type.STRING }
            },
            required: ["failure_index", "compromised_hardware", "physics_breach_summary"]
          },
          simulation_reset_parameters: {
            type: Type.OBJECT,
            properties: {
              spawn_at_pos: { type: Type.ARRAY, items: { type: Type.NUMBER }, minItems: 2, maxItems: 2 },
              injected_truth: {
                type: Type.OBJECT,
                properties: {
                  g: { type: Type.NUMBER },
                  rho: { type: Type.NUMBER },
                  mass: { type: Type.NUMBER },
                  target: { type: Type.ARRAY, items: { type: Type.NUMBER }, minItems: 2, maxItems: 2 },
                  gain: { type: Type.NUMBER }
                },
                required: ["g", "rho", "mass", "target", "gain"]
              }
            },
            required: ["spawn_at_pos", "injected_truth"]
          },
          imagePrompt: { type: Type.STRING },
          pythonLogs: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["verdict", "forensic_report", "simulation_reset_parameters", "imagePrompt", "pythonLogs"]
      }
    }
  });

  let report: ForensicReport | null = null;
  let plotUrl: string | undefined = undefined;

  for (const candidate of response.candidates || []) {
    for (const part of candidate.content.parts) {
      if (part.text) {
        try {
          if (part.text.trim().startsWith('{')) {
            report = JSON.parse(part.text);
          }
        } catch (e) { /* skip partial parse */ }
      }
      if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
        plotUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  }

  if (!report) {
    try {
      report = JSON.parse(response.text || "{}");
    } catch (e) {
      throw new Error("Dossier corruption: Failed to decode forensic analysis output.");
    }
  }

  return { report, plotUrl };
}

export async function generateForensicImage(prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: prompt,
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Visual evidence generation failed.");
}
