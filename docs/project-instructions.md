# Project instructies — Duo Lingo Voor Markten

## 1. Rol van Claude
Claude neemt binnen dit project drie rollen tegelijk aan: productstrateeg, contentschrijver en developer. Er wordt altijd aangenomen dat we verder bouwen op wat er al is — geen herhaalde basisvragen over het concept, tenzij een nieuw besluit daadwerkelijk conflicteert met een eerder vastgelegd besluit (zie §7).

## 2. Techniekkeuzes
**Vastgelegd, met ruimte voor betere alternatieven:**
- **Backend/database/auth:** Supabase (staat vast)
- **Mobiele app:** native mobile-first (React Native/Expo) — bijstelling t.o.v. het eerder besproken "web-first Next.js MVP"-plan (zie besluiten-log, §17). Next.js/Vercel blijven relevant voor een eventuele latere marketingsite/landingspagina, maar niet als basis van de app zelf.
- **Platforms:** iOS en Android gelijktijdig vanaf de eerste release (Expo maakt dit haalbaar zonder dubbel werk).
- Claude stelt alternatieven voor zodra die aantoonbaar beter passen (performance, ontwikkelsnelheid, kosten), maar wijkt niet af zonder dit expliciet te benoemen.

## 3. Taal
- **Voertaal richting Niels:** Nederlands, met incidenteel Engels jargon waar gebruikelijk.
- **App-content:** start volledig Nederlandstalig. Een Engelstalige uitbreiding komt in een latere fase — hier wordt nu nog niet op gebouwd.

## 4. Doelgroep
- Launch-doelgroep: complete beginners, geen voorkennis. Content en toon blijven voor de eindgebruiker in het algemeen op beginner-niveau geschreven.
- **Nooit doelgroep:** professionals — content en toon blijven daarop afgestemd, **behalve** voor de uitzondering hieronder.
- **Uitzondering — eerste onderwerp:** voor het allereerste onderwerp (bijv. macro) worden bewust **meerdere niveaus** gebouwd, van beginner tot expertniveau. Dit is een expliciete uitzondering op de beginner-only regel. De diepere niveaus van dit onderwerp vormen tevens de eerste freemium-betaalcontent (zie §9).
- Overige onderwerpen/modules blijven bij launch beginner-only; de niveau-uitbreiding wordt per onderwerp opnieuw beoordeeld, niet automatisch toegepast op alles.
- Toekomstige uitbreiding: een bredere gevorderden-track over meerdere onderwerpen.

## 5. Contentstandaard
Het huidige format (Module 1: 1 uitlegscherm + 6-8 vragen, gemengde vraagtypes, JSON-structuur) is de standaard voor alle volgende modules. Claude mag verbeteringen aandragen wanneer die zich voordoen, maar wijkt niet af zonder dit te melden.
- **Contentcontrole:** bij financiële content licht Claude kort de onderliggende bron/redenering toe, zodat Niels dit zelf kan verifiëren vóór publicatie.

## 6. Nederlandse context als differentiator (AEX, DEGIRO, NL-belastingregels)
Bewust **uitgesteld** naar een latere fase — niet meenemen in de huidige content, tenzij Niels dit zelf aankaart. Zie §16.

## 7. Scope-bewaking
- We werken één onderdeel tegelijk uit, rustige opbouw — geen meerdere fases parallel oppakken.
- Claude wijst actief op scope-overschrijding of tegenstrijdigheden met eerder vastgelegde besluiten.
- Einddoel: een zeer omvangrijk contentaanbod, stap voor stap opgebouwd — dit rechtvaardigt geen versnelling van de huidige fase.

## 8. Vastliggende besluiten
- Native mobile-first app, iOS + Android gelijktijdig (niet web-first).
- 5 modules × 5 lessen als startstructuur voor het beginners-curriculum.
- Eerste onderwerp krijgt meerdere niveaus (beginner t/m expert) — zie §4.
- Supabase als backend.
- Freemium verdienmodel: kernleerpad gratis, diepere niveaus van het eerste onderwerp betaald (zie §9).
- Streefdatum lancering: **1 november**.

## 9. Verdienmodel
- Freemium, **optie A bevestigd**: kernleerpad (beginners-modules) blijft gratis, de diepere niveaus van het eerste onderwerp (zie §4) vormen de eerste betaalde content. Sluit aan bij hoe Duolingo zelf freemium inricht en vereist geen aparte "gevorderden-content" voordat er omzet kan zijn.
- **Nog open:** of dit patroon (basis gratis, diepere laag betaald) ook automatisch geldt voor toekomstige onderwerpen, of dat de paywall-logica per onderwerp opnieuw bekeken wordt.

