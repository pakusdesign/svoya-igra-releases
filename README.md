# Своя игра

Локальное веб-приложение для проведения игры в формате Jeopardy / «Своя игра».

## Требования

- Node.js 20 или новее
- npm 10 или новее

Проверка версий:

```bash
node -v
npm -v
```

## Запуск в режиме разработки

Одинаково для macOS Terminal и Windows PowerShell:

```bash
npm install
npm run dev
```

После запуска открыть:

```text
http://localhost:3000
```

## Продакшен-запуск локально

```bash
npm install
npm run build
npm run start
```

## Проверка проекта

```bash
npm run check
```

Команда выполняет TypeScript-проверку и production build.

## Desktop-приложение

Для разработки desktop-версии:

```bash
npm run desktop:dev
```

Собрать приложение папкой без установщика:

```bash
npm run desktop:pack
```

Собрать установщик/архив для текущей ОС:

```bash
npm run desktop:dist
```

Отдельные команды:

```bash
npm run desktop:mac
npm run desktop:win
```

Важно: macOS-приложение лучше собирать на macOS, Windows-приложение лучше собирать на Windows. Получившийся файл из `dist/` можно переслать другому человеку, и он сможет открыть приложение кликом по иконке.

## Данные

Данные игры сохраняются в `localStorage` браузера. Это значит, что на разных компьютерах и в разных браузерах будут разные локальные данные.
