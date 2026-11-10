# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# Preserve Capacitor plugins and bridge
-keep public class * extends com.getcapacitor.Plugin
-keep public class * extends com.getcapacitor.Bridge
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod public *;
}
-keep class com.getcapacitor.** { *; }

# Preserve WebView interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve Line Numbers for Crash Reporting
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

