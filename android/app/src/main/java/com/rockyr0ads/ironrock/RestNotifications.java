package com.rockyr0ads.ironrock;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

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

    /** Redraw the plate this often while a rest runs (silent re-post, low-importance channel). */
    private static final long TICK_MS = 3000L;
    private static final Handler HANDLER = new Handler(Looper.getMainLooper());
    private static Runnable ticker;
    private static long restStart;

    private RestNotifications() {}

    /**
     * The IronRock plate as a clock: red plate whose spent share, from 12 o'clock
     * clockwise, goes dark — the same countdown mark as the in-app rest bar.
     */
    static Bitmap plateClock(float remaining) {
        int px = 192;
        Bitmap bm = Bitmap.createBitmap(px, px, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bm);
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        float cx = px / 2f, r = px * 57f / 128f;
        p.setColor(Color.parseColor("#FF5247"));
        c.drawCircle(cx, cx, r, p);
        float spent = 1f - Math.max(0f, Math.min(1f, remaining));
        if (spent > 0f) {
            p.setColor(Color.argb(209, 26, 28, 32));
            c.drawArc(new RectF(cx - r, cx - r, cx + r, cx + r), -90f, spent * 360f, true, p);
        }
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeWidth(px / 64f);
        p.setColor(Color.argb(77, 60, 18, 14));
        c.drawCircle(cx, cx, px * 50f / 128f, p);
        p.setStyle(Paint.Style.FILL);
        p.setColor(Color.parseColor("#A9AFB8"));
        c.drawCircle(cx, cx, px * 21f / 128f, p);
        p.setColor(Color.parseColor("#141619"));
        c.drawCircle(cx, cx, px * 8.5f / 128f, p);
        return bm;
    }

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
        restStart = System.currentTimeMillis();
        postOngoing(ctx.getApplicationContext(), finishAt);
        startTicker(ctx.getApplicationContext(), finishAt);
    }

    /** Move a running rest's finish time (±15 s) without restarting the plate. */
    public static void adjust(Context ctx, long finishAt) {
        Context app = ctx.getApplicationContext();
        if (restStart == 0L || finishAt <= restStart) restStart = System.currentTimeMillis();
        postOngoing(app, finishAt);
        scheduleComplete(app, finishAt);
        startTicker(app, finishAt);
    }

    private static void startTicker(Context ctx, long finishAt) {
        stopTicker();
        ticker = new Runnable() {
            @Override
            public void run() {
                if (System.currentTimeMillis() >= finishAt) { ticker = null; return; }
                postOngoing(ctx, finishAt);
                HANDLER.postDelayed(this, TICK_MS);
            }
        };
        HANDLER.postDelayed(ticker, TICK_MS);
    }

    private static void stopTicker() {
        if (ticker != null) HANDLER.removeCallbacks(ticker);
        ticker = null;
    }

    private static void postOngoing(Context ctx, long finishAt) {
        ensureChannels(ctx);
        long total = Math.max(1L, finishAt - restStart);
        float remaining = (finishAt - System.currentTimeMillis()) / (float) total;
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CHANNEL_ONGOING)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("Resting")
                .setContentText("Counting down to your next set")
                .setLargeIcon(plateClock(remaining))
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
        stopTicker();
        ensureChannels(ctx);
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CHANNEL_DONE)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("Rest complete")
                .setContentText("Back to the bar — start your next set.")
                .setLargeIcon(plateClock(0f))
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
        stopTicker();
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        if (am != null) am.cancel(alarmIntent(ctx));
        NotificationManagerCompat.from(ctx).cancel(NOTIF_ID);
    }
}
