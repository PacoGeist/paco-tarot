package com.bek.tarot;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/* Fires when a moon alert is due. */
public class MoonReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent i) {
        String title = i.getStringExtra("title");
        if (title == null) return;
        MoonAlarms.show(c, title, i.getStringExtra("text"), (int) (System.currentTimeMillis() / 1000 % 100000));
    }
}
