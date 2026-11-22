package fr.talco.calendar

import android.Manifest
import android.app.*
import android.content.*
import android.os.Build
import android.os.Bundle
import android.webkit.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat

/** Coque Android de TalcoCalendar : WebView + rappels natifs via AlarmManager. */
class MainActivity : AppCompatActivity() {
    private lateinit var web: WebView

    override fun onCreate(b: Bundle?) {
        super.onCreate(b)
        createChannel(this)
        if (Build.VERSION.SDK_INT >= 33)
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1)
        web = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            webViewClient = WebViewClient()
            addJavascriptInterface(Bridge(this@MainActivity), "TalcoAndroid")
            loadUrl("https://natlacaxi.github.io/calendar/")
        }
        setContentView(web)
    }

    override fun onBackPressed() = if (web.canGoBack()) web.goBack() else super.onBackPressed()

    class Bridge(private val c: Context) {
        @JavascriptInterface
        fun schedule(id: String, title: String, body: String, at: Double) {
            val am = c.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val i = Intent(c, Reminder::class.java).putExtra("t", title).putExtra("b", body)
            val pi = PendingIntent.getBroadcast(c, id.hashCode(), i,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            if (at > System.currentTimeMillis()) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at.toLong(), pi)
        }
    }

    class Reminder : BroadcastReceiver() {
        override fun onReceive(c: Context, i: Intent) {
            createChannel(c)
            val n = NotificationCompat.Builder(c, "talco")
                .setSmallIcon(android.R.drawable.ic_popup_reminder)
                .setContentTitle(i.getStringExtra("t")).setContentText(i.getStringExtra("b"))
                .setAutoCancel(true).setPriority(NotificationCompat.PRIORITY_HIGH).build()
            (c.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
                .notify((System.nanoTime() % 100000).toInt(), n)
        }
    }

    companion object {
        fun createChannel(c: Context) {
            if (Build.VERSION.SDK_INT >= 26)
                (c.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(
                    NotificationChannel("talco", "Rappels TalcoCalendar", NotificationManager.IMPORTANCE_HIGH))
        }
    }
}
