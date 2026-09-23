@AGENTS.md

## Committen en pushen

Commit en push automatisch naar GitHub zodra een gevraagde wijziging succesvol werkt en getest is, zonder dat daar apart om gevraagd hoeft te worden. Gebruik per keer een duidelijke, beschrijvende commit-message. Als een wijziging nog niet werkt of nog getest moet worden, wacht dan met committen tot dit bevestigd is.

## Projectkader

Lees docs/project-instructions.md en docs/filosofie.md bij aanvang van elke sessie als leidend projectkader.

## Logboek

Lees docs/LOGBOOK.md bij aanvang van elke sessie om te weten wat er de vorige sessies is veranderd. Voeg bij elke commit die iets functioneels wijzigt (code, content, config) een regel toe onder de datum van vandaag in docs/LOGBOOK.md, met een samenvatting in gewone taal van wat er is veranderd en waarom. Dit wordt afgedwongen door een hook (.claude/hooks/check-logbook.sh): een commit die andere bestanden wijzigt zonder dat docs/LOGBOOK.md is meegecommit, wordt geweigerd.

## Besluitenlog

Besluit 21/22 sept 2026: voor nu wordt lokale opslag (AsyncStorage) gebruikt voor voortgang, zoals al gebouwd. Supabase wordt later toegevoegd, specifiek voor gebruikersaccounts en betaalstatus (freemium-laag), niet voor de huidige lokale testfase. Dit is een tijdelijke afwijking van §13 van project-instructions.md, geen permanente koerswijziging.

## Contentregel: moeilijkheidsopbouw

Moeilijkheidsgraad loopt op binnen elke les (lichtste vragen eerst, zwaarste als afsluiter) EN over de hele track heen (les 1 is de laagdrempeligste instap, latere lessen bouwen voort in complexiteit). Deze regel geldt voor alle modules, niet alleen macro.json.
