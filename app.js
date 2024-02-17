import ccxt  from 'ccxt';
import { RSI, SMA } from 'technicalindicators';
import axios from 'axios';
import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

const botToken = process.env.BOT_KEY;

const bot = new Telegraf(botToken);
const sessions = {};
let isRunning = false;
let isRunningBTC = false;

bot.use((ctx, next) => {
  const keyboard = Markup.keyboard([
    ['/runScan', '/stopScan'],
    ['/scanBTC', '/stopScanBTC'],
    ['/donate', '/help'],
  ]).resize();

  return next();
});

bot.start((ctx) => {
  const userId = ctx.from.id;
  sessions[userId] = { isRunning: false };
  const keyboard = Markup.keyboard([
    ['/runScan', '/stopScan'],
    ['/scanBTC', '/stopScanBTC'],
    ['/donate', '/help'],
  ]).resize();

  ctx.reply('Bot is started\n/runScan - Start searching for coins\n/stopScan - Stop searching for coins\n/scanBTC - Start scanning the BTC\n/stopScanBTC - Stop scanning the BTC\n/donate - For donate <3\n/help - For more info\n@akoooodyyyy - Founder', keyboard);
});

bot.help((ctx) => {
  const keyboard = Markup.keyboard([
    ['/runScan', '/stopScan'],
    ['/scanBTC', '/stopScanBTC'],
    ['/donate', '/help'],
  ]).resize();

  ctx.reply('Here are the available commands:\n/runScan - Start searching for coins\n/stopScan - Stop searching for coins\n/scanBTC - Start scanning the BTC\n/stopScanBTC - Stop scanning the BTC\n/donate - For donate :)\n/help - For more info', keyboard);
});

bot.command('runScan', (ctx) => {
  const userId = ctx.from.id;

  if (!sessions[userId]) {
    sessions[userId] = { isRunning: false };
  }

  const session = sessions[userId];

  if (!session.isRunning) {
    ctx.reply('Searching coins is started.').catch((error) => {
      console.error('Error sending message:', error.message);
    });
    sessions[userId].isRunning = true;
    fetchCoinsWithRSI(userId);
  } else {
    ctx.reply('Searching coins is already running.').catch((error) => {
      console.error('Error sending message:', error.message);
    });
  }
});

bot.command('stopScan', (ctx) => {
  const userId = ctx.from.id;
  const session = sessions[userId];

  if (session.isRunning) {
    session.isRunning = false;
    ctx.reply('Searching coins is stopped.');
  } else {
    ctx.reply('Searching coins is not running.');
  }
});

bot.command('donate', (ctx) => {
  ctx.reply('To improve the bot\nHere is my wallet TON\nUQDc7zu_P-5_uarOGCsMJoOQeIekQPJgkEH5KV91c5AunY-j');
});

bot.command('scanBTC', (ctx) => {
  const userId = ctx.from.id;
  if (!sessions[userId]) {
    sessions[userId] = { isRunningBTC: false };
  }

  const session = sessions[userId];

  if (!session.isRunningBTC) {
    ctx.reply('Scanning BTC is started.');
    sessions[userId].isRunningBTC = true;
    fetchBTCWithRSI(userId);
  } else {
    ctx.reply('Scanning BTC is already running.');
  }
});

bot.command('stopScanBTC', (ctx) => {
  const userId = ctx.from.id;
  const session = sessions[userId];

  if (session && session.isRunningBTC) {
    session.isRunningBTC = false;
    ctx.reply('Scanning BTC is stopped.');
  } else {
    ctx.reply('Scanning BTC is not running.');
  }
});

async function sendTelegramMessage(userId, message) {
  try {
    // console.log(`Sending message to user ${userId}: ${message}`);

    const response = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: userId,
      text: message,
    });

    return response.data;
  } catch (error) {
    console.error('Error sending Telegram message:', error.message);
    throw error;
  }
}

