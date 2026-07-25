@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
title Jockisch Family Theater - Developer Console
cd /d "%~dp0"

for /F "delims=" %%E in ('echo prompt $E^| cmd') do set "ESC=%%E"

set "COPPER=%ESC%[38;2;205;127;50m"
set "LIGHT=%ESC%[38;2;240;181;116m"
set "WHITE=%ESC%[97m"
set "GRAY=%ESC%[90m"
set "GREEN=%ESC%[92m"
set "YELLOW=%ESC%[93m"
set "RED=%ESC%[91m"
set "CYAN=%ESC%[96m"
set "RESET=%ESC%[0m"
set "BOLD=%ESC%[1m"

mode con: cols=86 lines=32 >nul 2>nul

:menu
call :draw_header "DEVELOPER CONSOLE"
call :load_git_summary

echo   %GRAY%Project:%RESET%  %WHITE%%CD%%RESET%
echo   %GRAY%Branch:%RESET%   %CYAN%%git_branch%%RESET%
echo   %GRAY%Status:%RESET%   %git_status_color%%git_status_text%%RESET%
echo.
echo   %COPPER%──────────────────────────────────────────────────────────────────────────%RESET%
echo.
echo     %LIGHT%[1]%RESET%  Game Library Importer
echo          %GRAY%Add or update games in the collection.%RESET%
echo.
echo     %LIGHT%[2]%RESET%  Movie Library Importer
echo          %GRAY%Search TMDb, add metadata, and download poster artwork.%RESET%
echo.
echo     %LIGHT%[3]%RESET%  Save and Push Changes
echo          %GRAY%Stage, commit, and publish updates to GitHub.%RESET%
echo.
echo     %LIGHT%[4]%RESET%  View Git Status
echo          %GRAY%Review every changed file before publishing.%RESET%
echo.
echo     %LIGHT%[5]%RESET%  Close Developer Console
echo.
echo   %COPPER%──────────────────────────────────────────────────────────────────────────%RESET%
echo.
set "choice="
set /p "choice=  %LIGHT%Select an option:%RESET% "

if "%choice%"=="1" goto game_importer
if "%choice%"=="2" goto movie_importer
if "%choice%"=="3" goto save_and_push
if "%choice%"=="4" goto git_status
if "%choice%"=="5" goto close_tools

call :warning "Invalid selection. Please choose 1 through 5."
call :press_any_key
goto menu

:game_importer
call :draw_header "GAME LIBRARY IMPORTER"
echo   %GRAY%Launching the Game Library Importer...%RESET%
echo.
call node "tools\importers\game-importer.js"
set "tool_exit=%errorlevel%"
echo.
if not "%tool_exit%"=="0" (
  call :error_message "Game Importer exited with error code %tool_exit%."
) else (
  call :success "Game Importer finished successfully."
)
call :press_any_key
goto menu

:movie_importer
call :draw_header "MOVIE LIBRARY IMPORTER"
echo   %GRAY%Launching the Movie Library Importer...%RESET%
echo.
call node "tools\importers\movie-importer.js"
set "tool_exit=%errorlevel%"
echo.
if not "%tool_exit%"=="0" (
  call :error_message "Movie Importer exited with error code %tool_exit%."
) else (
  call :success "Movie Importer finished successfully."
)
call :press_any_key
goto menu

:git_status
call :draw_header "GIT STATUS"
call :verify_git
if errorlevel 1 (
  call :press_any_key
  goto menu
)

call :has_changes
if errorlevel 1 (
  call :success "The project is clean. There are no uncommitted changes."
) else (
  echo   %YELLOW%Pending changes:%RESET%
  echo.
  git status --short
  echo.
  echo   %GRAY%Full branch status:%RESET%
  echo.
  git status -sb
)
call :press_any_key
goto menu

:save_and_push
call :draw_header "SAVE AND PUSH CHANGES"
call :verify_git
if errorlevel 1 (
  call :press_any_key
  goto menu
)

call :has_changes
if errorlevel 1 (
  call :success "No uncommitted changes were found."
  call :press_any_key
  goto menu
)

call :commit_and_push
echo.
call :press_any_key
goto menu

:close_tools
call :draw_header "CLOSE DEVELOPER CONSOLE"
call :verify_git
if errorlevel 1 goto close_now

call :has_changes
if errorlevel 1 goto close_now

call :warning "You have uncommitted project changes."
echo.
git status --short
echo.
set "save_before_exit="
set /p "save_before_exit=  %LIGHT%Save, commit, and push before closing? (Y/N):%RESET% "

if /i "%save_before_exit%"=="Y" (
  call :commit_and_push
  if errorlevel 1 (
    echo.
    call :error_message "The save or push did not complete."
    echo   %GRAY%Developer Console will remain open so nothing is lost.%RESET%
    call :press_any_key
    goto menu
  )
)

