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

## 2026-09-23

- Logboeksysteem opgezet: dit bestand plus een pre-commit hook die afdwingt
  dat elke functionele wijziging een logboekregel krijgt.
