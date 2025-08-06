@echo off
REM 🧪 Script de Verificación de Estabilidad - Windows
REM Social Media Sentiment Analysis V2
REM Versión: 1.0.0-stable

echo 🚀 Iniciando verificación de estabilidad...

REM Verificar Node.js y npm
echo 📦 Verificando entorno...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no encontrado
    exit /b 1
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm no encontrado
    exit /b 1
)

REM Verificar Angular CLI
ng version >nul 2>&1
if errorlevel 1 (
    echo ❌ Angular CLI no encontrado
    exit /b 1
)

REM Build de producción
echo 🔨 Compilando para producción...
call ng build --configuration production
if errorlevel 1 (
    echo ❌ Error en build de producción
    exit /b 1
)

REM Verificar archivos críticos
echo 📋 Verificando archivos críticos...
set "files=src\app\app.component.ts src\app\features\login\login.component.ts src\app\features\dashboard\home\home.component.ts src\app\features\campaign-wizard\campaign-wizard.component.ts src\app\core\auth\services\auth.service.ts src\app\core\services\sentiment-analysis.service.ts"

for %%f in (%files%) do (
    if exist "%%f" (
        echo ✅ %%f
    ) else (
        echo ❌ %%f - FALTANTE
        exit /b 1
    )
)

REM Verificar estructura de build
echo 🏗️ Verificando estructura de build...
if exist "dist\social-media-sentimental-v2" (
    echo ✅ Build directory exists
    
    if exist "dist\social-media-sentimental-v2\index.html" (
        echo ✅ index.html generado
    ) else (
        echo ❌ index.html faltante
        exit /b 1
    )
) else (
    echo ❌ Build directory faltante
    exit /b 1
)

REM Verificar configuración
echo ⚙️ Verificando configuración...
if exist "angular.json" if exist "package.json" if exist "tsconfig.json" (
    echo ✅ Archivos de configuración presentes
) else (
    echo ❌ Archivos de configuración faltantes
    exit /b 1
)

echo.
echo 🎉 ¡VERIFICACIÓN COMPLETA!
echo.
echo ✅ Estado: ESTABLE
echo 📊 Versión: 1.0.0-stable  
echo 🌐 URL Local: http://localhost:4200
echo 📚 Documentación: VERSION.md
echo.
echo 🔐 Credenciales de prueba:
echo    admin / admin123
echo    manager / manager123
echo    analyst / analyst123
echo.
echo 🚀 Listo para demos y desarrollo!
echo.
pause
