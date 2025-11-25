#!/bin/bash

# MERN Stack Human Detection System - Startup Script

echo "🚀 Starting MERN Stack Human Detection System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js to continue."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo "✅ npm found: $(npm --version)"

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

echo "✅ Backend dependencies installed"

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo "✅ Frontend dependencies installed"
cd ..

# Start backend and frontend in parallel
echo ""
echo "🎯 Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

sleep 2

echo "🎯 Starting frontend server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ All services started successfully!"
echo ""
echo "📋 Process Information:"
echo "   Backend Server  - PID: $BACKEND_PID"
echo "   Frontend Server - PID: $FRONTEND_PID"
echo ""
echo "🌐 Access the application at: http://localhost:3000"
echo "🔌 Backend API running on: http://localhost:5000"
echo ""
echo "To stop all services, use: kill $BACKEND_PID $FRONTEND_PID"
echo "Or press Ctrl+C to stop the servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
