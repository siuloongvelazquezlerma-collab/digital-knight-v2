package com.digitalknight.app

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.SharedPreferences
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import java.io.File

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var apkDownloadId: Long = -1
    private lateinit var prefs: SharedPreferences

    companion object {
        private const val PREFS_NAME = "DigitalKnightPrefs"
        private const val KEY_LAST_VERSION = "last_version"
        private const val KEY_FIRST_INSTALL = "first_install"
        const val CURRENT_VERSION = "1.3.7"
        private const val APK_URL = "https://digitalknightapp.com/www/apk/DK-V1.3.7.apk"
        private const val APK_NAME = "DK-V1.3.7.apk"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        webView = findViewById(R.id.webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            loadWithOverviewMode = true
            useWideViewPort = true
            builtInZoomControls = false
            displayZoomControls = false
        }

        webView.addJavascriptInterface(AndroidBridge(this), "AndroidBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
                return false
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                checkForUpdate()
            }
        }

        webView.loadUrl("file:///android_asset/www/index.html")
    }

    private fun checkForUpdate() {
        val isFirstInstall = prefs.getBoolean(KEY_FIRST_INSTALL, true)
        val lastVersion = prefs.getString(KEY_LAST_VERSION, "")

        if (isFirstInstall) {
            prefs.edit()
                .putBoolean(KEY_FIRST_INSTALL, false)
                .putString(KEY_LAST_VERSION, CURRENT_VERSION)
                .apply()
        } else if (lastVersion != CURRENT_VERSION) {
            prefs.edit().putString(KEY_LAST_VERSION, CURRENT_VERSION).apply()
            webView.postDelayed({
                webView.evaluateJavascript("if(typeof showUpdateModal === 'function') showUpdateModal()", null)
            }, 1500)
        }
    }

    inner class AndroidBridge(private val context: Context) {

        @JavascriptInterface
        fun downloadUpdate() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!packageManager.canRequestPackageInstalls()) {
                    val intent = Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES)
                        .setData(Uri.parse("package:$packageName"))
                    startActivity(intent)
                    return
                }
            }

            val downloadManager = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager

            val request = DownloadManager.Request(Uri.parse(APK_URL))
                .setTitle("Digital Knight")
                .setDescription("Descargando actualización...")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE)
                .setDestinationInExternalFilesDir(context, Environment.DIRECTORY_DOWNLOADS, APK_NAME)
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(true)

            apkDownloadId = downloadManager.enqueue(request)

            val receiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context?, intent: Intent?) {
                    val id = intent?.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1)
                    if (id == apkDownloadId) {
                        context?.unregisterReceiver(this)
                        installApk()
                    }
                }
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(receiver, IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), RECEIVER_NOT_EXPORTED)
            } else {
                registerReceiver(receiver, IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE))
            }
        }

        private fun installApk() {
            val file = File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), APK_NAME)

            if (!file.exists()) return

            val intent = Intent(Intent.ACTION_VIEW)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                val uri = FileProvider.getUriForFile(
                    context,
                    "${context.packageName}.fileprovider",
                    file
                )
                intent.setDataAndType(uri, "application/vnd.android.package-archive")
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            } else {
                intent.setDataAndType(
                    Uri.fromFile(file),
                    "application/vnd.android.package-archive"
                )
            }

            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(intent)
        }
    }
}