@echo off
echo ====================================
echo Iniciando Practica Resiliencia
echo ====================================
echo.

echo [1/4] Levantando infraestructura (Docker)...
docker-compose up -d

echo.
echo [2/4] Esperando 10 segundos para que arranque la infraestructura...
timeout /t 10 /nobreak > nul

echo.
echo [3/4] Iniciando microservicios...
echo.

echo Abriendo terminales para cada microservicio...

start "ms-gateway (Puerto 3000)" cmd /k "cd ms-gateway && npm run start:dev"
timeout /t 2 /nobreak > nul

start "ms-usuario (Puerto 3003)" cmd /k "cd ms-usuario && npm run start:dev"
timeout /t 2 /nobreak > nul

start "ms-resena (Puerto 3004)" cmd /k "cd ms-resena && npm run start:dev"

echo.
echo [4/4] Todos los microservicios iniciados!
echo.
echo ====================================
echo Servicios disponibles:
echo ====================================
echo - Gateway:  http://localhost:3000
echo - Usuario:  http://localhost:3003
echo - Resena:   http://localhost:3004
echo - RabbitMQ: http://localhost:15672 (guest/guest)
echo ====================================
echo.
echo Para detener: Cerrar las ventanas y ejecutar: docker-compose down
echo.
pause
