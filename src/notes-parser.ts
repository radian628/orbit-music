const baseFreqs = {
  A: 440,
  B: 440 * Math.pow(2, 2 / 12),
  C: 440 * Math.pow(2, 3 / 12),
  D: 440 * Math.pow(2, 5 / 12),
  E: 440 * Math.pow(2, 7 / 12),
  F: 440 * Math.pow(2, 8 / 12),
  G: 440 * Math.pow(2, 10 / 12),
};

export function parseNotes(str: string) {
  return str.split(/\s+/g).map((s) =>
    s.split(/\&/g).flatMap((n) => {
      const parsedNote = n.match(/([A-G])([b#]*)(\d*)([+-]\d+)?/);
      if (!parsedNote) return [];
      const [_, baseNote, sharpsAndFlats, octave, bend] = parsedNote;
      let freq = baseFreqs[baseNote] as number;
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
