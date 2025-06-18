(() => {
  // src/nbody.ts
  function cloneBodies(bodies2) {
    return bodies2.map((b) => ({ ...b }));
  }
  function runGravSim(bodies2, timestep) {
    const newBodies = [];
    for (const b1 of bodies2) {
      let accelX = 0;
      let accelY = 0;
      for (const b2 of bodies2) {
        if (b1 === b2) continue;
        const distSquared = (b1.x - b2.x) ** 2 + (b1.y - b2.y) ** 2;
        const accelMagnitude = distSquared > (b1.radius + b2.radius) ** 2 ? b2.mass / distSquared ** 1.5 : 0;
        accelX += (b2.x - b1.x) * accelMagnitude;
        accelY += (b2.y - b1.y) * accelMagnitude;
      }
      b1.dx += accelX * timestep;
      b1.dy += accelY * timestep;
      b1.x += b1.dx * timestep;
      b1.y += b1.dy * timestep;
    }
  }

  // src/notes-parser.ts
  var baseFreqs = {
    A: 440,
    B: 440 * Math.pow(2, 2 / 12),
    C: 440 * Math.pow(2, 3 / 12),
    D: 440 * Math.pow(2, 5 / 12),
    E: 440 * Math.pow(2, 7 / 12),
    F: 440 * Math.pow(2, 8 / 12),
    G: 440 * Math.pow(2, 10 / 12)
  };
  function parseNotes(str) {
    return str.split(/\s+/g).map(
      (s) => s.split(/\&/g).flatMap((n) => {
        const parsedNote = n.match(/([A-G])([b#]*)(\d*)([+-]\d+)?/);
        if (!parsedNote) return [];
        const [_, baseNote, sharpsAndFlats, octave, bend] = parsedNote;
        let freq = baseFreqs[baseNote];
        for (const c of sharpsAndFlats ?? "") {
          if (c === "#") {
            freq *= Math.pow(2, 1 / 12);
          } else {
            freq *= Math.pow(2, -1 / 12);
          }
        }
        freq *= Math.pow(2, (octave ? Number(octave) : 4) - 4);
        freq *= Math.pow(2, Number(bend ?? 0) / 1200);
        console.log(freq, baseNote, sharpsAndFlats, octave, bend);
        return [freq];
      })
    );
  }

  // src/sound.ts
  var ac = new AudioContext();
  var soundCache = /* @__PURE__ */ new Map();
  async function fetchAudio(url) {
    let audio = soundCache.get(url);
    if (!audio) {
      const file = await fetch(url);
      const buf = await file.arrayBuffer();
      audio = await ac.decodeAudioData(buf);
      soundCache.set(url, audio);
    }
    return audio;
  }
  async function createSoundWithPitchAndGain(audio, pitch, gain) {
    const track = new AudioBufferSourceNode(ac, {
      buffer: audio,
      playbackRate: pitch
    });
    const gainNode = new GainNode(ac, {
      gain: gain ?? 1
    });
    track.connect(gainNode);
    gainNode.connect(ac.destination);
    return track;
  }
  async function playSound(url, pitch, gain) {
    const track = await createSoundWithPitchAndGain(
      await fetchAudio(url),
      pitch,
      gain
    );
    track.start();
    return track;
  }

  // src/index.ts
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);
  var bodies = [];
  var mouseDownPos = {
    x: 0,
    y: 0
  };
  var destPos = {
    x: 0,
    y: 0
  };
  var mouseDown = false;
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
      document.getElementById("mass-input").value
    );
  }
  function newObjectRadius() {
    return Number(
      document.getElementById("radius-input").value
    );
  }
  function newObjectFreq() {
    return document.getElementById("frequency-input").value;
  }
  function newObjectSample() {
    return document.getElementById("sample-input").value;
  }
  function newObject() {
    return {
      x: mouseDownPos.x - viewerX,
      y: mouseDownPos.y - viewerY,
      dx: destPos.x - mouseDownPos.x,
      dy: destPos.y - mouseDownPos.y,
      mass: newObjectMass(),
      radius: newObjectRadius(),
      freq: parseNotes(newObjectFreq()),
      sample: newObjectSample(),
      noteIndex: 0
    };
  }
  var TIMESTEP = 0.01;
  function drawGravSim(ctx2, bodies2) {
    for (const b of bodies2) {
      ctx2.beginPath();
      ctx2.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx2.fill();
    }
  }
  var viewerX = 0;
  var viewerY = 0;
  var decorations = [];
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
        for (let i2 = 0; i2 < 10; i2++) {
          runGravSim(projection, TIMESTEP * 1);
        }
        drawGravSim(ctx, projection);
      }
    }
    for (let s = 0; s < 10; s++) {
      const nextstep = cloneBodies(bodies);
      runGravSim(nextstep, TIMESTEP);
      for (let i = 0; i < nextstep.length; i++) {
        if (Math.sign(nextstep[i].dy) !== Math.sign(bodies[i].dy) && bodies[i].freq.length > 0) {
          const chord = bodies[i].freq[bodies[i].noteIndex];
          for (const f of chord) {
            console.log(f);
            const pitchChange = f / 440;
            playSound(`dist/${bodies[i].sample}`, pitchChange);
          }
          bodies[i].noteIndex = (bodies[i].noteIndex + 1) % bodies[i].freq.length;
          decorations.push({
            x: bodies[i].x,
            y: bodies[i].y,
            radius: bodies[i].radius,
            lifeLeft: 30
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
})();
