@echo off
setlocal
title Jockisch Family Theater - Developer Tools
cd /d "%~dp0"

:menu
cls
echo.
echo ========================================
echo  Jockisch Family Theater
echo  Developer Tools
echo ========================================
echo.
echo [1] Game Library Importer
echo [2] Movie Library Importer
echo [3] Save and Push Changes to GitHub
echo [4] Close Developer Tools
echo.
set "choice="
set /p "choice=Select an option: "

if "%choice%"=="1" goto game_importer
if "%choice%"=="2" goto movie_importer
if "%choice%"=="3" goto save_and_push
if "%choice%"=="4" goto close_tools
echo.
echo Invalid selection.
pause
goto menu

:game_importer
cls
call node "tools\importers\game-importer.js"
echo.
pause
goto menu

:movie_importer
cls
call node "tools\importers\movie-importer.js"
echo.
pause
goto menu

:save_and_push
cls
call :verify_git
if errorlevel 1 (
  pause
  goto menu
)
call :has_changes
if errorlevel 1 (
  echo No uncommitted changes were found.
  echo.
  pause
  goto menu
)
call :commit_and_push
echo.
pause
goto menu

:close_tools
cls
call :verify_git
if errorlevel 1 goto close_now
call :has_changes
if errorlevel 1 goto close_now

echo Uncommitted changes:
echo.
git status --short
echo.
set "save_before_exit="
set /p "save_before_exit=Save, commit, and push before closing? (Y/N): "
if /i "%save_before_exit%"=="Y" (
  call :commit_and_push
  if errorlevel 1 (
    echo.
    echo Save or push did not complete. Developer Tools will remain open.
    pause
    goto menu
  )
)
goto close_now

:verify_git
where git >nul 2>nul
if errorlevel 1 (
  echo Git was not found in PATH.
  exit /b 1
)
git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 (
  echo This folder is not a Git repository:
  echo %CD%
  exit /b 1
)
exit /b 0

:has_changes
git status --porcelain | findstr /r "." >nul
if errorlevel 1 exit /b 1
exit /b 0

:commit_and_push
echo Current changes:
echo.
git status --short
echo.
set "continue_save="
set /p "continue_save=Stage all listed changes? (Y/N): "
if /i not "%continue_save%"=="Y" exit /b 1

echo.
git add -A
if errorlevel 1 (
  echo Git could not stage the changes.
  exit /b 1
)

echo.
echo Files staged for commit:
echo.
git diff --cached --name-status
echo.
set "confirm_commit="
set /p "confirm_commit=Commit these staged files? (Y/N): "
if /i not "%confirm_commit%"=="Y" exit /b 1

set "commit_message="
set /p "commit_message=Commit message [Update JFT collection]: "
if not defined commit_message set "commit_message=Update JFT collection"

echo.
git commit -m "%commit_message%"
if errorlevel 1 (
  echo Git could not create the commit.
  exit /b 1
)

echo.
git push
if errorlevel 1 (
  echo The commit was created locally, but the push failed.
  exit /b 1
)

echo.
echo Changes were committed and pushed successfully.
echo GitHub Pages should begin rebuilding automatically.
exit /b 0

:close_now
endlocal
exit /b 0
