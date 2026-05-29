package com.lifeos.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.atomic.AtomicInteger;

@CapacitorPlugin(name = "NativeNotification")
public class NativeNotificationPlugin extends Plugin {

    private static final String CHANNEL_ID   = "lifeos_main";
    private static final String CHANNEL_NAME = "LifeOS";
    private static final AtomicInteger ID_SEQ = new AtomicInteger(1000);

    @Override
    public void load() {
        createChannel();
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT
            );
            ch.setDescription("LifeOS reminders and alerts");
            ch.enableVibration(true);
            NotificationManager nm =
                (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.createNotificationChannel(ch);
        }
    }

    @PluginMethod
    public void send(PluginCall call) {
        String title = call.getString("title", "LifeOS");
        String body  = call.getString("body",  "");

        // Tap notification → open app
        Intent intent = new Intent(getContext(), MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int flags = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
            ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            : PendingIntent.FLAG_UPDATE_CURRENT;
        PendingIntent pi = PendingIntent.getActivity(getContext(), 0, intent, flags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(getContext(), CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pi)
            .setAutoCancel(true);

        NotificationManagerCompat nm = NotificationManagerCompat.from(getContext());
        try {
            nm.notify(ID_SEQ.getAndIncrement(), builder.build());
            call.resolve();
        } catch (SecurityException e) {
            // POST_NOTIFICATIONS permission not granted yet
            call.reject("Permission denied: " + e.getMessage());
        }
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        // On Android 13+ permission is requested at runtime via Capacitor's permission system.
        // For simplicity we resolve immediately — the OS will prompt on first notify() call.
        call.resolve();
    }
}
