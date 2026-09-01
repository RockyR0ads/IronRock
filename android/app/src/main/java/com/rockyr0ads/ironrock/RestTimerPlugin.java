package com.rockyr0ads.ironrock;

import android.Manifest;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * Bridges the web app's rest timer to native notifications: a live lock-screen
 * chronometer while resting, an alerting notification when it's up. See
 * RestNotifications for the mechanics.
 */
@CapacitorPlugin(
        name = "RestTimer",
        permissions = {
                @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications")
        }
)
public class RestTimerPlugin extends Plugin {

    @Override
    public void load() {
        RestNotifications.ensureChannels(getContext());
    }

    @PluginMethod
    public void start(PluginCall call) {
        Integer seconds = call.getInt("seconds", 0);
        long secs = seconds == null ? 0L : seconds.longValue();
        long finishAt = System.currentTimeMillis() + secs * 1000L;
        RestNotifications.showOngoing(getContext(), finishAt);
        RestNotifications.scheduleComplete(getContext(), finishAt);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        RestNotifications.clear(getContext());
        call.resolve();
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "permCallback");
        } else {
            resolveGranted(call, true);
        }
    }

    @PermissionCallback
    private void permCallback(PluginCall call) {
        resolveGranted(call, getPermissionState("notifications") == PermissionState.GRANTED);
    }

    private void resolveGranted(PluginCall call, boolean granted) {
        JSObject r = new JSObject();
        r.put("granted", granted);
        call.resolve(r);
    }
}
