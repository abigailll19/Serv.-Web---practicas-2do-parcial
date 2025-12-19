@echo off
echo ====================================
echo Deteniendo Practica Resiliencia
echo ====================================
echo.

echo [1/2] Deteniendo infraestructura Docker...
docker-compose down

echo.
echo [2/2] Limpiando recursos...
echo.

echo ====================================
echo Sistema detenido correctamente
echo ====================================
echo.
echo Nota: Los microservicios en las otras terminales
echo tambien deben cerrarse (Ctrl+C)
echo.
pause
