package com.rockyr0ads.ironrock;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

/**
 * The native rest-timer notifications. The live countdown is a single ongoing
 * notification with an OS-ticked chronometer (so it updates on the lock screen
 * without us re-posting — no watch buzzing). A separate AlarmManager alarm fires
 * the alerting "rest complete" notification even if the app is backgrounded, so
 * we never need a foreground service.
 */
public final class RestNotifications {

    public static final String CHANNEL_ONGOING = "rest_ongoing";
    public static final String CHANNEL_DONE = "rest_done";
    public static final int NOTIF_ID = 4711;
    private static final int ALARM_REQ = 7311;

    private RestNotifications() {}

    public static void ensureChannels(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null) return;

        NotificationChannel ongoing = new NotificationChannel(
                CHANNEL_ONGOING, "Rest timer", NotificationManager.IMPORTANCE_LOW);
        ongoing.setDescription("The live countdown between sets");
        ongoing.setSound(null, null);
        ongoing.enableVibration(false);
        nm.createNotificationChannel(ongoing);

        NotificationChannel done = new NotificationChannel(
                CHANNEL_DONE, "Rest complete", NotificationManager.IMPORTANCE_HIGH);
        done.setDescription("Alerts you when a rest is up");
        done.enableVibration(true);
        done.setVibrationPattern(new long[]{0, 200, 100, 200});
        nm.createNotificationChannel(done);
    }

    private static PendingIntent openApp(Context ctx) {
        Intent launch = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(ctx, 1, launch, flags);
    }

    private static PendingIntent alarmIntent(Context ctx) {
        Intent i = new Intent(ctx, RestCompleteReceiver.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(ctx, ALARM_REQ, i, flags);
    }

    /** Post (or refresh) the live countdown notification, ending at finishAt. */
    public static void showOngoing(Context ctx, long finishAt) {
        ensureChannels(ctx);
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CHANNEL_ONGOING)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("Resting")
                .setContentText("Counting down to your next set")
                .setWhen(finishAt)
                .setShowWhen(true)
                .setUsesChronometer(true)
                .setChronometerCountDown(true)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setSilent(true)
                .setContentIntent(openApp(ctx))
                .setPriority(NotificationCompat.PRIORITY_LOW);
        safeNotify(ctx, b);
    }

    /** Replace the countdown with the alerting "rest complete" notification. */
    public static void showComplete(Context ctx) {
        ensureChannels(ctx);
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CHANNEL_DONE)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("Rest complete")
                .setContentText("Back to the bar — start your next set.")
                .setAutoCancel(true)
                .setContentIntent(openApp(ctx))
                .setVibrate(new long[]{0, 200, 100, 200})
                .setPriority(NotificationCompat.PRIORITY_HIGH);
        safeNotify(ctx, b);
    }

    private static void safeNotify(Context ctx, NotificationCompat.Builder b) {
        try {
            NotificationManagerCompat.from(ctx).notify(NOTIF_ID, b.build());
        } catch (SecurityException ignored) {
            // POST_NOTIFICATIONS not granted — nothing to show
        }
    }

    /** Schedule the completion alarm; falls back to inexact if exact isn't allowed. */
    public static void scheduleComplete(Context ctx, long finishAt) {
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        if (am == null) return;
        PendingIntent pi = alarmIntent(ctx);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !am.canScheduleExactAlarms()) {
                am.set(AlarmManager.RTC_WAKEUP, finishAt, pi);
            } else {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, finishAt, pi);
            }
        } catch (SecurityException e) {
            am.set(AlarmManager.RTC_WAKEUP, finishAt, pi);
        }
    }

    /** Cancel a running rest: clear the alarm and the countdown notification. */
    public static void clear(Context ctx) {
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        if (am != null) am.cancel(alarmIntent(ctx));
        NotificationManagerCompat.from(ctx).cancel(NOTIF_ID);
    }
}
