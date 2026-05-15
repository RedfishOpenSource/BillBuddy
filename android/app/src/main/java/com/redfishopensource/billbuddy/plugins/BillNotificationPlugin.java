package com.redfishopensource.billbuddy.plugins;

import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.provider.Settings;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.redfishopensource.billbuddy.notifications.BillNotificationListenerService;

import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "BillNotification")
public class BillNotificationPlugin extends Plugin {
    private BroadcastReceiver billNotificationReceiver;

    @Override
    public void load() {
        super.load();
        registerBillNotificationReceiver();
    }

    @Override
    protected void handleOnDestroy() {
        unregisterBillNotificationReceiver();
        super.handleOnDestroy();
    }

    @PluginMethod
    public void getListenerStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", true);
        result.put("enabled", isNotificationListenerEnabled());
        call.resolve(result);
    }

    @PluginMethod
    public void openNotificationAccessSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void consumePendingNotifications(PluginCall call) {
        JSArray notifications = new JSArray();
        JSONArray queue = BillNotificationListenerService.consumePendingNotifications(getContext());

        for (int index = 0; index < queue.length(); index++) {
            JSONObject item = queue.optJSONObject(index);
            if (item == null) {
                continue;
            }

            JSObject payload = new JSObject();
            payload.put("packageName", item.optString(BillNotificationListenerService.EXTRA_PACKAGE_NAME));
            payload.put("title", item.optString(BillNotificationListenerService.EXTRA_TITLE));
            payload.put("text", item.optString(BillNotificationListenerService.EXTRA_TEXT));
            payload.put("receivedAt", item.optString(BillNotificationListenerService.EXTRA_RECEIVED_AT));
            notifications.put(payload);
        }

        JSObject result = new JSObject();
        result.put("notifications", notifications);
        call.resolve(result);
    }

    private void registerBillNotificationReceiver() {
        if (billNotificationReceiver != null) {
            return;
        }

        billNotificationReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                JSObject payload = new JSObject();
                payload.put("packageName", intent.getStringExtra(BillNotificationListenerService.EXTRA_PACKAGE_NAME));
                payload.put("title", intent.getStringExtra(BillNotificationListenerService.EXTRA_TITLE));
                payload.put("text", intent.getStringExtra(BillNotificationListenerService.EXTRA_TEXT));
                payload.put("receivedAt", intent.getStringExtra(BillNotificationListenerService.EXTRA_RECEIVED_AT));
                notifyListeners("billNotificationReceived", payload, true);
            }
        };

        IntentFilter filter = new IntentFilter(BillNotificationListenerService.ACTION_BILL_NOTIFICATION);
        ContextCompat.registerReceiver(
                getContext(),
                billNotificationReceiver,
                filter,
                ContextCompat.RECEIVER_NOT_EXPORTED
        );
    }

    private void unregisterBillNotificationReceiver() {
        if (billNotificationReceiver == null) {
            return;
        }

        getContext().unregisterReceiver(billNotificationReceiver);
        billNotificationReceiver = null;
    }

    private boolean isNotificationListenerEnabled() {
        String enabledListeners = Settings.Secure.getString(
                getContext().getContentResolver(),
                "enabled_notification_listeners"
        );
        ComponentName componentName = new ComponentName(getContext(), BillNotificationListenerService.class);
        return enabledListeners != null && enabledListeners.contains(componentName.flattenToString());
    }
}
