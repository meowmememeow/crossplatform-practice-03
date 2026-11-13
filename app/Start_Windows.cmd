@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Ошибка: Node.js не найден.
 pause
 exit /b 1
)
if not exist node_modules\electron\package.json (
 call npm.cmd ci
 if errorlevel 1 exit /b 1
)
call npm.cmd start
pause
