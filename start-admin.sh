#!/bin/bash
# Art Portfolio Admin — 起動スクリプト

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=3003
URL="http://localhost:${PORT}/admin"

# すでに起動中なら止める
OLD_PID=$(lsof -ti:${PORT} 2>/dev/null)
if [ -n "$OLD_PID" ]; then
  kill "$OLD_PID" 2>/dev/null
  sleep 1
fi

# サーバー起動
cd "$SCRIPT_DIR"
node server.js &
SERVER_PID=$!

# ブラウザが開くまで待機（最大10秒）
for i in $(seq 1 10); do
  sleep 1
  if curl -s "$URL" > /dev/null 2>&1; then
    break
  fi
done

# ブラウザを開く
if command -v xdg-open &>/dev/null; then
  xdg-open "$URL"
elif command -v open &>/dev/null; then
  open "$URL"
fi

echo "Admin server PID: $SERVER_PID"
echo "URL: $URL"

# サーバープロセスを待つ（スクリプトが閉じるまでサーバーを維持）
wait $SERVER_PID