async function fetchBTCWithRSI(userId) {
  try {
    const exchange = new ccxt.binance();
    const btcSymbol = 'BTC/USDT';
    const session = sessions[userId];

    while (session.isRunningBTC) {
      const ohlcv3m = await exchange.fetchOHLCV(btcSymbol, '3m');
      const closePrices3m = ohlcv3m.map(candle => parseFloat(candle[4]));
      const sma3m = SMA.calculate({ values: closePrices3m, period: 14 });
      const input3m = {
        values: closePrices3m,
        period: 14,
        avgU: sma3m,
        avgD: sma3m,
      };
      const rsi3m = RSI.calculate(input3m);

      if (rsi3m[rsi3m.length - 1] > 65 || rsi3m[rsi3m.length - 1] < 33) {
        const ticker = await exchange.fetchTicker(btcSymbol);
        const price = ticker.last;
        const message = `BTC RSI (3m): ${rsi3m[rsi3m.length - 1]}, Price: ${price}`;
        await sendTelegramMessage(userId, message);
      }

      await new Promise(resolve => setTimeout(resolve, 1 * 60 * 1000));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

async function fetchCoinsWithRSI(userId) {
  try {
    const session = sessions[userId];
    if (session.isRunning) {
      const exchange = new ccxt.binance();
      const markets = await exchange.loadMarkets();
      const symbols = Object.keys(markets);
      const excludedPairs = ['WRX/USDT', 'CITY/USDT', 'ETHUP/USDT', 'REI/USDT', 'UTK/USDT', 'WRX/USDT', 'JUV/USDT', 'GHST/USDT', 'VIB/USDT', 'DF/USDT', 'BURGER/USDT', 'VIDT/USDT', 'DCR/USDT', 'LTO/USDT', 'FOR/USDT', 'VIC/USDT', 'ORN/USDT', 'FLOKI/USDT', 'PHA/USDT', 'DEGO/USDT', 'ACA/USDT', 'AMP/USDT', 'WBTC/USDT', 'ACM/USDT', 'OAX/USDT', '1000SATS/USDT', 'MLN/USDT', 'WIN/USDT', 'DIA/USDT', 'GNS/USDT', 'PROS/USDT', 'LOKA/USDT', 'CTXC/USDT', 'AEUR/USDT', 'BTCDOWN/USDT', 'USDC/USDT', 'HARD/USDT', 'QUICK/USDT', 'ETHDOWN/USDT', 'DEXE/USDT', 'NEXO/USDT', 'BAR/USDT', 'QKC/USDT', 'ERN/USDT', 'POLS/USDT', 'MOB/USDT', 'TROY/USDT', 'TKO/USDT', 'WNXM/USDT', 'WBETH/USDT', 'PIVX/USDT', 'ADX/USDT', 'EUR/USDT', 'EPX/USDT', 'USDP/USDT', 'FIS/USDT', 'FARM/USDT', 'UFT/USDT', 'FIDA/USDT', 'BSV/USDT', 'USDSB/USDT', 'TOMO/USDT', 'LEND/USDT', 'VITE/USDT', 'POND/USDT', 'VEN/USDT', 'BSV/USDT', 'USDS/USDT', 'USDSB/USDT', 'TOMO/USDT', 'PERL/USDT', 'AION/USDT', 'WTC/USDT', 'LEND/USDT', 'BNBUP/USDT', 'AUD/USDT', 'XRPUP/USDT', 'EPS/USDT', 'AUTO/USDT', 'NU/USDT', 'UST/USDT', 'NEBL/USDT', 'PNT/USDT', 'PSG/USDT', 'SYN/USDT', 'BTT/USDT', 'COCOS/USDT', 'STORM/USDT', 'HC/USDT', 'BULL/USDT', 'BKRW/USDT', 'FIO/USDT', 'OM/USDT', 'GNO/USDT', 'SANTOS/USDT', 'BIFI/USDT', 'VANRY/USDT', 'TFUEL/USDT', 'ELF/USDT', 'COS/USDT', 'VTHO/USDT', 'ASR/USDT', 'BNBDOWN/USDT'];

      for (const symbol of symbols) {
        if (!session.isRunning) {
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

          if (rsi5m[rsi5m.length - 1] > 65 || rsi5m[rsi5m.length - 1] < 32) {
            const input1m = {
              values: closePrices1m,
              period: 14,
            };
            await new Promise(resolve => setTimeout(resolve, 2500));

            const rsi1m = RSI.calculate(input1m);

            if (rsi1m[rsi1m.length - 1] > 65 || rsi1m[rsi1m.length - 1] < 32) {
              const message = `Монета: ${symbol}, Last RSI (5m): ${rsi5m[rsi5m.length - 1]}, Last RSI (1m): ${rsi1m[rsi1m.length - 1]}`;
              // console.log(message);

              if (!session.isRunning) {
                break;
              }

              await sendTelegramMessage(userId, message);
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
