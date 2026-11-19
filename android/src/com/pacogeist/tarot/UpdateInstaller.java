package com.pacogeist.tarot;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/* Downloads a new PacoTarot.apk inside the app and hands it to Android's own installer.
   - Android checks that the update is signed with this app's key and has this app's ID; anything else is refused.
   - The first time, Android asks the person to allow "Install unknown apps" for this app, and to confirm the update.
   - From Android 12 on, once this app has installed itself once, later updates go through without a prompt. */
class UpdateInstaller {
    interface Status { void on(String state, String detail); }

    static boolean canInstall(Context c) {
        return Build.VERSION.SDK_INT < 26 || c.getPackageManager().canRequestPackageInstalls();
    }

    static void openInstallSetting(Activity a) {
        if (Build.VERSION.SDK_INT < 26) return;
        try { a.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + a.getPackageName()))); } catch (Exception ignored) { }
    }

    // only the app's own GitHub release files may be downloaded
    static boolean allowedUrl(String u) {
        return u != null && u.matches("https://(github\\.com|raw\\.githubusercontent\\.com|objects\\.githubusercontent\\.com|release-assets\\.githubusercontent\\.com)/.*\\.apk(\\?.*)?");
    }

    static void install(Context c, String url, Status st) {
        new Thread(() -> {
            PackageInstaller.Session session = null;
            try {
                if (!allowedUrl(url)) throw new Exception("That download address isn't allowed");
                st.on("downloading", "0");
                HttpURLConnection con = open(url);
                long total = con.getContentLengthLong();
                PackageInstaller pi = c.getPackageManager().getPackageInstaller();
                PackageInstaller.SessionParams p = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
                p.setAppPackageName(c.getPackageName());
                if (Build.VERSION.SDK_INT >= 31) p.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_NOT_REQUIRED);
                int id = pi.createSession(p);
                session = pi.openSession(id);
                try (InputStream in = con.getInputStream(); OutputStream out = session.openWrite("PacoTarot.apk", 0, total > 0 ? total : -1)) {
                    byte[] buf = new byte[65536]; long done = 0; int n, last = -1;
                    while ((n = in.read(buf)) > 0) {
                        out.write(buf, 0, n); done += n;
                        int pct = total > 0 ? (int) (done * 100 / total) : -1;
                        if (pct != last && pct % 5 == 0) { last = pct; st.on("downloading", String.valueOf(pct)); }
                    }
                    session.fsync(out);
                }
                st.on("installing", "");
                Intent i = new Intent(c, InstallReceiver.class);
                int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
                session.commit(PendingIntent.getBroadcast(c, id, i, flags).getIntentSender());
                session.close(); session = null;
            } catch (Exception e) {
                if (session != null) try { session.abandon(); } catch (Exception ignored) { }
                st.on("failed", e.getMessage() == null ? "The download stopped" : e.getMessage());
            }
        }).start();
    }

    // follows GitHub's redirects, but only to allowed https addresses
    private static HttpURLConnection open(String url) throws Exception {
        String u = url;
        for (int hops = 0; hops < 5; hops++) {
            HttpURLConnection con = (HttpURLConnection) new URL(u).openConnection();
            con.setInstanceFollowRedirects(false); con.setConnectTimeout(20000); con.setReadTimeout(60000);
            int code = con.getResponseCode();
            if (code >= 300 && code < 400) {
                String next = con.getHeaderField("Location"); con.disconnect();
                if (next == null || !next.startsWith("https://") || !(allowedUrl(next.split("\\?")[0]) || next.matches("https://([a-z0-9-]+\\.)*githubusercontent\\.com/.*"))) throw new Exception("Unexpected download address");
                u = next; continue;
            }
            if (code != 200) { con.disconnect(); throw new Exception("The update site answered " + code); }
            return con;
        }
        throw new Exception("Too many redirects");
    }
}
