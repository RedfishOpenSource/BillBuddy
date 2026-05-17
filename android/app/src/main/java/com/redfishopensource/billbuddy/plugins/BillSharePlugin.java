package com.redfishopensource.billbuddy.plugins;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "BillShare")
public class BillSharePlugin extends Plugin {
    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private File getShareDirectory() {
        File shareDirectory = new File(getContext().getCacheDir(), "shared");

        if (shareDirectory.isDirectory()) {
            return shareDirectory;
        }

        if (!shareDirectory.mkdirs()) {
            throw new IllegalStateException("Unable to create share directory");
        }

        return shareDirectory;
    }

    private byte[] getShareBytes(String textContent, String base64Content) {
        if (hasText(base64Content)) {
            return Base64.decode(base64Content, Base64.DEFAULT);
        }

        return textContent.getBytes(StandardCharsets.UTF_8);
    }

    private Intent createShareIntent(Uri fileUri, String mimeType) {
        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.setType(mimeType);
        shareIntent.putExtra(Intent.EXTRA_STREAM, fileUri);
        shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        shareIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return shareIntent;
    }

    private Intent createTargetedShareIntent(Intent shareIntent, String targetPackage) {
        if (!hasText(targetPackage)) {
            return null;
        }

        Intent targetedIntent = new Intent(shareIntent);
        targetedIntent.setPackage(targetPackage);
        return targetedIntent.resolveActivity(getContext().getPackageManager()) != null ? targetedIntent : null;
    }

    private Intent createShareChooserIntent(Intent shareIntent, String title, String targetPackage) {
        Intent chooserIntent = Intent.createChooser(shareIntent, title);
        chooserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        Intent targetedIntent = createTargetedShareIntent(shareIntent, targetPackage);
        if (targetedIntent != null) {
            chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{targetedIntent});
        }

        return chooserIntent;
    }

    private JSObject createShareResult(String sharedVia) {
        JSObject result = new JSObject();
        result.put("sharedVia", sharedVia);
        return result;
    }

    @PluginMethod
    public void shareFile(PluginCall call) {
        String fileName = call.getString("fileName", "billbuddy-share.txt");
        String textContent = call.getString("textContent", "");
        String base64Content = call.getString("base64Content", "");
        String mimeType = call.getString("mimeType", "text/plain");
        String title = call.getString("title", "分享");
        String targetPackage = call.getString("targetPackage");
        boolean preferChooser = call.getBoolean("preferChooser", false);

        try {
            File shareFile = new File(getShareDirectory(), fileName);
            try (FileOutputStream outputStream = new FileOutputStream(shareFile, false)) {
                outputStream.write(getShareBytes(textContent, base64Content));
            }

            Uri fileUri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    shareFile
            );

            Intent shareIntent = createShareIntent(fileUri, mimeType);

            if (preferChooser) {
                Intent chooserIntent = createShareChooserIntent(shareIntent, title, targetPackage);
                getContext().startActivity(chooserIntent);
                call.resolve(createShareResult("chooser"));
                return;
            }

            Intent targetedIntent = createTargetedShareIntent(shareIntent, targetPackage);
            if (targetedIntent != null) {
                try {
                    getContext().startActivity(targetedIntent);
                    call.resolve(createShareResult("package"));
                    return;
                } catch (ActivityNotFoundException ignored) {
                }
            }

            Intent chooserIntent = createShareChooserIntent(shareIntent, title, targetPackage);
            getContext().startActivity(chooserIntent);
            call.resolve(createShareResult("chooser"));
        } catch (Exception exception) {
            call.reject("Failed to share file", exception);
        }
    }
}
