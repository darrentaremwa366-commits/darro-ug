@echo off
echo ========================================
echo  Copying Script Files to VSL-SCRIPTS
echo ========================================
echo.

set SRC=%~dp0
set DST=C:\Users\Lenovo\Desktop\agency\AUTOMATIONS\DAILY\VSL-SCRIPTS\

echo Source: %SRC%
echo Target: %DST%
echo.

if not exist "%DST%" (
    echo ERROR: Target folder does not exist!
    echo Expected: %DST%
    pause
    exit /b 1
)

echo --- Copying Markdown (MD) source files ---
copy /Y "%SRC%A-B-C-SCRIPTS-V1.md" "%DST%"
copy /Y "%SRC%COURSE-SCRIPTS-V1.md" "%DST%"
copy /Y "%SRC%ECOMMERCE-AUTHORITY-CONTENT-STRATEGY.md" "%DST%"
copy /Y "%SRC%DIGITAL-PRODUCT-AFRICAN-REVENUE-SYSTEMS-V1.md" "%DST%"

echo.
echo --- Copying Styled HTML documents (open in browser) ---
copy /Y "%SRC%A-B-C-SCRIPTS-V1.html" "%DST%"
copy /Y "%SRC%COURSE-SCRIPTS-V1.html" "%DST%"
copy /Y "%SRC%ECOMMERCE-AUTHORITY-CONTENT-STRATEGY.html" "%DST%"
copy /Y "%SRC%DIGITAL-PRODUCT-AFRICAN-REVENUE-SYSTEMS-V1.html" "%DST%"

echo.
echo ========================================
echo  Done! 8 files copied:
echo ========================================
echo   MARKDOWN (for editing):
echo   - A-B-C-SCRIPTS-V1.md
echo   - COURSE-SCRIPTS-V1.md
echo   - ECOMMERCE-AUTHORITY-CONTENT-STRATEGY.md
echo   - DIGITAL-PRODUCT-AFRICAN-REVENUE-SYSTEMS-V1.md
echo.
echo   HTML DOCUMENTS (double-click to view):
echo   - A-B-C-SCRIPTS-V1.html
echo   - COURSE-SCRIPTS-V1.html
echo   - ECOMMERCE-AUTHORITY-CONTENT-STRATEGY.html
echo   - DIGITAL-PRODUCT-AFRICAN-REVENUE-SYSTEMS-V1.html
echo.
echo Check folder: %DST%
echo TIP: Right-click any .html file - Open with - Browser or Word
echo.
pause
