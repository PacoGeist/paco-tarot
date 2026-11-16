# Paco Morningstar's Tarot

Tarot spreads and readings in three decks (Rider–Waite–Smith, Tarot de Marseille and Thoth), a reading journal with card statistics, the Tarot School learning game, flashcards, and a moon tracker with moon alerts. Everything runs on the phone and keeps working with no connection. All cards are read upright, using the Rider–Waite–Smith deck.

---

## Get the app

### iPhone (and iPad)
1. Open **https://pacogeist.github.io/paco-tarot/** in **Safari**.
2. Tap the **Share** button (the square with an arrow), then **Add to Home Screen**, then **Add**.
3. Open it from the new icon on your Home Screen. After the first visit it works offline.

### Android
1. On the phone, download **[PacoTarot.apk](https://github.com/PacoGeist/paco-tarot/raw/main/android/releases/PacoTarot.apk)**.
2. Open the downloaded file. If Android asks, allow your browser or Files app to **install unknown apps**.
3. Tap **Install**.

### Updates
- **Android:** updates download and install inside the app. With **Automatic updates** on (☰ → Settings & Backup → Updates), the app looks once a day when you open it and updates itself. The first time, Android asks you to allow updates from this app and to confirm; on Android 12 and newer, later updates need no taps at all.
- **iPhone:** the app never updates by itself. Go to **☰ → Settings & Backup → Updates → Check for updates**, then tap **Update now**.

> **Moving from the old Android app:** version 1.0 is a new Android app. In the old app, use **Export backup** first, then install the new app, use **Import backup**, and uninstall the old one.

Your readings, journal and Tarot School progress are kept.

### Moon alerts (☰ → Settings & Backup → Moon Alerts)
You can choose full moons, new moons, quarters and sabbats, the time of the alert, and whether it comes on the day, the day before, or both.
- **Android:** turn on **Moon notifications**. The phone schedules them itself, so they arrive even with no connection.
- **iPhone:** web apps can't send their own reminders. Instead, tap **Add moon alerts to my Calendar**, then choose **Calendar** in the share sheet. If Calendar isn't offered, choose **Save to Files**, open the file in the Files app, and tap **Add All**. Your Calendar then reminds you. This covers about 13 months, and the app reminds you when it's time to add more.

### Your own deck (☰ → My Decks)
Name your deck, choose which kind it is (Rider–Waite–Smith, Marseille or Thoth), then photograph each card. The app guides you through all 78 cards with a card-shaped frame; you can also use photos you already have. After each photo you can drag, pinch to zoom, twist to rotate, center and fit the card before saving.

To **share a deck**, open it in My Decks and tap **Share or export this deck**. It makes one `.tarotdeck.json` file. The person you send it to uses **My Decks → Import a deck**, and the app checks every picture before adding it. Please share only decks you have the right to share.

Your readings then show your own cards, read with the meanings of the kind you chose. Lessons, Tarot School and flashcards keep the built-in decks. The photos stay on your phone and are included in backups.

### Keep a backup
Your readings are stored only on your phone. Now and then, use **Settings & Backup → Export backup**:
- **iPhone:** choose **Save to Files** in the share sheet.
- **Android:** choose where to save the file.

To restore a backup, or move to a new phone, use **Import backup**.

---

## Publishing it on GitHub (step by step)

This uses the free **GitHub Desktop** app, so you don't need the command line. The website alone can't upload this many files at once.

The folder layout on the computer is:

```
C:\Claude Projects\TarotApp\
    paco-tarot\     <- this repository (GitHub Desktop commits and pushes from here)
    keys\           <- the private Android signing key; NEVER inside paco-tarot, never uploaded
```

### 1. Make the repository on GitHub
1. Sign in at **https://github.com** as the owner (PacoGeist).
2. If an older `paco-tarot` repository exists, delete it first: **Settings → Danger Zone → Delete this repository**.

### 2. Connect this folder with GitHub Desktop and publish it
1. Install **GitHub Desktop** from https://desktop.github.com and sign in.
2. **File → Options → Git**: set the name and a personal email address. Every commit records them publicly.
3. **File → Add local repository…** → choose `C:\Claude Projects\TarotApp\paco-tarot` → click **create a repository**.
4. Name **paco-tarot**, local path `C:\Claude Projects\TarotApp`, no README, Git ignore **None**, license **None** → **Create repository**.
5. Click **Publish repository**, untick **Keep this code private**, and publish.

The `keys` folder is outside the repository, and `.gitignore` blocks keystores as a second safety net.

### 3. Your username is already set
`iphone/js/config.js` already contains `repo: 'PacoGeist/paco-tarot'`, so the update checks look at **https://pacogeist.github.io/paco-tarot/**. If you ever rename the repository, change it there and rebuild the Android app.

### 4. Turn on the iPhone website
1. On GitHub, open the repository and go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Open the **Actions** tab. "Publish the iPhone app" runs, which takes a minute or two.
4. When it shows a green tick, the app is live at **https://pacogeist.github.io/paco-tarot/**.

If it ran before you switched Pages to GitHub Actions, open **Actions → Publish the iPhone app → Run workflow**.

### 5. Share it
Send people the link to this repository. The "Get the app" section at the top tells them what to do.

---

## Releasing an update

1. Make your changes in `iphone/`. That folder is the app for **both** phones: Android builds from it too.
2. Open `iphone/version.json` and update it:
   - raise `"version"` (for example `1.0` → `1.1`)
   - raise `"androidVersionCode"` by one (for example `12` → `13`; it started at 12 so the old Android app is pointed to the new one)
   - update `"date"` and `"notes"`. People see the notes when they check for updates.
3. Build the new Android app. This puts the new `PacoTarot.apk` into `android/releases/`:
   ```
   bash android/build.sh
   ```
   You need the Android SDK (build-tools 35, platform 35) and Java 17 or newer. You also need the signing key in a `keys` folder **next to** the repository folder (not inside it):
   - `keys/tarot.keystore`
   - `keys/signing.env`, containing `KS_PASS=...`

   If you'd rather not set this up yourself, Claude can do the build for you.
4. Commit and push in GitHub Desktop. GitHub republishes the iPhone version automatically.
5. Android phones update themselves (Automatic updates); iPhones get it when they tap **Check for updates → Update now**.

> **Keep the signing key safe and private.** Android only accepts an update signed with the same key as the installed app. If the key is lost, people have to uninstall (losing their data unless they made a backup) and install again. If someone else gets it, they could make a fake update. The `.gitignore` file stops keystores from being uploaded by mistake.

---

## What's in this repository

| Folder | What it is |
|---|---|
| `iphone/` | The app itself: HTML, CSS, JavaScript, card images and fonts. GitHub Pages publishes it as the iPhone web app. |
| `iphone/sw.js` | The offline helper. Its first visit saves every file. Afterwards it only downloads a new version when the user taps **Update now**. |
| `iphone/version.json` | The current version number and release notes. Both apps check against it. |
| `iphone/js/config.js` | Your GitHub username and repository name (the one setting to change). |
| `android/` | The Android project: a small Java wrapper around the same app, plus moon notifications and the update check. |
| `android/releases/PacoTarot.apk` | The latest Android app, for people to download. |
| `tools/` | Build scripts, the card data (`tools/data/*.json`) and tests. |
| `.github/workflows/pages.yml` | Publishes `iphone/` to GitHub Pages on every push. |

Card artwork:
- **Rider–Waite–Smith:** Pamela Colman Smith (1909), public domain.
- **Tarot de Marseille:** a copy printed about 1890–1900 on the Nicolas Conver pattern, held by the Bibliothèque nationale de France and published on Wikimedia Commons. Public domain.
- **Thoth:** the Crowley/Harris paintings are still under copyright, so they are **not** included. The app draws its own original card faces. People who own the deck can photograph their own cards, and those photos stay on their phone. The fonts (Cinzel Decorative, Cormorant Garamond and IM Fell English) are under the SIL Open Font License; see `tools/fonts/`.
