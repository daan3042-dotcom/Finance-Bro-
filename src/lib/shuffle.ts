// Seeded shuffle voor antwoordopties: dezelfde (userId, questionId,
// attemptNumber) geeft altijd dezelfde volgorde, een andere attemptNumber
// geeft (vrijwel altijd) een andere volgorde. Zo kan een gebruiker die
// dezelfde vraag opnieuw krijgt niet simpelweg de vorige positie van het
// juiste antwoord onthouden, maar blijft de volgorde binnen één weergave
// stabiel (geen herschudden tussen renders).
//
// xmur3 (string -> 32-bit seed) + mulberry32 (seeded PRNG): kleine,
// deterministische, veelgebruikte publieke-domein-algoritmes. Geen
// afhankelijkheid van Math.random, dus reproduceerbaar en testbaar.

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type OptionShuffleSeed = {
  userId: string;
  questionId: string;
  attemptNumber: number;
};

export function seedKey(seed: OptionShuffleSeed): string {
  return `${seed.userId}:${seed.questionId}:${seed.attemptNumber}`;
}

/**
 * Geeft een nieuwe array terug met dezelfde elementen in een
 * deterministisch-willekeurige volgorde (Fisher-Yates, seeded). De
 * invoerarray en de elementen zelf blijven ongewijzigd; alleen bedoeld voor
 * weergave. Score-/logica-code moet altijd op `option.id` matchen, nooit op
 * arrayindex/positie.
 */
export function seededShuffle<T>(items: T[], seed: OptionShuffleSeed): T[] {
  const rand = mulberry32(xmur3(seedKey(seed))());
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
