package com.redfishopensource.billbuddy;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.redfishopensource.billbuddy.plugins.BillNotificationPlugin;
import com.redfishopensource.billbuddy.plugins.BillSharePlugin;
import com.redfishopensource.billbuddy.plugins.BillStoragePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BillNotificationPlugin.class);
        registerPlugin(BillStoragePlugin.class);
        registerPlugin(BillSharePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
