@echo off
echo ===================================================
echo   COMPILANDO APK LOCAL: CUENTAS
echo ===================================================
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=C:\Users\Burgos\AppData\Local\Android\Sdk"
cd /d "%~dp0android"
call gradlew.bat assembleRelease
echo ===================================================
echo   COMPILACION FINALIZADA
echo ===================================================
pause
