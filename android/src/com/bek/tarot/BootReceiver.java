package com.bek.tarot;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/* Alarms are cleared when the phone restarts or the app is updated: set them again. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent i) { MoonAlarms.reschedule(c); }
}
