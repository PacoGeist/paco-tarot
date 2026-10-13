package com.bek.tarot;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

/* Moon notifications. The web side works out the dates (full and new moons, quarters, sabbats)
   and hands over a JSON list of {at, title, text}; this schedules them with AlarmManager, keeps
   the list so they come back after a restart, and posts the notification when each one is due.
   Nothing here touches the network. */
public final class MoonAlarms {
    static final String CHANNEL = "moon";
    private static final String PREFS = "moon_alerts", KEY_LIST = "list", KEY_COUNT = "count";
    private static final int MAX = 120;

    private MoonAlarms() { }

    static void save(Context c, String json) {
        c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_LIST, json == null ? "[]" : json).apply();
        reschedule(c);
    }

    static void reschedule(Context c) {
        SharedPreferences p = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        int old = p.getInt(KEY_COUNT, 0);
        for (int i = 0; i < old; i++) am.cancel(pending(c, i, null, null));
        int n = 0;
        try {
            JSONArray a = new JSONArray(p.getString(KEY_LIST, "[]"));
            long now = System.currentTimeMillis();
            for (int i = 0; i < a.length() && n < MAX; i++) {
                JSONObject o = a.getJSONObject(i);
                long at = o.optLong("at");
                if (at <= now) continue;
                PendingIntent pi = pending(c, n, o.optString("title"), o.optString("text"));
                if (Build.VERSION.SDK_INT >= 23) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
                else am.set(AlarmManager.RTC_WAKEUP, at, pi);
                n++;
            }
        } catch (Exception ignored) { }
        p.edit().putInt(KEY_COUNT, n).apply();
    }

    static int count(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getInt(KEY_COUNT, 0); }

    private static PendingIntent pending(Context c, int i, String title, String text) {
        Intent it = new Intent(c, MoonReceiver.class).setAction("com.bek.tarot.MOON_ALERT");
        if (title != null) it.putExtra("title", title).putExtra("text", text);
        return PendingIntent.getBroadcast(c, 1000 + i, it, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void channel(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null || nm.getNotificationChannel(CHANNEL) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL, "Moon phases", NotificationManager.IMPORTANCE_DEFAULT);
        ch.setDescription("Full moons, new moons, quarters and sabbats");
        nm.createNotificationChannel(ch);
    }

    @SuppressWarnings("deprecation")
    static void show(Context c, String title, String text, int id) {
        channel(c);
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        Intent open = new Intent(c, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP).putExtra("hash", "#/moon");
        PendingIntent pi = PendingIntent.getActivity(c, 7, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        android.app.Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new android.app.Notification.Builder(c, CHANNEL) : new android.app.Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_moon).setContentTitle(title).setContentText(text)
            .setStyle(new android.app.Notification.BigTextStyle().bigText(text))
            .setColor(0xFFD4AD5A).setAutoCancel(true).setContentIntent(pi);
        try { nm.notify(id, b.build()); } catch (SecurityException ignored) { }  // notifications turned off
    }
}
