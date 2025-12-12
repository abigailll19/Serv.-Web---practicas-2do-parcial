#!/bin/bash

echo "===================================="
echo "Iniciando Practica Resiliencia"
echo "===================================="
echo ""

echo "[1/4] Levantando infraestructura (Docker)..."
docker-compose up -d

echo ""
echo "[2/4] Esperando 10 segundos para que arranque la infraestructura..."
sleep 10

echo ""
echo "[3/4] Instalando dependencias si es necesario..."
echo ""

if [ ! -d "ms-gateway/node_modules" ]; then
    echo "Instalando dependencias de ms-gateway..."
    cd ms-gateway && npm install && cd ..
fi

if [ ! -d "ms-usuario/node_modules" ]; then
    echo "Instalando dependencias de ms-usuario..."
    cd ms-usuario && npm install && cd ..
fi

if [ ! -d "ms-resena/node_modules" ]; then
    echo "Instalando dependencias de ms-resena..."
    cd ms-resena && npm install && cd ..
fi

echo ""
echo "[4/4] Iniciando microservicios..."
echo ""
echo "IMPORTANTE: Abre 3 terminales y ejecuta:"
echo ""
echo "Terminal 1: cd ms-gateway && npm run start:dev"
echo "Terminal 2: cd ms-usuario && npm run start:dev"
echo "Terminal 3: cd ms-resena && npm run start:dev"
echo ""
echo "===================================="
echo "Servicios disponibles:"
echo "===================================="
echo "- Gateway:  http://localhost:3000"
echo "- Usuario:  http://localhost:3003"
echo "- Resena:   http://localhost:3004"
echo "- RabbitMQ: http://localhost:15672 (guest/guest)"
echo "===================================="
echo ""
echo "Para detener: docker-compose down"
echo ""
