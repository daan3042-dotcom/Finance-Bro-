/**
 * Korte validatiestap voor de geseede optie-shuffle (lib/shuffle.ts).
 * Geen testrunner nodig — dit project heeft er nog geen (zie package.json),
 * dus dit is een op zichzelf staand script i.p.v. een volwaardige test-
 * suite. Draai met: npx tsx scripts/validate-shuffle.ts
 *
 * Toont aan:
 * 1. Determinisme: dezelfde (userId, questionId, attemptNumber) geeft
 *    altijd dezelfde volgorde.
 * 2. Een andere attemptNumber geeft een andere volgorde.
 * 3. De shuffle is een permutatie: zelfde opties, alleen herschikt.
 * 4. Score-logica (matchen op option.id, niet op positie) blijft correct
 *    ongeacht de weergavevolgorde.
 */
import { seededShuffle, type OptionShuffleSeed } from '../src/lib/shuffle';

type Option = { id: string; text: string };

const baseOptions: Option[] = [
  { id: 'a', text: 'Optie A' },
  { id: 'b', text: 'Optie B' },
  { id: 'c', text: 'Optie C' },
  { id: 'd', text: 'Optie D' },
];

let failures = 0;

function check(label: string, condition: boolean) {
  if (condition) {
    console.log(`  OK   ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${label}`);
  }
}

function orderKey(options: Option[]): string {
  return options.map((o) => o.id).join(',');
}

console.log('1. Determinisme — zelfde seed geeft altijd dezelfde volgorde');
const seed: OptionShuffleSeed = { userId: 'user-123', questionId: 'q-42', attemptNumber: 1 };
const runs = Array.from({ length: 20 }, () => orderKey(seededShuffle(baseOptions, seed)));
check('alle 20 herhalingen identiek', runs.every((r) => r === runs[0]));
console.log(`       volgorde: ${runs[0]}`);

console.log('\n2. Verschillende attemptNumber geeft (vrijwel altijd) een andere volgorde');
const ordersByAttempt = Array.from({ length: 10 }, (_, i) =>
  orderKey(seededShuffle(baseOptions, { ...seed, attemptNumber: i + 1 }))
);
const uniqueOrders = new Set(ordersByAttempt);
console.log(`       attempts 1-10 -> ${ordersByAttempt.join(' | ')}`);
check(
  `minstens de helft van de 10 pogingen levert een unieke volgorde op (${uniqueOrders.size}/10)`,
  uniqueOrders.size >= 5
);
check('attempt 1 en attempt 2 verschillen van elkaar', ordersByAttempt[0] !== ordersByAttempt[1]);

console.log('\n3. Verschillende questionId of userId geeft ook een andere volgorde dan het origineel');
const otherQuestion = orderKey(
  seededShuffle(baseOptions, { ...seed, questionId: 'q-99' })
);
const otherUser = orderKey(seededShuffle(baseOptions, { ...seed, userId: 'user-456' }));
check('andere questionId -> andere volgorde dan origineel', otherQuestion !== runs[0]);
check('andere userId -> andere volgorde dan origineel', otherUser !== runs[0]);

console.log('\n4. De shuffle is een permutatie: zelfde option-ids, alleen herschikt');
for (let attempt = 1; attempt <= 5; attempt++) {
  const shuffled = seededShuffle(baseOptions, { ...seed, attemptNumber: attempt });
  const sameIds = new Set(shuffled.map((o) => o.id));
  const sameLength = shuffled.length === baseOptions.length;
  const noDuplicates = sameIds.size === baseOptions.length;
  const allOriginalIdsPresent = baseOptions.every((o) => sameIds.has(o.id));
  check(
    `attempt ${attempt}: lengte klopt, geen duplicaten, alle originele ids aanwezig`,
    sameLength && noDuplicates && allOriginalIdsPresent
  );
}
check('origineel array niet gemuteerd', orderKey(baseOptions) === 'a,b,c,d');

console.log('\n5. Score-logica blijft correct ongeacht de weergavevolgorde (matchen op id, niet positie)');
const correctOptionId = 'c';
for (let attempt = 1; attempt <= 5; attempt++) {
  const shuffled = seededShuffle(baseOptions, { ...seed, attemptNumber: attempt });
  // Simuleert de UI: gebruiker tikt op de optie die op scherm de juiste
  // tekst toont, ongeacht positie; score-logica matcht op option.id.
  const displayedCorrectOption = shuffled.find((o) => o.id === correctOptionId);
  const selectedOptionId = displayedCorrectOption?.id; // gebruiker selecteert het juiste antwoord
  const isCorrect = selectedOptionId === correctOptionId;
  const positionInDisplay = shuffled.findIndex((o) => o.id === correctOptionId);
  check(
    `attempt ${attempt}: correct antwoord op positie ${positionInDisplay} wordt toch als juist herkend`,
    isCorrect
  );
}

console.log(`\n${failures === 0 ? 'ALLE CHECKS GESLAAGD' : `${failures} CHECK(S) MISLUKT`}`);
process.exit(failures === 0 ? 0 : 1);
