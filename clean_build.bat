@echo off
echo ==========================================
echo      Munawwara Care Build Script
echo ==========================================

echo [1/5] Cleaning Android Project...
if exist android (
    cd android
    call gradlew.bat clean
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Gradle clean failed.
        echo Trying to continue...
    )
    cd ..
    echo Clearing CMake cache...
    if exist android\app\.cxx rmdir /s /q android\app\.cxx
) else (
    echo Android folder not found, skipping Gradle clean.
)

echo [2/5] Regenerating Native Android Project...
SET CI=1
call npx expo prebuild --platform android --clean
if %ERRORLEVEL% NEQ 0 (
    echo Error: Prebuild failed.
    exit /b %ERRORLEVEL%
)
SET CI=

echo [2.5/5] Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: npm install failed.
    exit /b %ERRORLEVEL%
)

echo [3/5] Configuring local.properties...
echo sdk.dir=C\:\\Users\\drago\\AppData\\Local\\Android\\Sdk> android\local.properties
echo cmake.dir=C\:\\Users\\drago\\AppData\\Local\\Android\\Sdk\\cmake\\3.22.1>> android\local.properties

echo [4/5] Configuration Complete.
type android\local.properties

echo [5/5] Building and Running App...
call npx expo start --clear --android

echo ==========================================
echo           Build Process Finished
echo ==========================================
pause
