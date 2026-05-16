package com.redfishopensource.billbuddy.plugins;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.speech.RecognizerIntent;
import android.webkit.MimeTypeMap;

import androidx.activity.result.ActivityResult;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Locale;

@CapacitorPlugin(name = "BillEntry")
public class BillEntryPlugin extends Plugin {
    private static final class SavedEntryAsset {
        final File file;
        final String name;
        final String mimeType;
        final long size;

        SavedEntryAsset(File file, String name, String mimeType, long size) {
            this.file = file;
            this.name = name;
            this.mimeType = mimeType;
            this.size = size;
        }
    }

    private File pendingCaptureFile;
    private String pendingCaptureName = "";
    private String pendingCaptureMimeType = "";

    private File getMediaDirectory() {
        File mediaDirectory = new File(getContext().getFilesDir(), "bill-media");

        if (mediaDirectory.isDirectory()) {
            return mediaDirectory;
        }

        if (!mediaDirectory.mkdirs()) {
            throw new IllegalStateException("Unable to create media directory");
        }

        return mediaDirectory;
    }

    private String currentTimestamp() {
        return new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSXXX", Locale.US)
                .format(new java.util.Date());
    }

    private JSObject createCancelledResult() {
        JSObject result = new JSObject();
        result.put("cancelled", true);
        return result;
    }

    private String defaultFileName(String prefix, String extension) {
        return prefix + "-" + System.currentTimeMillis() + extension;
    }

    private String sanitizeExtension(String extension, String fallback) {
        if (extension == null || extension.trim().isEmpty()) {
            return fallback;
        }

        return extension.startsWith(".") ? extension : "." + extension;
    }

    private String resolveExtension(String mimeType, String fallback) {
        String extension = MimeTypeMap.getSingleton().getExtensionFromMimeType(mimeType);
        return sanitizeExtension(extension, fallback);
    }

    private File createCaptureFile(String prefix, String mimeType, String fallbackExtension) {
        String extension = resolveExtension(mimeType, fallbackExtension);
        String fileName = defaultFileName(prefix, extension);
        return new File(getMediaDirectory(), fileName);
    }

    private String queryDisplayName(Uri uri) {
        Cursor cursor = null;

        try {
            cursor = getContext().getContentResolver().query(uri, null, null, null, null);
            if (cursor == null || !cursor.moveToFirst()) {
                return "";
            }

            int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
            if (nameIndex >= 0) {
                String value = cursor.getString(nameIndex);
                return value != null ? value : "";
            }
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }

        return "";
    }

    private long queryFileSize(Uri uri) {
        Cursor cursor = null;

        try {
            cursor = getContext().getContentResolver().query(uri, null, null, null, null);
            if (cursor == null || !cursor.moveToFirst()) {
                return 0;
            }

            int sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE);
            if (sizeIndex >= 0) {
                return cursor.getLong(sizeIndex);
            }
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }

