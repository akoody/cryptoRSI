const ccxt = require('ccxt');
const { RSI, SMA } = require('technicalindicators');
const axios = require('axios');
const { Telegraf } = require('telegraf');

const botToken = '6720832605:AAGqeIeg9inFg29yEU0Wx0lEO2WyLpy1epQ';
const chatId = '466665934';

const bot = new Telegraf(botToken);
let isRunning = false;
let intervalId = null;

bot.start((ctx) => {
  ctx.reply('Bot is started\n/run - Start searching for coins\n/stop - Stop searching for coins\n/help for more info :)');
});

bot.help((ctx) => {
  ctx.reply('Here are the available commands:\n/run - Start searching for coins\n/stop - Stop searching for coins');
});

bot.command('run', (ctx) => {
  isRunning = true;
  ctx.reply('Searching coins is started.');
  fetchCoinsWithRSI()
});

bot.command('stop', (ctx) => {
  isRunning = false;
  ctx.reply('Searching coins is stopped.');
});

async function sendTelegramMessage(message) {
  try {
    const response = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
    });
    return response.data;
  } catch (error) {
    console.error('Error sending Telegram message:', error.message);
    throw error;
  }
}

async function fetchCoinsWithRSI() {
  try {
    const exchange = new ccxt.binance();
    const markets = await exchange.loadMarkets();
    const symbols = Object.keys(markets);
    const excludedPairs = ['VIB/USDT', 'DF/USDT', 'BURGER/USDT', 'VIDT/USDT', 'DCR/USDT', 'LTO/USDT', 'FOR/USDT', 'VIC/USDT', 'ORN/USDT', 'FLOKI/USDT', 'PHA/USDT', 'DEGO/USDT', 'ACA/USDT', 'AMP/USDT', 'WBTC/USDT', 'ACM/USDT', 'OAX/USDT', '1000SATS/USDT', 'MLN/USDT', 'WIN/USDT', 'DIA/USDT', 'GNS/USDT', 'PROS/USDT', 'LOKA/USDT', 'CTXC/USDT', 'AEUR/USDT', 'BTCDOWN/USDT', 'USDC/USDT', 'HARD/USDT', 'QUICK/USDT', 'ETHDOWN/USDT', 'DEXE/USDT', 'NEXO/USDT', 'BAR/USDT', 'QKC/USDT', 'ERN/USDT', 'POLS/USDT', 'MOB/USDT', 'TROY/USDT', 'TKO/USDT', 'WNXM/USDT', 'WBETH/USDT', 'PIVX/USDT', 'ADX/USDT', 'EUR/USDT', 'EPX/USDT', 'USDP/USDT', 'FIS/USDT', 'FARM/USDT', 'UFT/USDT', 'FIDA/USDT', 'BSV/USDT', 'USDSB/USDT', 'TOMO/USDT', 'LEND/USDT', 'VITE/USDT', 'POND/USDT', 'VEN/USDT', 'BSV/USDT', 'USDS/USDT', 'USDSB/USDT', 'TOMO/USDT', 'PERL/USDT', 'AION/USDT', 'WTC/USDT', 'LEND/USDT', 'BNBUP/USDT', 'AUD/USDT', 'XRPUP/USDT', 'EPS/USDT', 'AUTO/USDT', 'NU/USDT', 'UST/USDT', 'NEBL/USDT', 'PNT/USDT', 'PSG/USDT', 'SYN/USDT', 'BTT/USDT', 'COCOS/USDT', 'STORM/USDT', 'HC/USDT', 'BULL/USDT', 'BKRW/USDT', 'FIO/USDT', 'OM/USDT', 'GNO/USDT', 'SANTOS/USDT', 'BIFI/USDT', 'VANRY/USDT', 'TFUEL/USDT', 'ELF/USDT', 'COS/USDT', 'VTHO/USDT', 'ASR/USDT', 'BNBDOWN/USDT'];

    while (isRunning) {
      for (const symbol of symbols) {
        if (!isRunning) {
          break;
        }

        if (symbol.endsWith('USDT') || symbol.endsWith('PERP')) {
          if (symbol.includes(':USDT') || excludedPairs.includes(symbol)) {
            continue;
          }

          const ohlcv5m = await exchange.fetchOHLCV(symbol, '5m');
          const ohlcv1m = await exchange.fetchOHLCV(symbol, '1m');

          const closePrices5m = ohlcv5m.map(candle => parseFloat(candle[4]));
          const closePrices1m = ohlcv1m.map(candle => parseFloat(candle[4]));

          const sma5m = SMA.calculate({ values: closePrices5m, period: 14 });
          const input5m = {
            values: closePrices5m,
            period: 14,
            avgU: sma5m,
            avgD: sma5m,
          };
          const rsi5m = RSI.calculate(input5m);

          if (rsi5m[rsi5m.length - 1] > 50 || rsi5m[rsi5m.length - 1] < 45) {
            const input1m = {
              values: closePrices1m,
              period: 14,
            };
            await new Promise(resolve => setTimeout(resolve, 2500));

            const rsi1m = RSI.calculate(input1m);

            if (rsi1m[rsi1m.length - 1] > 50 || rsi1m[rsi1m.length - 1] < 45) {
              const message = `Монета: ${symbol}, Last RSI (5m): ${rsi5m[rsi5m.length - 1]}, Last RSI (1m): ${rsi1m[rsi1m.length - 1]}`;

              if (!isRunning) {
                break;
              }

              await sendTelegramMessage(message);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

bot.launch();
