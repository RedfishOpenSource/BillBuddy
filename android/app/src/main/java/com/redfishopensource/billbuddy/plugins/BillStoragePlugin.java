package com.redfishopensource.billbuddy.plugins;

import android.content.ContentValues;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "BillStorage")
public class BillStoragePlugin extends Plugin {
    private BillStorageDatabaseHelper databaseHelper;

    @Override
    public void load() {
        super.load();
        databaseHelper = new BillStorageDatabaseHelper(getContext());
    }

    @PluginMethod
    public void getItem(PluginCall call) {
        String key = call.getString("key");
        if (key == null || key.trim().isEmpty()) {
            call.reject("key is required");
            return;
        }

        JSObject result = new JSObject();
        result.put("value", databaseHelper.getValue(key));
        call.resolve(result);
    }

    @PluginMethod
    public void setItem(PluginCall call) {
        String key = call.getString("key");
        String value = call.getString("value");
        if (key == null || key.trim().isEmpty()) {
            call.reject("key is required");
            return;
        }

        if (value == null) {
            call.reject("value is required");
            return;
        }

        databaseHelper.putValue(key, value);
        call.resolve();
    }

    private static class BillStorageDatabaseHelper extends SQLiteOpenHelper {
        private static final String DATABASE_NAME = "billbuddy.db";
        private static final int DATABASE_VERSION = 1;
        private static final String TABLE_NAME = "storage_entries";
        private static final String COLUMN_KEY = "storage_key";
        private static final String COLUMN_VALUE = "storage_value";

        BillStorageDatabaseHelper(android.content.Context context) {
            super(context, DATABASE_NAME, null, DATABASE_VERSION);
        }

        @Override
        public void onCreate(SQLiteDatabase database) {
            database.execSQL(
                    "CREATE TABLE IF NOT EXISTS " + TABLE_NAME + " ("
                            + COLUMN_KEY + " TEXT PRIMARY KEY, "
                            + COLUMN_VALUE + " TEXT NOT NULL)"
            );
        }

        @Override
        public void onUpgrade(SQLiteDatabase database, int oldVersion, int newVersion) {
        }

        String getValue(String key) {
            SQLiteDatabase database = getReadableDatabase();
            try (Cursor cursor = database.query(
                    TABLE_NAME,
                    new String[]{COLUMN_VALUE},
                    COLUMN_KEY + " = ?",
                    new String[]{key},
                    null,
                    null,
                    null,
                    "1"
            )) {
                if (!cursor.moveToFirst()) {
                    return null;
                }

                return cursor.getString(0);
            }
        }

        void putValue(String key, String value) {
            SQLiteDatabase database = getWritableDatabase();
            ContentValues contentValues = new ContentValues();
            contentValues.put(COLUMN_KEY, key);
            contentValues.put(COLUMN_VALUE, value);
            database.insertWithOnConflict(TABLE_NAME, null, contentValues, SQLiteDatabase.CONFLICT_REPLACE);
        }
    }
}
