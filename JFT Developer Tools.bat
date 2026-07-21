@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem ============================================================
rem Jockisch Family Theater - Developer Tools Launcher v1.1
rem Place this file in the project root beside package.json.
rem ============================================================

cd /d "%~dp0"
title Jockisch Family Theater ^| Developer Tools
color 0A
mode con: cols=78 lines=30 >nul 2>&1

set "DIVIDER=----------------------------------------------------------------------------"
set "IMPORTER=tools\importers\game-importer.js"

:menu
cls
call :header

echo.
echo                         AVAILABLE TOOLS
echo.
echo                 [ 1 ]  Game Library Importer
echo.
echo                 [ 2 ]  Close Developer Tools
echo.
echo %DIVIDER%
echo.
set "MENU_CHOICE="
set /p "MENU_CHOICE=  Enter selection: "

if "%MENU_CHOICE%"=="1" goto game_importer
if "%MENU_CHOICE%"=="2" goto exit_launcher

echo.
echo   [!] Invalid selection. Please enter 1 or 2.
timeout /t 2 /nobreak >nul
goto menu

:game_importer
cls
call :header

echo.
echo   TOOL:     Game Library Importer
echo   STATUS:   Checking requirements...
echo.
echo %DIVIDER%
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo   [ERROR] Node.js was not found in your system PATH.
    echo.
    echo   Install Node.js or add it to PATH, then try again.
    echo.
    call :return_prompt
    goto menu
)

if not exist "%IMPORTER%" (
    echo   [ERROR] The Game Importer could not be found.
    echo.
    echo   Expected location:
    echo   %CD%\%IMPORTER%
    echo.
    echo   Make sure this launcher is stored in the project root.
    echo.
    call :return_prompt
    goto menu
)

echo   [READY] Requirements passed.
echo   [START] Launching Game Library Importer...
echo.
echo %DIVIDER%
echo.

node "%IMPORTER%"
set "TOOL_EXIT_CODE=%ERRORLEVEL%"

echo.
echo %DIVIDER%
echo.
if not "%TOOL_EXIT_CODE%"=="0" (
    echo   [ERROR] The importer ended with exit code %TOOL_EXIT_CODE%.
) else (
    echo   [DONE] Game Library Importer finished successfully.
)
echo.
call :return_prompt
goto menu

:return_prompt
echo   Press any key to return to Developer Tools...
pause >nul
exit /b 0

:header
echo.
echo %DIVIDER%
echo.
echo                     JOCKISCH FAMILY THEATER
echo                         DEVELOPER TOOLS
echo.
echo                       SYSTEM MAINTENANCE
echo %DIVIDER%
exit /b 0

:exit_launcher
cls
call :header
echo.
echo.
echo                     Developer Tools Closed
echo.
echo                 Returning you to Windows...
echo.
timeout /t 1 /nobreak >nul
exit /b 0
