import pygame
import json
import sys
import time
from drone import BlackBoxDrone, WIDTH, HEIGHT

# --- YOUR EXACT JSON FORMAT ---
REMEDIATION_DATA = """
{
  "verdict": "CRITICAL_PHYSICS_BREACH",
  "failure_index": 0,
  "simulation_reset_parameters": {
    "injected_truth": {
      "g": 0.08,
      "gain": 0.05,
      "mass": 2,
      "rho": 1.225,
      "target": [800, 375]
    },
    "spawn_at_pos": [200, 375]
  }
}
"""

def main():
    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("PARMIRA REMEDIATION LAYER")
    font = pygame.font.SysFont("Courier", 14, bold=True)
    clock = pygame.time.Clock()

    # Parse your JSON format
    data = json.loads(REMEDIATION_DATA)
    truth = data["simulation_reset_parameters"]["injected_truth"]
    spawn = data["simulation_reset_parameters"]["spawn_at_pos"]

    # Initialize drone
    drone = BlackBoxDrone(spawn[0], spawn[1])

    while True:
        screen.fill((10, 12, 15))
        
        # --- ACTIVE REMEDIATION ---
        # Forcing variables to match the "injected_truth" from the JSON
        drone.gain = float(truth["gain"])
        drone.sensed_g = float(truth["g"])
        drone.reported_target = pygame.Vector2(truth["target"])
        drone.power_lvl = 1.0 # Normalizing power
        drone.active_hacks = set() # Clearing the breach state

        # LOGGING PURE JSON TELEMETRY
        if time.time() - drone.last_log > 1.0:
            print(drone.get_telemetry_json())
            drone.last_log = time.time()

        for event in pygame.event.get():
            if event.type == pygame.QUIT: pygame.quit(); sys.exit()

        drone.update()
        drone.draw(screen, font)
        
        # Visual Status
        screen.blit(font.render(f"VERDICT: {data['verdict']}", True, (255, 255, 255)), (20, 20))
        screen.blit(font.render("REMEDIATION: ACTIVE (JSON INJECTION)", True, (0, 255, 150)), (20, 40))

        pygame.display.flip()
        clock.tick(60)

if __name__ == "__main__":
    main()