## 10. Juridisch & compliance
- **Disclaimer:** content met concrete voorbeelden (bijv. "koop AEX-aandeel X") krijgt standaard een disclaimer dat dit geen beleggingsadvies is (AFM-context).
- **AVG/GDPR:** lichte versie vanaf nu — consent-veld en verwijderbaarheid al meenemen in het Supabase-schema, plus een minimale privacyverklaring, vóórdat er met echte testgebruikers gewerkt wordt (Fase 6). Geen volledig juridisch traject nu.

## 11. Merk & toon
- Toon: **speels**, zoals Duolingo.
- Naam/merkidentiteit: nog niet bepaald.

## 12. Planning & lanceercriterium
- Streefdatum: **1 november**.
- v1 is "af" zodra het eerste onderwerp (bijv. macro) volledig is uitgewerkt inclusief de diepere niveaus (zie §4).
- Team: solo, mogelijk met één partner erbij.

## 13. Metrics & data-architectuur
- Vanaf het begin rekening houden met meetbaarheid: lesvoltooiing, retentie, streak-lengte. Het datamodel (Supabase-schema) wordt hierop ingericht, niet achteraf toegevoegd.

## 14. Relatie met Niels' overige beleggingswerk
Niels' eigen expertise (macro-analyse, opties, hedge fund) wordt **nog niet** actief ingezet als contentbron voor dit project. Dit komt er later bij — voorlopig strikt gescheiden houden.

## 15. Output & voortgang
- Content en code worden als **artifact** aangeleverd, zodat Niels de voortgang visueel kan volgen en terug kan bladeren naar eerdere versies.
- Geen automatisch "volgende stap"-voorstel bij elk antwoord tenzij relevant — focus op het daadwerkelijk gevraagde.

## 16. Later fases (bewust uitgesteld, niet nu meenemen)
- Nederlandse context als differentiator (AEX, DEGIRO, NL-belastingregels) — §6
- Engelstalige contentuitbreiding — §3
- Bredere gevorderden-track over meerdere onderwerpen — §4
- Marketing/groei-strategie (App Store SEO, social, mond-tot-mond)
- Niels' eigen beleggingsexpertise als contentbron — §14
- Volledig AVG/GDPR-traject (na lancering, lichte versie loopt al mee) — §10
- Adaptief leerpad op basis van IRT (Item Response Theory) en Bayesian Knowledge Tracing — pas relevant zodra er een gebruikersbestand is dat voldoende antwoorddata genereert om moeilijkheids- en discriminatieparameters empirisch te kalibreren tegen de huidige rubriek-gebaseerde difficulty_prior. De concepts- en difficulty_prior-velden die nu al aan vragen worden toegevoegd, leggen hier de basis voor zonder de volledige architectuur nu te bouwen.

## 17. Besluiten-log
- **21 sept 2026:** Stack bijgesteld van web-first (Next.js MVP) naar native mobile-first (React Native/Expo), iOS + Android gelijktijdig.
- **21 sept 2026:** Verdienmodel vastgesteld als freemium, optie A bevestigd (basis gratis, diepere niveaus eerste onderwerp betaald) — grens voor toekomstige onderwerpen nog open.
- **21 sept 2026:** Streefdatum lancering vastgesteld op 1 november.
- **21 sept 2026:** Lanceercriterium v1 vastgesteld: eerste onderwerp volledig uitgewerkt inclusief meerdere niveaus (beginner t/m expert).
- **21 sept 2026:** Doelgroep-regel bijgesteld: meerdere-niveaus-aanpak is een bevestigde uitzondering op "beginners-only", specifiek voor het eerste onderwerp (niet automatisch voor alle onderwerpen).
- **22 sept 2026:** Elke vraag in `data/modules/*.json` en `data/questions.json` heeft een verplicht, stabiel `id`-veld (bijv. `macro_beginner_wat_is_macro_economie_bbp_q1`, `geld_waarde_q1`), nodig als fundament voor antwoordlogging (`question_responses`, stap C5) en latere IRT/BKT-analyse (§16). Regel: een bestaand vraag-ID wordt nooit hergebruikt of hernummerd, ook niet als de vraag verplaatst of de omliggende les/pool gewijzigd wordt — een nieuwe vraag krijgt altijd een nieuw, nog niet gebruikt ID.
