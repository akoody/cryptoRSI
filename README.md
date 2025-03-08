# Crypto RSI Scanner Bot

## Overview
This is a Telegram bot designed to monitor cryptocurrency prices on the Binance exchange, calculate RSI (Relative Strength Index) values, and notify users via Telegram when specific conditions are met. The bot supports two main functionalities:
1. Scanning all USDT trading pairs for RSI signals.
2. Monitoring BTC/USDT specifically for RSI signals.

The bot uses the `ccxt` library to fetch market data, `technicalindicators` for RSI and SMA calculations, and `telegraf` to interact with Telegram users.

## Features
- **Coin Scanner**: Scans all USDT pairs on Binance and notifies users when RSI (1m and 5m) exceeds 64 or falls below 34.
- **BTC Scanner**: Monitors BTC/USDT on a 3-minute timeframe and notifies users when RSI exceeds 61 or falls below 37.
- **Interactive Commands**: Start/stop scans, get help, or donate via Telegram commands.
- **Session Management**: Tracks individual user sessions to prevent overlapping scans.

## Prerequisites
- **Node.js**: Version 14.x or higher.
- **Telegram Account**: To create a bot and obtain a bot token via BotFather.
