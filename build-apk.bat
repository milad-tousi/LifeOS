@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   LifeOS Android APK Builder
echo ============================================
echo.

REM ── 1. Locate Android SDK ───────────────────────────────────────────────────
if defined ANDROID_HOME (
    echo [OK] ANDROID_HOME already set: %ANDROID_HOME%
    goto :sdk_found
)

REM Try every known location
for %%P in (
    "%LOCALAPPDATA%\Android\Sdk"
    "%APPDATA%\Android\Sdk"
    "C:\Android\Sdk"
    "C:\Users\%USERNAME%\AppData\Local\Android\Sdk"
    "D:\Android\Sdk"
    "%PROGRAMFILES%\Android\Sdk"
    "%LOCALAPPDATA%\Android\android-sdk"
) do (
    if exist "%%~P\platforms" (
        set "ANDROID_HOME=%%~P"
        echo [OK] Found Android SDK at: %%~P
        goto :sdk_found
    )
)

echo [ERROR] Android SDK not found in any standard location.
echo.
echo Checked locations:
echo   %%LOCALAPPDATA%%\Android\Sdk  (most common)
echo   C:\Android\Sdk
echo   D:\Android\Sdk
echo.
echo Solutions:
echo   1. Install Android Studio: https://developer.android.com/studio
echo      SDK installs automatically to %%LOCALAPPDATA%%\Android\Sdk
echo   2. Or set ANDROID_HOME manually before running this script:
echo      set ANDROID_HOME=C:\path\to\your\Android\Sdk
echo      build-apk.bat
echo.
pause
exit /b 1

:sdk_found

REM ── 2. Check Java ────────────────────────────────────────────────────────────
java -version >nul 2>&1
if errorlevel 1 (
    REM Try Android Studio bundled JDK
    for %%P in (
        "%PROGRAMFILES%\Android\Android Studio\jbr"
        "%PROGRAMFILES%\Android\Android Studio\jre"
        "C:\Program Files\Android\Android Studio\jbr"
    ) do (
        if exist "%%~P\bin\java.exe" (
            set "JAVA_HOME=%%~P"
            set "PATH=%%~P\bin;%PATH%"
            echo [OK] Using Android Studio JDK: %%~P
            goto :java_found
        )
    )
    echo [ERROR] Java not found. Install JDK 17+ from https://adoptium.net
    pause
    exit /b 1
)
:java_found
echo [OK] Java found

REM ── 3. Build web assets ──────────────────────────────────────────────────────
set "SCRIPT_DIR=%~dp0"
set "ANDROID_DIR=%SCRIPT_DIR%android"
set "ASSETS_DIR=%ANDROID_DIR%\app\src\main\assets\public"

cd /d "%SCRIPT_DIR%"

echo [BUILD] Building web assets with Vite ...
call npx vite build --outDir dist-android
if errorlevel 1 (
    echo [ERROR] Vite build failed.
    pause
    exit /b 1
)
echo [OK] Web assets built.

echo [COPY] Copying assets to Android project ...
if not exist "%ASSETS_DIR%" mkdir "%ASSETS_DIR%"
xcopy /E /Y /Q "dist-android\*" "%ASSETS_DIR%\" >nul
echo [OK] Assets copied.
echo.

REM ── 4. Navigate to android folder ────────────────────────────────────────────
if not exist "%ANDROID_DIR%\gradlew.bat" (
    echo [ERROR] android\gradlew.bat not found.
    pause
    exit /b 1
)

cd /d "%ANDROID_DIR%"
echo [OK] Working in: %ANDROID_DIR%
echo.

REM ── 5. Build debug APK ───────────────────────────────────────────────────────
echo [BUILD] Running Gradle assembleDebug ...
echo (This may take several minutes on first run)
echo.

call gradlew.bat assembleDebug
if errorlevel 1 (
    echo.
    echo [ERROR] Gradle build failed. Check the output above.
    pause
    exit /b 1
)

REM ── 6. Copy APK to project root ──────────────────────────────────────────────
set "APK_SRC=%ANDROID_DIR%\app\build\outputs\apk\debug\app-debug.apk"
set "APK_DST=%SCRIPT_DIR%LifeOS-debug.apk"

if exist "%APK_SRC%" (
    copy /Y "%APK_SRC%" "%APK_DST%" >nul
    echo.
    echo ============================================
    echo   BUILD SUCCESSFUL
    echo   APK: %APK_DST%
    echo ============================================
) else (
    echo [ERROR] APK not found at: %APK_SRC%
    pause
    exit /b 1
)

echo.
pause
