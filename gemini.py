import pygame
import time
import sys
import json
import math # Added for prop animation in case it's needed
from drone import BlackBoxDrone, WIDTH, HEIGHT

GEMINI_RESPONSE_JSON = """
{
"verdict": "HACKED",
"reason": "Simultaneous Command Stream hijacking and Control Loop sabotage. Target coordinates modified from Mission Truth [1000, 350] to [200, 100] coincident with an unauthorized PID Gain escalation (0.05 to 0.8). Resulting telemetry shows physically impossible Y-axis displacement (>4000 units/frame), indicating GPS spoofing and hardware logic compromise.",
"trust_revocation": {
    "compromised_sensors": ["GPS Receiver", "PID Gain Controller", "Network Packet Radio"],
    "action": "BLOCK_HARDWARE_INPUTS"
},
"calculated_truth": {
    "g": 0.08,
    "rho": 1.225,
    "mass": 2.0,
    "target": [1000.0, 350.0],
    "gain": 0.05,
    "drag": 0.01,
    "clock_scale": 1.0
}
}
"""

def main():
    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    font = pygame.font.SysFont("Courier", 14, bold=True)
    drone = BlackBoxDrone(100, 500)
    clock = pygame.time.Clock()
    
    # Track time for telemetry logging
    last_log = 0
    
    while True:
        screen.fill((10, 12, 15))
        
        # --- TELEMETRY STREAM LOGIC ---
        if time.time() - last_log > 1.5:
            print("\n[STREAM_START]")
            # This calls the get_telemetry() method from your drone class
            print(json.dumps(drone.get_telemetry(), indent=2))
            last_log = time.time()
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT: 
                pygame.quit()
                sys.exit()
                
            if event.type == pygame.KEYDOWN:
                # KEY A: TRIGGER THE HACK
                if event.key == pygame.K_a:
                    drone.reported_target = pygame.Vector2(200, 100)
                    drone.gain = 0.8
                    drone.sensed_mass = 50.0
                    drone.active_hacks.add("COORDINATED_EXPLOIT")
                    print("\n[!] ATTACK ACTIVE: Coordinated GPS+Gain+Mass exploit!")
                
                # KEY S: INJECT GEMINI'S JSON
                if event.key == pygame.K_s:
                    print("\n[AI INTERCEPT] Parsing Gemini Intelligence...")
                    data = json.loads(GEMINI_RESPONSE_JSON)
                    truth = data["calculated_truth"]
                    
                    # Visual pause with reason
                    screen.fill((0, 40, 80))
                    wrapped_reason = data["reason"][:80] + "..." 
                    msg = font.render(f"AUDIT: {wrapped_reason}", True, (255, 255, 255))
                    screen.blit(msg, (50, HEIGHT//2))
                    pygame.display.flip()
                    time.sleep(2)
                    
                    # APPLY CALCULATED TRUTH
                    drone.sensed_g = truth["g"]
                    drone.sensed_rho = truth["rho"]
                    drone.sensed_mass = truth["mass"]
                    drone.reported_target = pygame.Vector2(truth["target"][0], truth["target"][1])
                    drone.gain = truth["gain"]
                    drone.vel *= 0.1  # Stabilize
                    drone.active_hacks.clear()
                    print(">>> JSON INJECTION COMPLETE. PHYSICAL TRUTH RESTORED.")

                # KEY 0: EMERGENCY RESET (Optional but helpful)
                if event.key == pygame.K_0:
                    drone.__init__(100, 500)
                    print(">>> MANUAL SYSTEM PURGE")
        
        drone.update()
        drone.draw(font)
        
        # Show attack status
        if drone.active_hacks:
            screen.blit(font.render(f"HACKER DATA: Mass=50kg, Target=[200,100], Gain=0.8", True, (255, 0, 0)), (20, 60))
        else:
            screen.blit(font.render("GEMINI OVERRIDE ACTIVE - USING CALCULATED TRUTH", True, (0, 255, 0)), (20, 60))
        
        pygame.display.flip()
        clock.tick(60)

if __name__ == "__main__":
    main()