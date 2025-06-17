export type GravitationalBody = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  mass: number;
  radius: number;
  freq: number;
};

export function cloneBodies(bodies: GravitationalBody[]): GravitationalBody[] {
  return bodies.map((b) => ({ ...b }));
}

export function runGravSim(
  bodies: GravitationalBody[],
  timestep: number
): void {
  const newBodies: GravitationalBody[] = [];
  for (const b1 of bodies) {
    let accelX = 0;
    let accelY = 0;
    for (const b2 of bodies) {
      if (b1 === b2) continue;
      const distSquared = (b1.x - b2.x) ** 2 + (b1.y - b2.y) ** 2;
      const accelMagnitude =
        distSquared > (b1.radius + b2.radius) ** 2
          ? b2.mass / distSquared ** 1.5
          : 0;
      accelX += (b2.x - b1.x) * accelMagnitude;
      accelY += (b2.y - b1.y) * accelMagnitude;
    }
    b1.dx += accelX * timestep;
    b1.dy += accelY * timestep;
    b1.x += b1.dx * timestep;
    b1.y += b1.dy * timestep;
  }
}
