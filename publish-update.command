#!/bin/zsh
cd "$(dirname "$0")" || exit 1
npm run release:publish
echo
echo "Готово. Можно закрыть это окно."
read -r "?Нажмите Enter для выхода..."
