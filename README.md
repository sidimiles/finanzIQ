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
- Formulare zum Hinzufügen von Konten/Transaktionen/Budgets/wiederkehrenden Zahlungen
- Default-Kategorien beim Signup automatisch anlegen (optional: erweitere den `handle_new_user`-Trigger)
- Push-Benachrichtigungen für fällige wiederkehrende Zahlungen
