package com.heyshishu.nativecalls

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.provider.Settings
import android.view.WindowManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class CallPermissionsModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "ShishuCallPermissions"

  private var wakeLock: PowerManager.WakeLock? = null

  @ReactMethod
  fun canUseFullScreenIntent(promise: Promise) {
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    promise.resolve(Build.VERSION.SDK_INT < 34 || manager.canUseFullScreenIntent())
  }

  @ReactMethod
  fun openFullScreenIntentSettings() {
    if (Build.VERSION.SDK_INT >= 34) {
      val intent = Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:${context.packageName}"))
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }
  }

  @ReactMethod
  fun setCallScreenVisible(visible: Boolean) {
    val activity = context.currentActivity ?: return
    activity.runOnUiThread {
      if (Build.VERSION.SDK_INT >= 27) {
        activity.setShowWhenLocked(visible)
        activity.setTurnScreenOn(visible)
      } else {
        val flags = WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
        if (visible) activity.window.addFlags(flags) else activity.window.clearFlags(flags)
      }
    }
  }

  /**
   * Native OS background sleep via Handler(Looper.getMainLooper()).postDelayed.
   * Unlike React Native's JS setTimeout which pauses when Choreographer suspends in background,
   * this native Android Handler runs reliably on the Android Looper regardless of app activity lifecycle.
   */
  @ReactMethod
  fun sleep(millis: Double, promise: Promise) {
    val delay = millis.toLong().coerceAtLeast(0L)
    Handler(Looper.getMainLooper()).postDelayed({
      promise.resolve(true)
    }, delay)
  }

  /**
   * Acquire a partial CPU WakeLock to prevent CPU throttling/sleep during active audio sampling.
   */
  @ReactMethod
  fun acquireWakeLock(timeoutMs: Double, promise: Promise) {
    try {
      val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
      if (wakeLock?.isHeld == true) {
        wakeLock?.release()
      }
      val timeout = timeoutMs.toLong().coerceAtLeast(1000L)
      wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "HeyShishu:AudioRecordingWakeLock")
      wakeLock?.setReferenceCounted(false)
      wakeLock?.acquire(timeout)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }

  /**
   * Release the CPU WakeLock when audio sampling completes.
   */
  @ReactMethod
  fun releaseWakeLock(promise: Promise) {
    try {
      if (wakeLock?.isHeld == true) {
        wakeLock?.release()
      }
      wakeLock = null
      promise.resolve(true)
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }

  /**
   * Start native Android safety monitor service to catch onTaskRemoved() swipe-kill events.
   */
  @ReactMethod
  fun startSafetyMonitor(config: ReadableMap, promise: Promise) {
    try {
      val intent = Intent(context, ShishuSafetyMonitorService::class.java).apply {
        if (config.hasKey("bookingId")) putExtra("bookingId", config.getString("bookingId"))
        if (config.hasKey("shiftId")) putExtra("shiftId", config.getString("shiftId"))
        if (config.hasKey("token")) putExtra("token", config.getString("token"))
        if (config.hasKey("apiBaseUrl")) putExtra("apiBaseUrl", config.getString("apiBaseUrl"))
      }
      context.startService(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }

  /**
   * Stop native Android safety monitor service when shift completes or nanny logs out.
   */
  @ReactMethod
  fun stopSafetyMonitor(promise: Promise) {
    try {
      val prefs = context.getSharedPreferences(ShishuSafetyMonitorService.PREFS_NAME, Context.MODE_PRIVATE)
      prefs.edit().putBoolean("isMonitoringActive", false).apply()
      val intent = Intent(context, ShishuSafetyMonitorService::class.java)
      context.stopService(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.resolve(false)
    }
  }
}
