# FinanzIQ – Setup

## 1. Projekt scaffolden
```
npx create-expo-app finanziq --template tabs
cd finanziq
```
(Oder ohne Template und expo-router manuell einrichten — siehe `package.json.deps.txt`.)

## 2. Abhängigkeiten installieren
Siehe `package.json.deps.txt` für die genauen Befehle.

## 3. Dateien reinkopieren
Kopiere die Ordner `app/`, `lib/`, `types/` sowie `eas.json` und `app.json` aus diesem
Starter-Paket in dein Projekt (überschreibt die Defaults von create-expo-app).

**Wichtig:** In `app.json` unter `extra.eas.projectId` musst du noch deine eigene
Project-ID eintragen (aus deinem `eas init`) — die kenne ich nicht, da ich keinen
GitHub-Zugriff habe. Alles andere (owner, Name, Bundle-IDs, Node-Pin in eas.json) ist
bereits fertig eingetragen.

## 4. Supabase ist bereits fertig eingerichtet
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
