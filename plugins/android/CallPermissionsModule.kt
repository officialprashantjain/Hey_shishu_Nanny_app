package com.heyshishu.nativecalls

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.view.WindowManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class CallPermissionsModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "ShishuCallPermissions"

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
}
