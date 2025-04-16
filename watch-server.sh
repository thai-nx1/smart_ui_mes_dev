#!/bin/bash

# Dừng bất kỳ process nào đang chạy trên cổng 5000
echo "Stopping any processes on port 5000..."
fuser -k 5000/tcp 2>/dev/null

# Chạy server với tsx --watch
echo "Starting server with watch mode..."
npx tsx --watch server/index.ts