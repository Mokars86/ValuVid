package com.valuvid.app;

import android.Manifest;
import android.app.PictureInPictureParams;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.util.Rational;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    private volatile boolean isPipActive = false;

    private class PipBridge {
        @JavascriptInterface
        public void setPipActive(boolean active) {
            isPipActive = active;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
                    getPackageManager().hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)) {
                runOnUiThread(() -> {
                    if (!isDestroyed() && !isFinishing()) {
                        try {
                            setPictureInPictureParams(buildPipParams(active));
                        } catch (Exception ignored) {}
                    }
                });
            }
        }
    }

    private PictureInPictureParams buildPipParams(boolean autoEnter) {
        PictureInPictureParams.Builder builder = new PictureInPictureParams.Builder()
                .setAspectRatio(new Rational(9, 16));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            builder.setAutoEnterEnabled(autoEnter);
        }
        return builder.build();
    }

    private void notifyWebViewPipState(boolean inPip) {
        if (this.bridge == null) return;
        WebView webView = this.bridge.getWebView();
        if (webView == null) return;
        final String js = "(function(){"
                + "window.__VALUVID_IN_PIP__=" + inPip + ";"
                + "if(document.documentElement){document.documentElement.classList.toggle('native-pip-active'," + inPip + ");}"
                + "window.dispatchEvent(new CustomEvent('valuvid-pip-change',{detail:{isInPip:" + inPip + "}}));"
                + "})();";
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Window window = getWindow();
        window.setStatusBarColor(Color.parseColor("#050608"));
        window.setNavigationBarColor(Color.parseColor("#050608"));

        // Keep content inside safe system windows so it does not overlap notch/status bar
        WindowCompat.setDecorFitsSystemWindows(window, true);

        // Set status bar icons (clock, battery, 4G/WiFi) to WHITE
        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, window.getDecorView());
        if (insetsController != null) {
            insetsController.setAppearanceLightStatusBars(false); // false = white icons
            insetsController.setAppearanceLightNavigationBars(false);
        }

        // Request runtime permissions for Camera and Audio recording
        requestMediaPermissions();

        // Enable unmuted media autoplay without requiring user gesture & register PiP bridge
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
            this.bridge.getWebView().addJavascriptInterface(new PipBridge(), "ValuVidNative");
        }
    }

    @Override
    public void onUserLeaveHint() {
        super.onUserLeaveHint();
        if (isPipActive && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
                !isInPictureInPictureMode() &&
                getPackageManager().hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)) {
            try {
                enterPictureInPictureMode(buildPipParams(true));
            } catch (Exception ignored) {}
        }
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode, Configuration newConfig) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);
        notifyWebViewPipState(isInPictureInPictureMode);
    }

    @Override
    public void onStop() {
        super.onStop();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && isInPictureInPictureMode()) {
            return;
        }
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            webView.post(() -> webView.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('valuvid-native-stop'));",
                    null
            ));
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
        }
    }

    private void requestMediaPermissions() {
        List<String> permissions = new ArrayList<>();
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.CAMERA);
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            permissions.add(Manifest.permission.RECORD_AUDIO);
        }

        if (!permissions.isEmpty()) {
            ActivityCompat.requestPermissions(this, permissions.toArray(new String[0]), 101);
        }
    }
}