goto close_now

:verify_git
where git >nul 2>nul
if errorlevel 1 (
  call :error_message "Git was not found in PATH."
  echo   %GRAY%Install Git or reopen this console after Git is available.%RESET%
  exit /b 1
)

git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 (
  call :error_message "This folder is not recognized as a Git repository."
  echo   %GRAY%%CD%%RESET%
  exit /b 1
)

exit /b 0

:has_changes
git status --porcelain | findstr /r "." >nul
if errorlevel 1 exit /b 1
exit /b 0

:commit_and_push
echo   %YELLOW%Current project changes:%RESET%
echo.
git status --short
echo.

set "continue_save="
set /p "continue_save=  %LIGHT%Stage all listed changes? (Y/N):%RESET% "
if /i not "%continue_save%"=="Y" (
  echo.
  call :warning "Publish canceled. No new files were staged."
  exit /b 1
)

echo.
echo   %GRAY%Staging project changes...%RESET%
git add -A
if errorlevel 1 (
  echo.
  call :error_message "Git could not stage the changes."
  exit /b 1
)

echo.
echo   %YELLOW%Files staged for commit:%RESET%
echo.
git diff --cached --name-status
echo.

set "confirm_commit="
set /p "confirm_commit=  %LIGHT%Commit these staged files? (Y/N):%RESET% "
if /i not "%confirm_commit%"=="Y" (
  echo.
  call :warning "Commit canceled. The files remain staged."
  exit /b 1
)

echo.
set "commit_message="
set /p "commit_message=  %LIGHT%Commit message [Update JFT collection]:%RESET% "
if not defined commit_message set "commit_message=Update JFT collection"

echo.
echo   %GRAY%Creating commit...%RESET%
git commit -m "%commit_message%"
if errorlevel 1 (
  echo.
  call :error_message "Git could not create the commit."
  exit /b 1
)

echo.
echo   %GRAY%Pushing the current branch to GitHub...%RESET%
git push
if errorlevel 1 (
  echo.
  call :error_message "The commit was created locally, but the GitHub push failed."
  echo   %GRAY%Choose Save and Push Changes again to retry.%RESET%
  exit /b 1
)

echo.
echo   %GREEN%╔══════════════════════════════════════════════════════════════════════╗%RESET%
echo   %GREEN%║                    GITHUB UPDATE COMPLETE                        ║%RESET%
echo   %GREEN%╚══════════════════════════════════════════════════════════════════════╝%RESET%
echo.
echo   %WHITE%Changes were committed and pushed successfully.%RESET%
echo   %GRAY%GitHub Pages should begin rebuilding automatically.%RESET%
exit /b 0

:load_git_summary
set "git_branch=Unavailable"
set "git_status_text=Git unavailable"
set "git_status_color=%RED%"

where git >nul 2>nul
if errorlevel 1 exit /b 0

git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 exit /b 0

for /f "delims=" %%B in ('git branch --show-current 2^>nul') do set "git_branch=%%B"
if not defined git_branch set "git_branch=Detached HEAD"

call :has_changes
if errorlevel 1 (
  set "git_status_text=Clean - ready"
  set "git_status_color=%GREEN%"
) else (
  for /f %%C in ('git status --porcelain ^| find /c /v ""') do set "change_count=%%C"
  set "git_status_text=%change_count% pending change(s)"
  set "git_status_color=%YELLOW%"
)
exit /b 0

:draw_header
cls
echo.
echo   %COPPER%╔══════════════════════════════════════════════════════════════════════╗%RESET%
echo   %COPPER%║%RESET%                                                                      %COPPER%║%RESET%
echo   %COPPER%║%RESET%              %BOLD%%LIGHT%J O C K I S C H   F A M I L Y   T H E A T E R%RESET%              %COPPER%║%RESET%
echo   %COPPER%║%RESET%                         %WHITE%JFT  •  %~1%RESET%                         %COPPER%║%RESET%
echo   %COPPER%║%RESET%                                                                      %COPPER%║%RESET%
echo   %COPPER%╚══════════════════════════════════════════════════════════════════════╝%RESET%
echo.
exit /b 0

:success
echo   %GREEN%[SUCCESS]%RESET% %~1
exit /b 0

:warning
echo   %YELLOW%[NOTICE]%RESET% %~1
exit /b 0

:error_message
echo   %RED%[ERROR]%RESET% %~1
exit /b 0

:press_any_key
echo.
echo   %GRAY%Press any key to return to the Developer Console...%RESET%
pause >nul
exit /b 0

:close_now
cls
echo.
echo   %COPPER%Jockisch Family Theater Developer Console closed.%RESET%
echo.
endlocal
exit /b 0
