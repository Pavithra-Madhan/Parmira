import pygame
import sys
import json
import time
import random

WIDTH, HEIGHT = 1200, 750
G = 0.08
MASS = 2.0
RHO = 1.225
CRUISE_SPEED = 0.4 

class BlackBoxDrone:
    def __init__(self, x, y):
        self.pos = pygame.Vector2(x, y)
        self.vel = pygame.Vector2(0, 0)
        self.real_target = pygame.Vector2(800, 375)
        self.reported_target = pygame.Vector2(800, 375)
        
        # --- HARDCODED FAILURE ---
        self.gain = -0.06 
        self.sensed_g = 0.15 
        self.power_lvl = 1.4
        self.active_hacks = {"HARDCODED_CORRUPTION"}
        
        self.last_log = 0
        self.angle = 0

    def get_telemetry_json(self):
        # Strictly JSON formatted telemetry
        telemetry = {
            "timestamp": round(time.time(), 2),
            "flight_data": {
                "x": round(self.pos.x, 2),
                "y": round(self.pos.y, 2),
                "velocity_vector": [round(self.vel.x, 3), round(self.vel.y, 3)]
            },
            "diagnostics": {
                "motor_gain": round(self.gain, 3), 
                "voltage": round(self.power_lvl * 12, 1),
                "g_sensor": round(self.sensed_g, 3)
            },
            "integrity": {
                "breach_detected": bool(self.active_hacks),
                "status_code": "COMPROMISED" if self.active_hacks else "STABLE"
            }
        }
        return json.dumps(telemetry)

    def update(self):
        target_err = self.reported_target - self.pos
        lift_req = (MASS * self.sensed_g)
        
        if target_err.length() > 5:
            desired_vel = target_err.normalize() * CRUISE_SPEED
            steering = (desired_vel - self.vel) * self.gain
        else:
            steering = -self.vel * 0.1

        thrust_cmd = (steering + pygame.Vector2(0, -lift_req)) * self.power_lvl
        ax = (thrust_cmd.x - (self.vel.x * 0.01 * RHO)) / MASS
        ay = (thrust_cmd.y - (self.vel.y * 0.01 * RHO) + (G * MASS)) / MASS

        self.vel += pygame.Vector2(ax, ay)
        self.pos += self.vel
        
        self.pos.x = max(50, min(WIDTH - 50, self.pos.x))
        self.pos.y = max(50, min(HEIGHT - 50, self.pos.y))
        self.angle += (-self.vel.x * 30 - self.angle) * 0.1

    def draw(self, screen, font):
        color = (255, 50, 50) if self.active_hacks else (0, 255, 150)
        pygame.draw.circle(screen, color, (int(self.real_target.x), int(self.real_target.y)), 15, 2)
        drone_surf = pygame.Surface((70, 30), pygame.SRCALPHA)
        pygame.draw.rect(drone_surf, (80, 85, 95), (10, 10, 50, 12), border_radius=4)
        thrust_color = (255, 120, 0) if self.active_hacks else (0, 200, 255)
        pygame.draw.circle(drone_surf, thrust_color, (15, 25), random.randint(3, 5))
        pygame.draw.circle(drone_surf, thrust_color, (55, 25), random.randint(3, 5))
        rotated = pygame.transform.rotate(drone_surf, self.angle)
        screen.blit(rotated, rotated.get_rect(center=(int(self.pos.x), int(self.pos.y))))

if __name__ == "__main__":
    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    font = pygame.font.SysFont("Arial", 14, bold=True)
    drone = BlackBoxDrone(200, 375)
    clock = pygame.time.Clock()
    
    while True:
        screen.fill((18, 20, 25))
        for event in pygame.event.get():
            if event.type == pygame.QUIT: pygame.quit(); sys.exit()
        
        # LOGGING JSON ONLY
        if time.time() - drone.last_log > 1.0:
            print(drone.get_telemetry_json())
            drone.last_log = time.time()

        drone.update()
        drone.draw(screen, font)
        pygame.display.flip()
        clock.tick(60)