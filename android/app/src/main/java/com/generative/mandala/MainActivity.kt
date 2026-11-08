package com.generative.mandala

import android.Manifest
import android.annotation.SuppressLint
import android.app.UiModeManager
import android.content.Context
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebViewAssetLoader

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var pendingRequest: PermissionRequest? = null

    private val isTv: Boolean by lazy {
        val uiModeManager = getSystemService(Context.UI_MODE_SERVICE) as? UiModeManager
        val isTvUi = uiModeManager?.currentModeType == Configuration.UI_MODE_TYPE_TELEVISION
        val hasLeanback = packageManager.hasSystemFeature(PackageManager.FEATURE_LEANBACK)
        val hasTelevision = packageManager.hasSystemFeature(PackageManager.FEATURE_TELEVISION)
        isTvUi || hasLeanback || hasTelevision
    }

    private val isPhilipsOled: Boolean by lazy {
        val vendor = "${Build.MANUFACTURER} ${Build.BRAND}".lowercase()
        val model = Build.MODEL.lowercase()
        (vendor.contains("philips") || vendor.contains("tp vision") || vendor.contains("tpv")) &&
            (model.contains("oled") || model.contains("809"))
    }

    private val suggestedProfile: String by lazy {
        when {
            isPhilipsOled -> "philips-oled"
            isTv -> "android-tv"
            else -> "default"
        }
    }

    inner class DeviceBridge {
        @JavascriptInterface
        fun getFormFactor(): String = if (isTv) "tv" else "mobile"

        @JavascriptInterface
        fun isTv(): Boolean = isTv

        @JavascriptInterface
        fun isPhilipsOled(): Boolean = isPhilipsOled

        @JavascriptInterface
        fun getManufacturer(): String = Build.MANUFACTURER

        @JavascriptInterface
        fun getModel(): String = Build.MODEL

        @JavascriptInterface
        fun getSuggestedProfile(): String = suggestedProfile
    }

    private fun enforceMediaAudioRouting() {
        if (!isTv) return
        try {
            val audioManager = getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return
            // Enforce standard media mode so Android TV's audio policy does not drop HDMI eARC
            audioManager.mode = AudioManager.MODE_NORMAL
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val hdmiDevice = audioManager.availableCommunicationDevices.firstOrNull {
                    it.type == AudioDeviceInfo.TYPE_HDMI ||
                    it.type == AudioDeviceInfo.TYPE_HDMI_ARC ||
                    it.type == AudioDeviceInfo.TYPE_HDMI_EARC
                }
                if (hdmiDevice != null) {
                    audioManager.setCommunicationDevice(hdmiDevice)
                }
            }
        } catch (_: Throwable) {
            // Non-fatal if platform policy restricts audio routing changes
        }
    }

    private fun clearMediaAudioRouting() {
        if (!isTv) return
        try {
            val audioManager = getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                audioManager.clearCommunicationDevice()
            }
        } catch (_: Throwable) {
            // Non-fatal if platform policy restricts audio routing changes
        }
    }

    private val audioPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            val request = pendingRequest
            pendingRequest = null
            if (request == null) return@registerForActivityResult
            if (granted) {
                request.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
                enforceMediaAudioRouting()
            } else request.deny()
        }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            hide(WindowInsetsCompat.Type.systemBars())
        }

        webView = WebView(this).apply {
            setBackgroundColor(0xFF000000.toInt())
            overScrollMode = View.OVER_SCROLL_NEVER
        }
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true // theme persistence via localStorage
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = false
        }

        // Expose hardware profile bridge to the web layer
        webView.addJavascriptInterface(DeviceBridge(), "DeviceProfile")

        // Serve bundled assets from a https origin => secure context => getUserMedia available.
        val assetLoader = WebViewAssetLoader.Builder()
            .setDomain(APP_HOST)
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView, request: WebResourceRequest
            ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread {
                    // Only trust our own origin.
                    if (request.origin.host != APP_HOST ||
                        !request.resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)
                    ) {
                        request.deny()
                        return@runOnUiThread
                    }
                    val granted = ContextCompat.checkSelfPermission(
                        this@MainActivity, Manifest.permission.RECORD_AUDIO
                    ) == PackageManager.PERMISSION_GRANTED
                    if (granted) {
                        request.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
                        enforceMediaAudioRouting()
                    } else {
                        pendingRequest?.deny()
                        pendingRequest = request
                        audioPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                    }
                }
            }

            override fun onPermissionRequestCanceled(request: PermissionRequest) {
                if (pendingRequest == request) pendingRequest = null
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })

        if (savedInstanceState == null) webView.loadUrl("https://$APP_HOST/assets/index.html")
        else webView.restoreState(savedInstanceState)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onPause() { super.onPause(); webView.onPause() }
    override fun onResume() {
        super.onResume()
        webView.onResume()
        enforceMediaAudioRouting()
    }
    override fun onStop() {
        super.onStop()
        clearMediaAudioRouting()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    private companion object {
        const val APP_HOST = "appassets.androidplatform.net"
    }
}
