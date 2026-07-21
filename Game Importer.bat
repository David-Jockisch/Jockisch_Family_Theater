@echo off
setlocal

title Jockisch Family Theater - Game Importer
cd /d "%~dp0"

cls
echo ========================================
echo Jockisch Family Theater
echo Game Importer
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js was not found.
    echo Install Node.js or add it to your PATH, then try again.
    echo.
    pause
    exit /b 1
)

if not exist "tools\importers\game-importer.js" (
    echo ERROR: The importer was not found at:
    echo %~dp0tools\importers\game-importer.js
    echo.
    echo Place this BAT file in the project root.
    echo.
    pause
    exit /b 1
)

node "tools\importers\game-importer.js"
set "IMPORT_EXIT_CODE=%ERRORLEVEL%"

echo.
if not "%IMPORT_EXIT_CODE%"=="0" (
    echo The importer ended with an error.
) else (
    echo The importer has finished.
)
echo.
pause
exit /b %IMPORT_EXIT_CODE%
