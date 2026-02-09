# 🛸 Parmira

Parmira is an AI forensic tool designed to analyze hardware simulation failures. Instead of manually digging through telemetry logs to figure out why a drone crashed or a motor stalled, you feed the data to Parmira, and it uses Gemini 3 to find the exact point where the physics broke.
# 🛠 How it works

    Data Ingestion: Paste raw telemetry or execution logs from your simulation.

    The ReactLoop: Gemini runs an autonomous verification loop (10 iterations) to cross-reference telemetry with known physics constraints.

    Forensics & Fix: The app generates a visual graph (Red/Green for Error/Corrected) and a JSON patch to fix the underlying simulation code.

# Demo

Youtube link : https://youtu.be/YkfZffaEGOU

# 🚀 Setup

Clone the repo
https://github.com/Pavithra-Madhan/Parmira

# 🧠 Key Tech

    Gemini 3 API: Handles the multi-step reasoning and root-cause analysis.

    Pygame: Used for the drone flight visualization.

    ReactLoop Strategy: Ensures high accuracy by forcing the model to verify its own logic across multiple passes.

## Note:

The files fix.py and drone.py are for testing the prototype. 

