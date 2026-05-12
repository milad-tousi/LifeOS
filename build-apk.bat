@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   LifeOS Android APK Builder
echo ============================================
echo.

REM ── 1. Locate Android SDK ───────────────────────────────────────────────────
REM Try common install locations if ANDROID_HOME is not set
if not defined ANDROID_HOME (
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
    ) else if exist "C:\Android\Sdk" (
        set "ANDROID_HOME=C:\Android\Sdk"
    ) else (
        echo [ERROR] ANDROID_HOME is not set and Android SDK not found.
        echo.
        echo Please install Android Studio from https://developer.android.com/studio
        echo After installation, re-run this script.
        pause
        exit /b 1
    )
)

echo [OK] Android SDK: %ANDROID_HOME%

REM ── 2. Check Java ────────────────────────────────────────────────────────────
java -version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Java not found. Android Studio bundles a JDK.
    echo Set JAVA_HOME or install JDK 17+ from https://adoptium.net
    pause
    exit /b 1
)
echo [OK] Java found

REM ── 3. Navigate to android folder ────────────────────────────────────────────
set "SCRIPT_DIR=%~dp0"
set "ANDROID_DIR=%SCRIPT_DIR%android"

if not exist "%ANDROID_DIR%\gradlew.bat" (
    echo [ERROR] android\gradlew.bat not found.
    echo Run: npx cap add android   from the project root first.
    pause
    exit /b 1
)

cd /d "%ANDROID_DIR%"
echo [OK] Working in: %ANDROID_DIR%
echo.

REM ── 4. Build debug APK ───────────────────────────────────────────────────────
echo [BUILD] Running Gradle assembleDebug ...
echo (This may take several minutes on first run while Gradle downloads dependencies)
echo.

call gradlew.bat assembleDebug --stacktrace 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Build failed. Check the output above for details.
    pause
    exit /b 1
)

REM ── 5. Find and copy APK ─────────────────────────────────────────────────────
set "APK_SRC=%ANDROID_DIR%\app\build\outputs\apk\debug\app-debug.apk"
set "APK_DST=%SCRIPT_DIR%LifeOS-debug.apk"

if exist "%APK_SRC%" (
    copy /Y "%APK_SRC%" "%APK_DST%" >nul
    echo.
    echo ============================================
    echo   BUILD SUCCESSFUL
echo   APK: %APK_DST%
echo ============================================
    echo.
    echo To install on a connected Android device:
    echo   adb install "%APK_DST%"
    echo.
    echo Or transfer the APK file to your phone and
    echo open it to install (enable Unknown Sources).
) else (
    echo [WARN] APK not found at expected path: %APK_SRC%
    echo Check android\app\build\outputs\apk\ manually.
)

pause
