#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Ошибка: Node.js не найден."
  exit 1
fi
if [ ! -d node_modules/electron ]; then npm ci || exit 1; fi
npm start
