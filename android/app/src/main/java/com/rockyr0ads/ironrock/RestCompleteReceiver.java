package com.rockyr0ads.ironrock;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Fired by AlarmManager when a rest elapses — even if the app is backgrounded.
 * Swaps the silent countdown for the alerting "rest complete" notification.
 */
public class RestCompleteReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        RestNotifications.showComplete(context);
    }
}
