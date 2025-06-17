import { cloneBodies, GravitationalBody, runGravSim } from "./nbody";
import { playSound } from "./sound";

const canvas = document.getElementById("canvas")! as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resize();

window.addEventListener("resize", resize);

const bodies: GravitationalBody[] = [];

const mouseDownPos = {
  x: 0,
  y: 0,
};

const destPos = {
  x: 0,
  y: 0,
};

let mouseDown = false;

canvas.addEventListener("mousedown", (e) => {
  mouseDownPos.x = e.clientX;
  mouseDownPos.y = e.clientY;
  destPos.x = mouseDownPos.x;
  destPos.y = mouseDownPos.y;
  mouseDown = true;
});

canvas.addEventListener("mousemove", (e) => {
  destPos.x = e.clientX;
  destPos.y = e.clientY;
});

canvas.addEventListener("mouseup", (e) => {
  bodies.push(newObject());
  mouseDown = false;
});

function newObjectMass() {
  return Number(
    (document.getElementById("mass-input")! as HTMLInputElement).value
  );
}

function newObjectRadius() {
  return Number(
    (document.getElementById("radius-input")! as HTMLInputElement).value
  );
}

function newObjectFreq() {
  return Number(
    (document.getElementById("frequency-input")! as HTMLInputElement).value
  );
}

function newObjectSample() {
  return (document.getElementById("sample-input")! as HTMLSelectElement).value;
}

function newObject() {
  return {
    x: mouseDownPos.x - viewerX,
    y: mouseDownPos.y - viewerY,
    dx: destPos.x - mouseDownPos.x,
    dy: destPos.y - mouseDownPos.y,
    mass: newObjectMass(),
    radius: newObjectRadius(),
    freq: newObjectFreq(),
    sample: newObjectSample(),
  };
}

const TIMESTEP = 0.01;

function drawGravSim(
  ctx: CanvasRenderingContext2D,
  bodies: GravitationalBody[]
) {
  for (const b of bodies) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

let viewerX = 0;
let viewerY = 0;

function major(note: number) {
  const majorScale = [0, 2, 4, 5, 7, 9, 11];
  return majorScale[note % 7] + 12 * Math.floor(note / 7);
}

type Decoration = {
  x: number;
  y: number;
  radius: number;
  lifeLeft: number;
};

let decorations: Decoration[] = [];

function loop() {
  ctx.fillStyle = "#0001";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (bodies.length > 0) {
    let avgX = 0;
    let avgY = 0;
    let avgMass = 0;
    for (const b of bodies) {
      avgX += b.x * b.mass;
      avgY += b.y * b.mass;
      avgMass += b.mass;
    }
    avgX /= avgMass;
    avgY /= avgMass;
    const viewerXTarget = -avgX + window.innerWidth / 2;
    const viewerYTarget = -avgY + window.innerHeight / 2;

    viewerX = viewerX * 0.9 + viewerXTarget * 0.1;
    viewerY = viewerY * 0.9 + viewerYTarget * 0.1;
  }

  ctx.save();
  ctx.translate(viewerX, viewerY);

  const len = Math.hypot(
    mouseDownPos.x - destPos.x,
    mouseDownPos.y - destPos.y
  );

  if (mouseDown) {
    const projection = cloneBodies(bodies).concat([newObject()]);

    ctx.fillStyle = "#fff6";

    for (let i = 0; i < 100; i++) {
      for (let i = 0; i < 10; i++) {
        runGravSim(projection, TIMESTEP * 1);
      }
      drawGravSim(ctx, projection);
    }
  }

  for (let s = 0; s < 10; s++) {
    const nextstep = cloneBodies(bodies);
    runGravSim(nextstep, TIMESTEP);

    for (let i = 0; i < nextstep.length; i++) {
      if (Math.sign(nextstep[i].dy) !== Math.sign(bodies[i].dy)) {
        const freq = bodies[i].freq;
        const pitchChange = freq / 440;
        playSound(`dist/${bodies[i].sample}`, pitchChange);
        decorations.push({
          x: bodies[i].x,
          y: bodies[i].y,
          radius: bodies[i].radius,
          lifeLeft: 30,
        });
      }
    }

    runGravSim(bodies, TIMESTEP);
  }

  ctx.fillStyle = "white";
  drawGravSim(ctx, bodies);

  for (const d of decorations) {
    const sizeMul = (1 - d.lifeLeft / 30) * 2 + 1;
    ctx.globalAlpha = d.lifeLeft / 30;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.radius * sizeMul, 0, Math.PI * 2);
    ctx.fill();
    d.lifeLeft--;
  }

  decorations = decorations.filter((d) => d.lifeLeft > 0);

  ctx.restore();

  requestAnimationFrame(loop);
}

loop();
