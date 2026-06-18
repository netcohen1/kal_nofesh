@echo off
REM ============================================================
REM start-dev.bat - הרצת שרת פיתוח מקומי
REM ============================================================
REM מריץ שרת HTTP פשוט בפורט 5173 כדי שכל הקישורים יעבדו
REM (במקום פתיחה ישירה של file:// שגורמת לבעיות ניווט).
REM
REM במצב הזה אין Netlify Functions פעילות - האתר משתמש
REM ב-localStorage כ-fallback אוטומטית.
REM סיסמת המפרסם במצב פיתוח: demo
REM ============================================================

cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel%==0 (
  echo Starting Python HTTP server on http://localhost:5173 ...
  start "" http://localhost:5173/
  python -m http.server 5173
  goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
  echo Starting Python HTTP server on http://localhost:5173 ...
  start "" http://localhost:5173/
  py -m http.server 5173
  goto :eof
)

where node >nul 2>nul
if %errorlevel%==0 (
  echo Starting Node http-server on http://localhost:5173 ...
  start "" http://localhost:5173/
  npx --yes serve -p 5173 .
  goto :eof
)

echo.
echo Could not find Python or Node.js on this machine.
echo Please install Python (https://www.python.org/) or Node.js (https://nodejs.org/) and try again.
echo.
pause