        return 0;
    }

    private SavedEntryAsset copyUriToInternalFile(Uri uri, String fallbackPrefix, String fallbackMime, String fallbackExtension) throws Exception {
        ContentResolver resolver = getContext().getContentResolver();
        String mimeType = resolver.getType(uri);
        if (mimeType == null || mimeType.trim().isEmpty()) {
            mimeType = fallbackMime;
        }

        String displayName = queryDisplayName(uri);
        if (displayName.isEmpty()) {
            displayName = defaultFileName(fallbackPrefix, resolveExtension(mimeType, fallbackExtension));
        }

        File outputFile = new File(getMediaDirectory(), displayName);
        if (outputFile.exists() && !outputFile.delete()) {
            throw new IllegalStateException("Unable to replace media file");
        }

        try (InputStream inputStream = resolver.openInputStream(uri);
             FileOutputStream outputStream = new FileOutputStream(outputFile, false)) {
            if (inputStream == null) {
                throw new IllegalStateException("Unable to read selected file");
            }

            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
        }

        long size = queryFileSize(uri);
        if (size <= 0) {
            size = outputFile.length();
        }

        return new SavedEntryAsset(outputFile, displayName, mimeType, size);
    }

    private JSObject createAssetResult(SavedEntryAsset asset) {
        JSObject result = new JSObject();
        JSObject jsAsset = new JSObject();
        jsAsset.put("path", asset.file.getAbsolutePath());
        jsAsset.put("name", asset.name);
        jsAsset.put("mimeType", asset.mimeType);
        jsAsset.put("size", asset.size);
        jsAsset.put("createdAt", currentTimestamp());
        result.put("asset", jsAsset);
        return result;
    }

    private JSObject createAssetsResult(ArrayList<SavedEntryAsset> assets) {
        JSObject result = new JSObject();
        JSArray jsAssets = new JSArray();

        for (SavedEntryAsset asset : assets) {
            JSObject item = new JSObject();
            item.put("path", asset.file.getAbsolutePath());
            item.put("name", asset.name);
            item.put("mimeType", asset.mimeType);
            item.put("size", asset.size);
            item.put("createdAt", currentTimestamp());
            jsAssets.put(item);
        }

        result.put("assets", jsAssets);
        return result;
    }

    private Uri createOutputUri(File file) {
        return FileProvider.getUriForFile(getContext(), getAppId() + ".fileprovider", file);
    }

    @PluginMethod
    public void pickImages(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("image/*");
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);

        try {
            startActivityForResult(call, intent, "handlePickImagesResult");
        } catch (ActivityNotFoundException exception) {
            call.reject("无法打开系统相册", exception);
        }
    }

    @ActivityCallback
    private void handlePickImagesResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.resolve(createCancelledResult());
            return;
        }

        try {
            Intent data = result.getData();
            ArrayList<SavedEntryAsset> assets = new ArrayList<>();
            ClipData clipData = data.getClipData();

            if (clipData != null) {
                for (int index = 0; index < clipData.getItemCount(); index += 1) {
                    Uri uri = clipData.getItemAt(index).getUri();
                    if (uri != null) {
                        assets.add(copyUriToInternalFile(uri, "bill-image", "image/jpeg", ".jpg"));
                    }
                }
            } else if (data.getData() != null) {
                assets.add(copyUriToInternalFile(data.getData(), "bill-image", "image/jpeg", ".jpg"));
            }

            call.resolve(createAssetsResult(assets));
        } catch (Exception exception) {
            call.reject("读取图片失败", exception);
        }
    }

    @PluginMethod
    public void capturePhoto(PluginCall call) {
        try {
            pendingCaptureMimeType = "image/jpeg";
            pendingCaptureFile = createCaptureFile("bill-photo", pendingCaptureMimeType, ".jpg");
            pendingCaptureName = pendingCaptureFile.getName();

            Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            intent.putExtra(MediaStore.EXTRA_OUTPUT, createOutputUri(pendingCaptureFile));
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            startActivityForResult(call, intent, "handleCapturePhotoResult");
        } catch (ActivityNotFoundException exception) {
            call.reject("无法打开系统相机", exception);
        }
    }

    @ActivityCallback
    private void handleCapturePhotoResult(PluginCall call, ActivityResult result) {
        handleCaptureResult(call, result, "bill-photo", "image/jpeg", ".jpg");
    }

    @PluginMethod
    public void captureVideo(PluginCall call) {
        try {
            pendingCaptureMimeType = "video/mp4";
            pendingCaptureFile = createCaptureFile("bill-video", pendingCaptureMimeType, ".mp4");
            pendingCaptureName = pendingCaptureFile.getName();

            Intent intent = new Intent(MediaStore.ACTION_VIDEO_CAPTURE);
            intent.putExtra(MediaStore.EXTRA_OUTPUT, createOutputUri(pendingCaptureFile));
            intent.putExtra(MediaStore.EXTRA_DURATION_LIMIT, 20);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            startActivityForResult(call, intent, "handleCaptureVideoResult");
        } catch (ActivityNotFoundException exception) {
            call.reject("无法打开系统摄像头", exception);
        }
    }

    @ActivityCallback
    private void handleCaptureVideoResult(PluginCall call, ActivityResult result) {
        handleCaptureResult(call, result, "bill-video", "video/mp4", ".mp4");
    }

    private void handleCaptureResult(PluginCall call, ActivityResult result, String fallbackPrefix, String fallbackMime, String fallbackExtension) {
        if (call == null) {
            return;
        }

        if (result.getResultCode() != Activity.RESULT_OK) {
            cleanupPendingCapture();
            call.resolve(createCancelledResult());
            return;
        }

        try {
            SavedEntryAsset asset;
            Intent data = result.getData();

            if (pendingCaptureFile != null && pendingCaptureFile.exists() && pendingCaptureFile.length() > 0) {
                asset = new SavedEntryAsset(
                        pendingCaptureFile,
                        pendingCaptureName.isEmpty() ? pendingCaptureFile.getName() : pendingCaptureName,
                        pendingCaptureMimeType.isEmpty() ? fallbackMime : pendingCaptureMimeType,
                        pendingCaptureFile.length()
                );
            } else if (data != null && data.getData() != null) {
                asset = copyUriToInternalFile(data.getData(), fallbackPrefix, fallbackMime, fallbackExtension);
            } else {
                throw new IllegalStateException("未获取到媒体文件");
            }

            cleanupPendingCapture();
            call.resolve(createAssetResult(asset));
        } catch (Exception exception) {
            cleanupPendingCapture();
            call.reject("保存媒体文件失败", exception);
        }
    }

    private void cleanupPendingCapture() {
        pendingCaptureFile = null;
        pendingCaptureName = "";
        pendingCaptureMimeType = "";
    }

    @PluginMethod
    public void recognizeSpeech(PluginCall call) {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault());
        intent.putExtra(RecognizerIntent.EXTRA_PROMPT, call.getString("prompt", "请说出账单内容"));
        intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);

        try {
            startActivityForResult(call, intent, "handleRecognizeSpeechResult");
        } catch (ActivityNotFoundException exception) {
            call.reject("当前设备不支持语音识别", exception);
        }
    }

    @ActivityCallback
    private void handleRecognizeSpeechResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.resolve(createCancelledResult());
            return;
        }

        ArrayList<String> results = result.getData().getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
        JSObject response = new JSObject();
        response.put("text", results != null && !results.isEmpty() ? results.get(0) : "");
        call.resolve(response);
    }
}
