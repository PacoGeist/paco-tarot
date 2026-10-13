package com.bek.tarot;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Base64;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONObject;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/index.html";
    private static final int REQ_FILE = 11, REQ_SAVE = 12, REQ_NOTIF = 13, REQ_CAM = 14;
    private PermissionRequest pendingCam;

    private WebView web;
    private FrameLayout root;
    private ValueCallback<Uri[]> fileCallback;
    private byte[] pendingSave;
    private boolean dayTheme = false;
    private String nightColor = "#0B0812";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#0B0812"));
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0B0812"));
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);

        // keep content clear of the status / navigation bars and the keyboard (edge-to-edge on Android 15+)
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int l, t, r, b;
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets in = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.ime() | WindowInsets.Type.displayCutout());
                l = in.left; t = in.top; r = in.right; b = in.bottom;
            } else {
                l = insets.getSystemWindowInsetLeft(); t = insets.getSystemWindowInsetTop();
                r = insets.getSystemWindowInsetRight(); b = insets.getSystemWindowInsetBottom();
            }
            v.setPadding(l, t, r, b);
            return insets;
        });

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);   // lets the scanner's live camera preview play
        s.setTextZoom(100);
        s.setCacheMode(WebSettings.LOAD_NO_CACHE);

        web.addJavascriptInterface(new Bridge(), "AndroidBridge");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (HOST.equals(u.getHost())) return asset(u.getPath());
                if ("data".equals(u.getScheme()) || "blob".equals(u.getScheme())) return null;
                // the app is fully offline: block anything else
                return new WebResourceResponse("text/plain", "utf-8", 404, "Offline", new HashMap<>(), new ByteArrayInputStream(new byte[0]));
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            // the camera, used only by My Decks → scan your cards (the page asks; Android asks you once)
            @Override
            public void onPermissionRequest(PermissionRequest req) {
                runOnUiThread(() -> {
                    boolean cam = false;
                    for (String r : req.getResources()) if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) cam = true;
                    if (!cam || !HOST.equals(req.getOrigin().getHost())) { req.deny(); return; }
                    if (checkSelfPermission(android.Manifest.permission.CAMERA) == android.content.pm.PackageManager.PERMISSION_GRANTED) req.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                    else { if (pendingCam != null) pendingCam.deny(); pendingCam = req; requestPermissions(new String[]{android.Manifest.permission.CAMERA}, REQ_CAM); }
                });
            }

            @Override
            public boolean onShowFileChooser(WebView w, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = cb;
                Intent intent;
                try {
                    intent = params.createIntent();
                    String[] types = params.getAcceptTypes();
                    boolean image = types != null && types.length > 0 && types[0].startsWith("image");
                    if (!image) { intent.setType("*/*"); }
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    startActivityForResult(Intent.createChooser(intent, image ? "Choose a picture" : "Choose a file"), REQ_FILE);
                } catch (Exception e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }
        });

        MoonAlarms.channel(this);
        String hash = getIntent() != null ? getIntent().getStringExtra("hash") : null;
        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl(START + (hash != null && hash.startsWith("#/") ? hash : ""));
    }

    private WebResourceResponse asset(String path) {
        if (path == null || path.equals("/") || path.isEmpty()) path = "/index.html";
        try {
            InputStream in = getAssets().open("www" + path);
            Map<String, String> h = new HashMap<>();
            h.put("Access-Control-Allow-Origin", "*");
            h.put("Cache-Control", "no-cache");
            return new WebResourceResponse(mime(path), mime(path).startsWith("text") || path.endsWith(".js") ? "utf-8" : null, 200, "OK", h, in);
        } catch (Exception e) {
            return new WebResourceResponse("text/plain", "utf-8", 404, "Not found", new HashMap<>(), new ByteArrayInputStream(new byte[0]));
        }
    }

    private static String mime(String p) {
        p = p.toLowerCase();
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js")) return "application/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".webp")) return "image/webp";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".woff2")) return "font/woff2";
        return "application/octet-stream";
    }

    class Bridge {
        @JavascriptInterface
        public void saveFile(String name, String mimeType, String b64) {
            pendingSave = Base64.decode(b64, Base64.DEFAULT);
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType(mimeType);
                i.putExtra(Intent.EXTRA_TITLE, name);
                try { startActivityForResult(i, REQ_SAVE); }
                catch (Exception e) { Toast.makeText(MainActivity.this, "No file app available", Toast.LENGTH_LONG).show(); }
            });
        }

        /* ---- version & updates (Settings → Check for updates) ---- */
        @JavascriptInterface
        public String appInfo() {
            try {
                android.content.pm.PackageInfo pi = getPackageManager().getPackageInfo(getPackageName(), 0);
                long code = Build.VERSION.SDK_INT >= 28 ? pi.getLongVersionCode() : pi.versionCode;
                return new JSONObject().put("code", code).put("name", pi.versionName).put("platform", "android").toString();
            } catch (Exception e) { return "{\"platform\":\"android\"}"; }
        }

        @JavascriptInterface
        public void checkUpdate() {
            new Thread(() -> {
                String body = null, err = null;
                try { body = fetchText(siteUrl() + "version.json"); }
                catch (Exception e) { err = e.getMessage() == null ? "No connection" : e.getMessage(); }
                final String js = "window.onAppUpdate && window.onAppUpdate(" + (body == null ? "null" : JSONObject.quote(body)) + "," + (err == null ? "null" : JSONObject.quote(err)) + ")";
                runOnUiThread(() -> web.evaluateJavascript(js, null));
            }).start();
        }

        @JavascriptInterface
        public void openUrl(String url) {
            if (url == null || !url.startsWith("https://")) return;
            runOnUiThread(() -> { try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception ignored) { } });
        }

        /* ---- moon notifications ---- */
        @JavascriptInterface
        public String notifState() {
            android.app.NotificationManager nm = getSystemService(android.app.NotificationManager.class);
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) return "ask";
            return nm != null && !nm.areNotificationsEnabled() ? "off" : "granted";
        }

        @JavascriptInterface
        public void requestNotif() {
            runOnUiThread(() -> {
                if (Build.VERSION.SDK_INT >= 33) requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIF);
                else web.evaluateJavascript("window.onNotifPermission && window.onNotifPermission(" + JSONObject.quote(notifState()) + ")", null);
            });
        }

        @JavascriptInterface
        public void openNotifSettings() {
            runOnUiThread(() -> {
                try {
                    Intent i = new Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, getPackageName());
                    startActivity(i);
                } catch (Exception ignored) { }
            });
        }

        @JavascriptInterface
        public int setMoonAlerts(String json) { MoonAlarms.save(MainActivity.this, json); return MoonAlarms.count(MainActivity.this); }

        @JavascriptInterface
        public void testNotification(String title, String text) { MoonAlarms.show(MainActivity.this, title, text, 1); }

        @JavascriptInterface
        public void setTheme(String t) {
            // "day", "night" or "night:#rrggbb" (the chosen background colour)
            String[] p = String.valueOf(t).split(":", 2);
            dayTheme = "day".equals(p[0]);
            nightColor = p.length > 1 && p[1].matches("#[0-9a-fA-F]{6}") ? p[1] : "#0B0812";
            runOnUiThread(MainActivity.this::applyBars);
        }
    }

    @SuppressWarnings("deprecation")
    private void applyBars() {
        int c = Color.parseColor(dayTheme ? "#EFE3C8" : nightColor);
        Window w = getWindow();
        root.setBackgroundColor(c);
        w.getDecorView().setBackgroundColor(c);
        if (Build.VERSION.SDK_INT < 35) { w.setStatusBarColor(c); w.setNavigationBarColor(c); }
        if (Build.VERSION.SDK_INT >= 30 && w.getInsetsController() != null) {
            int light = android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
            w.getInsetsController().setSystemBarsAppearance(dayTheme ? light : 0, light);
        } else if (Build.VERSION.SDK_INT >= 23) {
            View d = w.getDecorView();
            int f = d.getSystemUiVisibility();
            f = dayTheme ? (f | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR) : (f & ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
            d.setSystemUiVisibility(f);
        }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == REQ_FILE) {
            if (fileCallback != null) {
                Uri[] r = null;
                if (res == RESULT_OK && data != null) {
                    if (data.getData() != null) r = new Uri[]{data.getData()};
                    else if (data.getClipData() != null && data.getClipData().getItemCount() > 0) r = new Uri[]{data.getClipData().getItemAt(0).getUri()};
                }
                fileCallback.onReceiveValue(r);
                fileCallback = null;
            }
        } else if (req == REQ_SAVE) {
            if (res == RESULT_OK && data != null && data.getData() != null && pendingSave != null) {
                try (OutputStream os = getContentResolver().openOutputStream(data.getData())) {
                    os.write(pendingSave);
                    Toast.makeText(this, "Saved ✶", Toast.LENGTH_SHORT).show();
                } catch (Exception e) {
                    Toast.makeText(this, "Could not save: " + e.getMessage(), Toast.LENGTH_LONG).show();
                }
            }
            pendingSave = null;
        }
    }

    @Override
    public void onRequestPermissionsResult(int req, String[] perms, int[] res) {
        super.onRequestPermissionsResult(req, perms, res);
        if (req == REQ_CAM && pendingCam != null) {
            if (res.length > 0 && res[0] == android.content.pm.PackageManager.PERMISSION_GRANTED) pendingCam.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
            else pendingCam.deny();
            pendingCam = null;
        }
        if (req == REQ_NOTIF) {
            String st = res.length > 0 && res[0] == android.content.pm.PackageManager.PERMISSION_GRANTED ? "granted" : "denied";
            web.evaluateJavascript("window.onNotifPermission && window.onNotifPermission('" + st + "')", null);
        }
    }

    @Override
    protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        String hash = i.getStringExtra("hash");
        if (hash != null && hash.startsWith("#/")) web.evaluateJavascript("location.hash=" + JSONObject.quote(hash), null);
    }

    /* the app's web address comes from www/js/config.js (repo: 'user/name', or an explicit site: 'https://…/') */
    private String siteUrl() throws Exception {
        String cfg = readAsset("www/js/config.js");
        Matcher m = Pattern.compile("site\\s*:\\s*'(https://[^']+)'").matcher(cfg);
        if (m.find()) { String s = m.group(1); return s.endsWith("/") ? s : s + "/"; }
        m = Pattern.compile("repo\\s*:\\s*'([^'/]+)/([^']+)'").matcher(cfg);
        if (!m.find()) throw new Exception("No repo set in config.js");
        String user = m.group(1).toLowerCase(), name = m.group(2);
        if (user.startsWith("your-username")) throw new Exception("The app's GitHub address hasn't been set yet");
        return name.equalsIgnoreCase(user + ".github.io") ? "https://" + user + ".github.io/" : "https://" + user + ".github.io/" + name + "/";
    }

    private String readAsset(String path) throws Exception {
        try (BufferedReader r = new BufferedReader(new InputStreamReader(getAssets().open(path), "UTF-8"))) {
            StringBuilder b = new StringBuilder(); String line;
            while ((line = r.readLine()) != null) b.append(line).append('\n');
            return b.toString();
        }
    }

    private static String fetchText(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url + "?t=" + System.currentTimeMillis()).openConnection();
        c.setConnectTimeout(10000); c.setReadTimeout(10000); c.setUseCaches(false);
        c.setRequestProperty("Cache-Control", "no-cache");
        try {
            int code = c.getResponseCode();
            if (code != 200) throw new Exception("The update site answered " + code);
            try (BufferedReader r = new BufferedReader(new InputStreamReader(c.getInputStream(), "UTF-8"))) {
                StringBuilder b = new StringBuilder(); String line; int n = 0;
                while ((line = r.readLine()) != null && (n += line.length()) < 65536) b.append(line).append('\n');
                return b.toString();
            }
        } finally { c.disconnect(); }
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        web.evaluateJavascript("window.appBack ? window.appBack() : false", v -> {
            if (!"true".equals(v)) {
                if (web.canGoBack()) web.goBack(); else finish();
            }
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onPause() { super.onPause(); web.onPause(); }

    @Override
    protected void onResume() { super.onResume(); web.onResume(); }
}
