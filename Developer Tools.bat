@echo off
setlocal
title Jockisch Family Theater - Developer Tools

rem Always run from the folder containing this BAT file.
cd /d "%~dp0"

:menu
cls
echo.
echo ========================================
echo  Jockisch Family Theater
echo  Developer Tools
echo ========================================
echo.
echo AVAILABLE TOOLS
echo.
echo [1] Game Library Importer
echo [2] Movie Library Importer
echo.
echo [3] Close Developer Tools
echo.
set "choice="
set /p "choice=Select an option: "

if "%choice%"=="1" goto game_importer
if "%choice%"=="2" goto movie_importer
if "%choice%"=="3" goto close_tools

echo.
echo Invalid selection. Please choose 1, 2, or 3.
pause
goto menu

:game_importer
cls
echo.
echo ========================================
echo  Game Library Importer
echo ========================================
echo.
call node "tools\importers\game-importer.js"
set "tool_exit=%errorlevel%"
echo.
if not "%tool_exit%"=="0" (
    echo Game Importer exited with error code %tool_exit%.
) else (
    echo Game Importer closed successfully.
)
echo.
pause
goto menu

:movie_importer
cls
echo.
echo ========================================
echo  Movie Library Importer
echo ========================================
echo.
call node "tools\importers\movie-importer.js"
set "tool_exit=%errorlevel%"
echo.
if not "%tool_exit%"=="0" (
    echo Movie Importer exited with error code %tool_exit%.
) else (
    echo Movie Importer closed successfully.
)
echo.
pause
goto menu

:close_tools
endlocal
exit /b 0
