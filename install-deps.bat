@echo off
echo Installing dependencies for PassWorld...

REM 获取当前node和npm的路径
for /f "usebackq tokens=*" %i in (`where node`) do set NODEPATH=%i
echo Found node at: %NODEPATH%

REM 获取node.exe所在目录
for %%i in ("%NODEPATH%") do set NODEDIR=%%~dpi
echo Node directory is: %NODEDIR%

REM 将node目录添加到PATH
set PATH=%PATH%;%NODEDIR%

REM Change to the project directory
cd /d "e:\PassWorld"

REM Install dependencies
npm install

echo.
echo Installation complete. Press any key to exit.
pause > nul