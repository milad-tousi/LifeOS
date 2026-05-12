# ساخت APK اندروید برای LifeOS

## پیش‌نیازها

1. **Android Studio** نصب کنید: https://developer.android.com/studio
   - در حین نصب، گزینه Android SDK رو تیک بزنید
   - SDK Platform برای Android 14 (API 34) یا بالاتر

2. **Node.js** نصب باشه (برای اجرای Capacitor)

---

## روش اول — خودکار با اسکریپت

```bat
build-apk.bat
```

فایل `LifeOS-debug.apk` در کنار پروژه ساخته می‌شه.

---

## روش دوم — دستی با Android Studio

```bat
npx cap open android
```

سپس در Android Studio:
- **Build → Build Bundle(s) / APK(s) → Build APK(s)**
- APK در `android/app/build/outputs/apk/debug/app-debug.apk`

---

## نصب روی گوشی

```bat
adb install LifeOS-debug.apk
```

یا فایل APK رو به گوشی انتقال بده و باز کن (تنظیمات → نصب از منابع ناشناخته).

---

## هر بار که کد تغییر کرد

```bat
npm run build
npx cap sync android
build-apk.bat
```
