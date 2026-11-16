package com.pacogeist.tarot;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;
import android.widget.Toast;

/* Hears back from Android's installer. If Android wants the person to confirm, show its prompt. */
public class InstallReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context c, Intent intent) {
        int status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
        if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
            Intent confirm = intent.getParcelableExtra(Intent.EXTRA_INTENT);
            if (confirm != null) { confirm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); try { c.startActivity(confirm); } catch (Exception ignored) { } }
            MainActivity.updateStatus("confirm", "");
        } else if (status == PackageInstaller.STATUS_SUCCESS) {
            MainActivity.updateStatus("done", "");
        } else {
            String msg = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);
            MainActivity.updateStatus(status == PackageInstaller.STATUS_FAILURE_ABORTED ? "cancelled" : "failed", msg == null ? "" : msg);
            if (status != PackageInstaller.STATUS_FAILURE_ABORTED) Toast.makeText(c, "The update couldn't be installed", Toast.LENGTH_LONG).show();
        }
    }
}
