# FinanzIQ – Setup

Dieses Paket ist jetzt ein KOMPLETTES Expo-Projekt (nicht nur einzelne Dateien).
Es enthält: `package.json`, `app.json`, `eas.json`, `babel.config.js`, `tsconfig.json`,
`.gitignore`, Platzhalter-Icons in `assets/`, sowie den kompletten `app/`, `lib/`, `types/` Code.

## 1. Inhalt in deinen Repo-Ordner kopieren
Den kompletten Inhalt dieses Zips 1:1 in deinen lokalen FinanzIQ-Repo-Ordner kopieren
(alles überschreiben, was schon da ist).

## 2. Abhängigkeiten installieren
Im Repo-Ordner:
```
npm install
```
Das lädt `node_modules` neu herunter (war zu gross zum Mitschicken).

## 3. projectId eintragen
In `app.json` unter `extra.eas.projectId` deine eigene Project-ID aus `eas init` eintragen —
die kenne ich nicht, da ich keinen GitHub-Zugriff habe. Alles andere ist bereits fertig.

## 4. Lokal testen
```
npx expo start
```
Sollte ohne Fehler starten. Dann erst committen & pushen.

## 5. Supabase ist bereits fertig eingerichtet
- Projekt: **FinanzIQ** (`ptccslxvbetniurwqopr`, eu-central-1)
- URL & Key sind bereits in `lib/supabase.ts` eingetragen
- Schema: `accounts`, `categories`, `transactions`, `budgets`, `recurring_payments`, `profiles`
- RLS aktiv, Auto-Profile-Trigger bei Signup

## 5. Lokal starten
```
npx expo start
```

## 6. Auf GitHub pushen
```
git init
git add .
git commit -m "Initial FinanzIQ scaffold"
git remote add origin https://github.com/sidimiles/FinanzIQ.git
git push -u origin main
```

## 7. Bei Expo registrieren (für EAS Builds)
```
npx eas init
npx eas build:configure
```
Danach sag mir Bescheid — dann kann ich über die Expo-MCP-Verbindung
Preview-Builds für Android/iOS auslösen, genau wie bei KinetiQ.

## Nächste Schritte für Feature-Parität
- ✅ Formulare zum Hinzufügen von Konten/Transaktionen/Budgets/wiederkehrenden Zahlungen
- ✅ Profil-Tab (Konto-Infos, Abmelden, Konto löschen, Passwort zurücksetzen)
- ✅ Hell/Dunkel-Modus
- ✅ Transaktionsliste (ansehen + löschen)
- ✅ Löschen für Konten/Budgets/Wiederkehrend (lange drücken)
- ✅ Kontoübertrag zwischen eigenen Konten
- ✅ Diagramme + Monatsvergleich in Berichten
- ✅ Biometrische Sperre (Face ID/Fingerabdruck)
- ✅ Sparziele-Tab
- ✅ Belegfoto zu Buchung (Storage-Bucket ist bereits live eingerichtet)
- ✅ Wiederkehrende Zahlungen werden automatisch verarbeitet: täglich um 03:00 UTC per Datenbank-Job, zusätzlich sofort beim App-Start. Erstellt echte Buchungen, zieht vom Konto ab, verschiebt das nächste Fälligkeitsdatum automatisch weiter.
- ✅ CSV-Export der Buchungen (Teilen-Icon in der Transaktionsliste)
- ✅ Suche & Filter in der Transaktionsliste (nach Konto, Kategorie, Text)
- ✅ Wiederkehrende Einnahmen (z.B. Lohn) — nicht mehr nur Ausgaben
- ✅ Automatische Kategorie-Vorschläge basierend auf der Buchungsbeschreibung (z.B. "Migros" → Lebensmittel)
- ✅ Jahresübersicht in Berichten (Umschalter Monat/Jahr oben rechts)
- ✅ Backup-Export (JSON, alle Daten) — wird vor "Konto löschen" angeboten
- ✅ Eigene Kategorien verwalten (anlegen, umbenennen, löschen) — über Profil → "Kategorien verwalten"
- ⚠️ Google/Apple-Login — **Code ist fertig, aber funktioniert erst nach diesem Setup:**

### Apple Sign-In aktivieren
1. Im Apple Developer Portal (developer.apple.com) unter deiner App-ID die Capability "Sign in with Apple" aktivieren (braucht das $99/Jahr Apple Developer Account, gleiche Baustelle wie bei KinetiQ's iOS-Build)
2. In Supabase Dashboard → Authentication → Providers → Apple aktivieren

### Google Sign-In aktivieren
1. Auf console.cloud.google.com ein OAuth-Client erstellen (3 Stück: Web, iOS, Android) für `ch.trachselki.finanziq`
2. Die 3 Client-IDs in `app.json` unter `extra.googleWebClientId` / `googleIosClientId` / `googleAndroidClientId` eintragen (Platzhalter sind schon drin)
3. In Supabase Dashboard → Authentication → Providers → Google aktivieren, dort die Web-Client-ID + Secret eintragen

Bis dahin funktionieren E-Mail/Passwort-Login normal, die Google/Apple-Buttons erscheinen aber Fehler beim Antippen.

- ⏳ Echte Push-Benachrichtigungen (aktuell nur visuelle Warnungen/Badges in der App)

**Hinweis:** `app.json` hat bereits deine echte `projectId` eingetragen — nichts mehr nachzutragen.
