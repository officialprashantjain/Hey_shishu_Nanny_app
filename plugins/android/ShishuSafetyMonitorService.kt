package com.heyshishu.nativecalls

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class ShishuSafetyMonitorService : Service() {

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent != null) {
            val bookingId = intent.getStringExtra("bookingId")
            val shiftId = intent.getStringExtra("shiftId")
            val token = intent.getStringExtra("token")
            val apiBaseUrl = intent.getStringExtra("apiBaseUrl")

            val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val editor = prefs.edit()
            if (!bookingId.isNullOrEmpty()) editor.putString("bookingId", bookingId)
            if (!shiftId.isNullOrEmpty()) editor.putString("shiftId", shiftId)
            if (!token.isNullOrEmpty()) editor.putString("token", token)
            if (!apiBaseUrl.isNullOrEmpty()) editor.putString("apiBaseUrl", apiBaseUrl)
            editor.putBoolean("isMonitoringActive", true)
            editor.apply()
        }
        return START_STICKY
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val isMonitoringActive = prefs.getBoolean("isMonitoringActive", false)

        if (isMonitoringActive) {
            val bookingId = prefs.getString("bookingId", "") ?: ""
            val shiftId = prefs.getString("shiftId", "") ?: ""
            val token = prefs.getString("token", "") ?: ""
            val apiBaseUrl = prefs.getString("apiBaseUrl", "") ?: ""

            // 1. Show high-priority warning notification on Nanny's device
            showAppClosedWarningNotification()

            // 2. Dispatch immediate HTTP emergency beacon to backend
            if (apiBaseUrl.isNotEmpty()) {
                sendAppClosedBeacon(apiBaseUrl, token, bookingId, shiftId)
            }

            // 3. Stop background process so mic cannot record in background when app is swiped away
            try {
                android.os.Process.killProcess(android.os.Process.myPid())
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        super.onTaskRemoved(rootIntent)
    }

    private fun showAppClosedWarningNotification() {
        try {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val channelId = "nanny_safety_warning_channel"

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    channelId,
                    "HeyShishu Safety Alerts",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Alerts for safety monitoring interruptions"
                    enableVibration(true)
                }
                notificationManager.createNotificationChannel(channel)
            }

            // Launch MainActivity when tapped
            val launchIntent = packageManager.getLaunchIntentForPackage(packageName) ?: Intent()
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            val pendingIntent = PendingIntent.getActivity(
                this,
                991,
                launchIntent,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE else PendingIntent.FLAG_UPDATE_CURRENT
            )

            val notification = NotificationCompat.Builder(this, channelId)
                .setSmallIcon(android.R.drawable.stat_notify_error)
                .setContentTitle("⚠️ HeyShishu Safety Service Stopped!")
                .setContentText("Do not close the app during an active shift. Tap to reopen.")
                .setStyle(NotificationCompat.BigTextStyle().bigText("Please keep the HeyShishu app running during your active childcare shift. Tap here to reopen the app and resume safety check-ins."))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .build()

            notificationManager.notify(88991, notification)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun sendAppClosedBeacon(apiBaseUrl: String, token: String, bookingId: String, shiftId: String) {
        val thread = Thread {
            try {
                val cleanBase = apiBaseUrl.trimEnd('/')
                val endpoint = if (cleanBase.endsWith("/api/v1")) {
                    "$cleanBase/session-safety/nanny-app-closed"
                } else {
                    "$cleanBase/api/v1/session-safety/nanny-app-closed"
                }

                val url = URL(endpoint)
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.connectTimeout = 4000
                conn.readTimeout = 4000
                conn.doOutput = true
                conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                if (token.isNotEmpty()) {
                    conn.setRequestProperty("Authorization", "Bearer $token")
                }

                val df = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
                df.timeZone = TimeZone.getTimeZone("UTC")

                val payload = JSONObject().apply {
                    put("bookingId", bookingId)
                    put("shiftId", shiftId)
                    put("eventType", "NANNY_APP_CLOSED")
                    put("detectedVia", "NATIVE_TASK_REMOVED")
                    put("timestamp", df.format(Date()))
                }

                OutputStreamWriter(conn.outputStream).use { writer ->
                    writer.write(payload.toString())
                    writer.flush()
                }

                val responseCode = conn.responseCode
                conn.disconnect()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        thread.start()
        try {
            thread.join(3500)
        } catch (_: Exception) {}
    }

    companion object {
        const val PREFS_NAME = "HeyShishuSafetyPrefs"
    }
}

