@echo off
cd /d "%~dp0"
node node_modules\electron-builder\cli.js --win portable
