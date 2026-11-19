/* ★ The one setting to change before uploading: your GitHub username and repository name.
   The app checks for updates at https://<username>.github.io/<repository>/version.json,
   and Android updates are downloaded from the newest GitHub Release of that repository
   (releases/latest/download/PacoTarot.apk, built by .github/workflows/android.yml).
   To publish on a domain of your own instead, add a "site" entry with its full https address. */
window.APP_CONFIG = { repo: 'PacoGeist/paco-tarot', branch: 'main' };
