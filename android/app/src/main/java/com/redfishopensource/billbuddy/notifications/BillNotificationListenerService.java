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
import java.util.regex.Pattern;

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
    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
            "(?:[¥￥]\\s*\\d+(?:\\.\\d{1,2})?|\\d+(?:\\.\\d{1,2})?\\s*元|金额[:：\\s]*\\d+(?:\\.\\d{1,2})?)",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern BILL_NO_PATTERN = Pattern.compile(
            "(?:交易单号|订单号|商户单号|转账单号|收款单号|账单编号)[:：\\s]*[A-Za-z0-9_-]{6,}",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern WECHAT_TITLE_PATTERN = Pattern.compile(
            "(微信支付|微信收款|微信转账|收款到账通知|转账收款|付款成功|支付成功)",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern WECHAT_TEXT_PATTERN = Pattern.compile(
            "(向.+付款|向你转账|收到转账|微信支付|微信转账|收款到账|付款成功|支付成功|商户单号|交易单号|二维码收款|退款)",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern ALIPAY_TITLE_PATTERN = Pattern.compile(
            "(付款成功|支付成功|收钱到账|收款到账|转账提醒|转账成功|退款成功|入账提醒)",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern ALIPAY_TEXT_PATTERN = Pattern.compile(
            "(支付宝支出|支付宝收入|向.+付款|向你转账|收钱到账|收款到账|交易成功|付款成功|支付成功|订单号|交易单号|商户单号|NFC支付|退款成功)",
            Pattern.CASE_INSENSITIVE
    );

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

        if (!isPaymentNotification(sbn.getPackageName(), safeTitle, safeText)) {
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

    private static boolean isPaymentNotification(String packageName, String title, String text) {
        String normalizedText = normalizeNotificationText(title, text);
        if (!AMOUNT_PATTERN.matcher(normalizedText).find() && !BILL_NO_PATTERN.matcher(normalizedText).find()) {
            return false;
        }

        if (packageName.contains("tencent.mm")) {
            return WECHAT_TITLE_PATTERN.matcher(title).find() || WECHAT_TEXT_PATTERN.matcher(normalizedText).find();
        }

        if (packageName.toLowerCase(Locale.ROOT).contains("alipay")) {
            return ALIPAY_TITLE_PATTERN.matcher(title).find() || ALIPAY_TEXT_PATTERN.matcher(normalizedText).find();
        }

        return false;
    }

    private static String normalizeNotificationText(String title, String text) {
        return (title + " " + text).replaceAll("\\s+", " ").trim();
    }

    private String formatIsoNow() {
        return new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssXXX", Locale.US).format(new Date());
    }
}
