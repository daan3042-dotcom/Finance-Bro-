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

## 2026-09-23

- Screening/plaatsingsflow toegevoegd voor de macro-module: gebruikers geven bij
  de start van een track hun voorkennis op (geen/enige/veel ervaring), krijgen
  een korte diagnosetoets van 12 vragen uit de bestaande vraagbank (gespreid
  over een nieuw `cognitive_level`-veld, 1-7, toegevoegd aan alle 112 vragen),
  en krijgen op basis daarvan een track-aanbeveling die ze altijd handmatig
  kunnen overrulen. Plaatsing schrijft weg in de bestaande `lesson_progress`
  (nieuwe kolom `placed_via_diagnostic` onderscheidt "echt gedaan" van
  "overgeslagen via de toets", migratie 0003) en `concept_progress` — geen
  nieuwe tabellen. Contentregel-scan (geen lesverwijzingen in vraagstammen)
  gedraaid over alle 112 vragen: 1 schending gevonden en gerapporteerd, niet
  automatisch herschreven (contentbeslissing voor Niels).
- Logboeksysteem opgezet: dit bestand plus een pre-commit hook die afdwingt
  dat elke functionele wijziging een logboekregel krijgt.
