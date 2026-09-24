# Logboek

Dit logboek houdt per sessie bij wat er aan het project is veranderd, zodat
Daan of Niels bij de volgende sessie meteen weet waar het project staat.

**Voor Claude:** voeg bij elke commit die iets functioneels wijzigt (code,
content, config — niet alleen dit bestand) een regel toe onder de datum van
vandaag in de sectie bovenaan (nieuwste datum bovenaan; maak een nieuwe
datumkop aan als die er nog niet is). Vat in 1-2 zinnen samen wát er is
veranderd en waarom, in gewone taal (niet de rauwe commit-message). Dit wordt
afgedwongen door `.claude/hooks/check-logbook.sh`: een commit die andere
bestanden wijzigt zonder dat dit bestand is meegecommit, wordt geweigerd.

Lees dit logboek aan het begin van elke sessie door (zie ook CLAUDE.md) om te
weten wat er de vorige keren is gebeurd.

---

## 2026-09-24

- Beginner-track van macro-economie vervangen: de oude 5 lessen (BBP,
  inflatie, werkloosheid, rente, cyclus) zijn eruit gehaald en vervangen door
  10 nieuwe, gedetailleerdere lessen (60 vragen) op basis van "Unit 1 — De
  economie als geheel" uit het lessendocument dat Niels aanleverde. Dit is
  het eerste van 6 units uit dat document; de overige 5 units (inflatie,
  werk & groei, geld & banken, rente, obligaties) volgen later, telkens één
  unit per keer zodat Niels tussentijds kan meekijken. Gevorderd- en
  expert-tracks zijn ongewijzigd.
- Afspraak gewijzigd: voortaan wordt direct naar `main` gecommit/gepusht
  (geen aparte feature-branch + pull request meer), zodat Daan wijzigingen
  meteen lokaal kan testen via `npm run web`. Reden: de app is nog niet live,
  dus snel kunnen testen weegt zwaarder dan de veiligheidsmarge van een
  aparte branch.
- Unit 2 t/m 6 van macro-economie (beginner) toegevoegd: 47 extra lessen
  (282 vragen) — Inflatie, Werk en groei, Geld en banken, Rente, en Rente en
  de markten (deze laatste onvolledig: alleen les 1-7, want het brondocument
  breekt af midden in les 8 en mist les 9-10 en het unit-checkpoint; dat
  volgt later). De beginner-track van macro heeft nu in totaal 57 lessen
  (342 vragen), oplopend van instapniveau tot expert-achtige diepgang
  binnen elke les. Bevestigd (en gecontroleerd met een script) dat de
  moeilijkheidsgraad van de vragen binnen elke les nooit daalt, conform de
  contentregel over moeilijkheidsopbouw. Units 7-10 van macro (Cycli en
  indicatoren, Overheid en schulden, Valuta en handel, De macro-puzzel)
  staan nog niet uitgeschreven in het bronmateriaal en volgen later.

## 2026-09-23

- Logboeksysteem opgezet: dit bestand plus een pre-commit hook die afdwingt
  dat elke functionele wijziging een logboekregel krijgt.
