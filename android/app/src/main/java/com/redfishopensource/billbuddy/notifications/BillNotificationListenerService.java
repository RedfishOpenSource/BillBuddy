package com.redfishopensource.billbuddy.notifications;

import android.app.Notification;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

public class BillNotificationListenerService extends NotificationListenerService {
    public static final String ACTION_BILL_NOTIFICATION = "com.redfishopensource.billbuddy.BILL_NOTIFICATION_EVENT";
    public static final String EXTRA_PACKAGE_NAME = "packageName";
    public static final String EXTRA_TITLE = "title";
    public static final String EXTRA_TEXT = "text";
    public static final String EXTRA_RECEIVED_AT = "receivedAt";

    private static final String PREFERENCES_NAME = "billbuddy_notification_queue";
    private static final String PENDING_QUEUE_KEY = "pendingNotifications";
    private static final int MAX_PENDING_NOTIFICATIONS = 50;
    private static final Set<String> SUPPORTED_PACKAGES = new HashSet<>(Arrays.asList(
            "com.tencent.mm",
            "com.eg.android.AlipayGphone"
    ));

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || sbn.getPackageName() == null || !SUPPORTED_PACKAGES.contains(sbn.getPackageName())) {
            return;
        }

        Notification notification = sbn.getNotification();
        if (notification == null || notification.extras == null) {
            return;
        }

        String safeTitle = extractTitle(notification);
        String safeText = extractText(notification);

        if (safeTitle.isEmpty() && safeText.isEmpty()) {
            return;
        }

        String receivedAt = formatIsoNow();

        enqueuePendingNotification(sbn.getPackageName(), safeTitle, safeText, receivedAt);

        Intent intent = new Intent(ACTION_BILL_NOTIFICATION);
        intent.setPackage(getPackageName());
        intent.putExtra(EXTRA_PACKAGE_NAME, sbn.getPackageName());
        intent.putExtra(EXTRA_TITLE, safeTitle);
        intent.putExtra(EXTRA_TEXT, safeText);
        intent.putExtra(EXTRA_RECEIVED_AT, receivedAt);
        sendBroadcast(intent);
    }

    public static JSONArray consumePendingNotifications(Context context) {
        SharedPreferences preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE);
        JSONArray queue = readQueue(preferences);
        preferences.edit().remove(PENDING_QUEUE_KEY).apply();
        return queue;
    }

    private void enqueuePendingNotification(String packageName, String title, String text, String receivedAt) {
        SharedPreferences preferences = getSharedPreferences(PREFERENCES_NAME, MODE_PRIVATE);
        JSONArray queue = readQueue(preferences);
        JSONArray nextQueue = new JSONArray();

        try {
            JSONObject item = new JSONObject();
            item.put(EXTRA_PACKAGE_NAME, packageName);
            item.put(EXTRA_TITLE, title);
            item.put(EXTRA_TEXT, text);
            item.put(EXTRA_RECEIVED_AT, receivedAt);
            nextQueue.put(item);

            for (int index = Math.max(0, queue.length() - (MAX_PENDING_NOTIFICATIONS - 1)); index < queue.length(); index++) {
                JSONObject existing = queue.optJSONObject(index);
                if (existing != null) {
                    nextQueue.put(existing);
                }
            }
        } catch (JSONException ignored) {
            return;
        }

        preferences.edit().putString(PENDING_QUEUE_KEY, nextQueue.toString()).apply();
    }

    private static JSONArray readQueue(SharedPreferences preferences) {
        String raw = preferences.getString(PENDING_QUEUE_KEY, "[]");

        try {
            return new JSONArray(raw);
        } catch (JSONException ignored) {
            return new JSONArray();
        }
    }

    private static String extractTitle(Notification notification) {
        return firstNonBlank(
                getExtraText(notification, Notification.EXTRA_TITLE),
                getExtraText(notification, Notification.EXTRA_TITLE_BIG),
                getExtraText(notification, Notification.EXTRA_SUB_TEXT)
        );
    }

    private static String extractText(Notification notification) {
        return firstNonBlank(
                getExtraText(notification, Notification.EXTRA_TEXT),
                getExtraText(notification, Notification.EXTRA_BIG_TEXT),
                joinTextLines(notification.extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)),
                getExtraText(notification, Notification.EXTRA_SUMMARY_TEXT),
                getExtraText(notification, Notification.EXTRA_SUB_TEXT),
                getTrimmedText(notification.tickerText)
        );
    }

    private static String getExtraText(Notification notification, String key) {
        return getTrimmedText(notification.extras.getCharSequence(key));
    }

    private static String getTrimmedText(CharSequence value) {
        return value == null ? "" : value.toString().trim();
    }

    private static String joinTextLines(CharSequence[] lines) {
        if (lines == null || lines.length == 0) {
            return "";
        }

        StringBuilder builder = new StringBuilder();
        for (CharSequence line : lines) {
            if (line == null) {
                continue;
            }

            String text = line.toString().trim();
            if (text.isEmpty()) {
                continue;
            }

            if (builder.length() > 0) {
                builder.append(' ');
            }
            builder.append(text);
        }

        return builder.toString();
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }

        return "";
    }

    private String formatIsoNow() {
        return new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.US).format(new Date());
    }
}
