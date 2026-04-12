@echo off
chcp 65001 >nul
cls

echo.
echo ================================================================
echo   Testing with API Management
echo ================================================================
echo   DDCR - LOAD TEST 200K MESSAGES
echo   Sales:    13 routes x 8696 = 113.048 messages
echo   Finances: 10 routes x 8696 =  86.960 messages
echo   Total:                       200.008 messages
echo ----------------------------------------------------------------
echo   Dynamic Redis Cache lookup via Azure APIM policy
echo   Production design: runtime routing resolution via Redis
echo   SAP CPI Trial backend integration
echo ================================================================
echo.
echo Starting Sales and Finances in parallel...
echo.

start "DDCR-SALES-LOAD" cmd /k "chcp 65001 >nul && echo. && echo [SALES] Starting 113.048 messages... && echo. && newman run "%~dp0collection_sales.json" -n 8696 --delay-request 250 --reporters cli --color on && echo. && echo [SALES] LOAD TEST COMPLETED!"

timeout /t 2 /nobreak >nul

start "DDCR-FINANCES-LOAD" cmd /k "chcp 65001 >nul && echo. && echo [FINANCES] Starting 86.960 messages... && echo. && newman run "%~dp0collection_finances.json" -n 8696 --delay-request 250 --reporters cli --color on && echo. && echo [FINANCES] LOAD TEST COMPLETED!"

echo.
echo Two windows opened running in PARALLEL:
echo   - DDCR-SALES-LOAD      (113.048 messages / 250ms delay)
echo   - DDCR-FINANCES-LOAD   ( 86.960 messages / 250ms delay)
echo.
echo Wait for both windows to show: LOAD TEST COMPLETED!
echo.
pause
