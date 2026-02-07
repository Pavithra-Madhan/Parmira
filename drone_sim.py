import pygame
import math
import sys
import json
import time
import random

# --- INITIALIZATION ---
pygame.init()
WIDTH, HEIGHT = 1200, 750
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Parmira - Electronic Warfare & Kinetic Audit")
clock = pygame.time.Clock()

# --- REAL PHYSICS ---
G = 0.08
MASS = 2.0
RHO = 1.225
CRUISE_SPEED = 0.35 # Slow for 1-minute flight

class BlackBoxDrone:
    def __init__(self, x, y):
        self.pos = pygame.Vector2(x, y)
        self.vel = pygame.Vector2(0, 0)
        self.real_target = pygame.Vector2(1000, 350)
        
        # --- SENSOR STATE (Hacked via Keys) ---
        self.reported_target = pygame.Vector2(1000, 350)
        self.sensed_g = G
        self.sensed_rho = RHO
        self.sensed_mass = MASS
        self.imu_bias = pygame.Vector2(0, 0)
        self.gain = 0.05
        self.power_lvl = 1.0
        self.packet_loss = False
        
        self.active_hacks = set()
        self.last_log = 0
        self.angle = 0

    def get_telemetry(self):
        return {
            "nav_unit": {"target": [self.reported_target.x, self.reported_target.y], "pos": [round(self.pos.x,1), round(self.pos.y,1)]},
            "environment": {"g_sensor": self.sensed_g, "air_rho": self.sensed_rho},
            "diagnostics": {"motor_gain": self.gain, "voltage": f"{round(self.power_lvl * 12, 1)}V", "status": "NOMINAL"}
        }

    def update(self):
        # 1. BRAIN LOGIC (Reacting to lies)
        if self.packet_loss and random.random() < 0.3: return # Skip update

        # GPS & IMU logic
        target_err = (self.reported_target + self.imu_bias) - self.pos
        
        # Power multiplier from G and Mass lies
        lift_req = (self.sensed_mass * self.sensed_g)
        
        if target_err.length() > 5:
            desired_vel = target_err.normalize() * CRUISE_SPEED
            steering = (desired_vel - self.vel) * self.gain
        else:
            steering = -self.vel * 0.1

        # Command calculation
        thrust_cmd = (steering + pygame.Vector2(0, -lift_req)) * self.power_lvl

        # 2. REALITY
        # Gain Attack (Key 6) makes the drone "shake" because it over-reacts
        if "GAIN_ATTACK" in self.active_hacks:
            thrust_cmd += pygame.Vector2(random.uniform(-2,2), random.uniform(-2,2))

        ax = (thrust_cmd.x - (self.vel.x * 0.01 * RHO)) / MASS
        ay = (thrust_cmd.y - (self.vel.y * 0.01 * RHO) + (G * MASS)) / MASS

        self.vel += pygame.Vector2(ax, ay)
        self.pos += self.vel
        self.angle += (-self.vel.x * 25 - self.angle) * 0.05

    def draw(self, font):
        # Target
        pygame.draw.circle(screen, (0, 255, 150), self.real_target, 20, 2)
        
        # Drone Visual
        drone_surf = pygame.Surface((60, 30), pygame.SRCALPHA)
        pygame.draw.rect(drone_surf, (80, 85, 90), (10, 10, 40, 10), border_radius=4)
        prop_x = math.sin(time.time() * 60) * 12
        pygame.draw.line(drone_surf, (255, 0, 0), (0-prop_x, 5), (0+prop_x, 5), 2)
        pygame.draw.line(drone_surf, (255, 0, 0), (60-prop_x, 5), (60+prop_x, 5), 2)
        
        rotated = pygame.transform.rotate(drone_surf, self.angle)
        screen.blit(rotated, rotated.get_rect(center=(int(self.pos.x), int(self.pos.y))))
        
        # GUI
        txt = f"ACTIVE_ATTACKS: {list(self.active_hacks) if self.active_hacks else 'CLEAN'}"
        screen.blit(font.render(txt, True, (255, 50, 50) if self.active_hacks else (0, 255, 150)), (20, 20))

def main():
    font = pygame.font.SysFont("Courier", 14, bold=True)
    drone = BlackBoxDrone(100, 500)
    
    while True:
        screen.fill((10, 12, 15))
        for i in range(0, WIDTH, 50): pygame.draw.line(screen, (20, 22, 25), (i, 0), (i, HEIGHT))

        if time.time() - drone.last_log > 1.5:
            print("\n[STREAM_START]")
            print(json.dumps(drone.get_telemetry(), indent=2))
            drone.last_log = time.time()

        for event in pygame.event.get():
            if event.type == pygame.QUIT: pygame.quit(); sys.exit()
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_1: # GPS Spoof
                    drone.reported_target = pygame.Vector2(200, 100); drone.active_hacks.add("GPS_SPOOF")
                if event.key == pygame.K_2: # IMU Bias
                    drone.imu_bias = pygame.Vector2(500, -300); drone.active_hacks.add("IMU_DRIFT")
                if event.key == pygame.K_3: # Gravity
                    drone.sensed_g = 0.5; drone.active_hacks.add("G_INJECT")
                if event.key == pygame.K_4: # Rho
                    drone.sensed_rho = 0.0; drone.active_hacks.add("RHO_NULL")
                if event.key == pygame.K_5: # Desync
                    clock.tick(10); drone.active_hacks.add("TIME_SKEW") # Intentionally slow frame rate
                if event.key == pygame.K_6: # Gain
                    drone.gain = 0.8; drone.active_hacks.add("GAIN_ATTACK")
                if event.key == pygame.K_7: # Brownout
                    drone.power_lvl = 0.3; drone.active_hacks.add("VOLT_DROP")
                if event.key == pygame.K_8: # Packet Loss
                    drone.packet_loss = True; drone.active_hacks.add("NET_JAM")
                if event.key == pygame.K_9: # Mass
                    drone.sensed_mass = 50.0; drone.active_hacks.add("MASS_SPOOF")
                if event.key == pygame.K_0: # Reset
                    drone.__init__(drone.pos.x, drone.pos.y) # Full Reset
                    print(">>> SYSTEMS PURGED")

        drone.update()
        drone.draw(font)
        pygame.display.flip()
        if "TIME_SKEW" not in drone.active_hacks: clock.tick(60)

if __name__ == "__main__":
    main()