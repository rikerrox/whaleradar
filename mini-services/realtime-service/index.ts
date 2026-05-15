import { Server } from "socket.io";
import { createServer } from "http";

const PORT = 3003;

const TOKEN_SYMBOLS = ["BONK", "WIF", "PEPE", "FLOKI", "MEME", "DOGE", "SHIB", "TURBO", "BOME", "SLERF", "WEN", "MYRO", "PONKE", "POPCAT", "MEW", "NEIRO", "GOAT", "MOODENG", "FIGHT", "BABYDOGE"];
const TOKEN_NAMES = ["Bonk", "dogwifhat", "Pepe", "Floki Inu", "Memecoin", "Dogecoin", "Shiba Inu", "Turbo", "BOOK OF MEME", "Slerf", "Wen", "Myro", "Ponke", "Popcat", "Cat in a dogs world", "Neiro", "Goatseus Maximus", "Moo Deng", "Fight Club", "Baby Doge"];
const DEX_LIST = ["Raydium", "Orca", "Jupiter", "Meteora", "Phoenix"];
const WHALE_LABELS = ["Smart Whale Alpha", "Degen Master", "Sol Sniper", "Meme King", "Whale Shark", "Diamond Hands", "APE Lord", "Fast Fingers", "Crypto Sage", "Whisper Trader"];
const ALERT_TYPES = ["whale_buy", "whale_sell", "volume_spike", "new_token", "copy_trade"];

function randomBetween(min: number, max: number, decimals = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateWalletAddress(): string {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let addr = "";
  for (let i = 0; i < 44; i++) addr += chars[Math.floor(Math.random() * chars.length)];
  return addr;
}

function generateWhaleTrade() {
  const tokenIdx = Math.floor(Math.random() * TOKEN_SYMBOLS.length);
  const isBuy = Math.random() > 0.35;
  const amount = randomBetween(100, 50000);
  const price = randomBetween(0.0000001, 0.5, 10);

  return {
    id: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    walletAddress: generateWalletAddress(),
    walletLabel: randomFrom(WHALE_LABELS),
    tokenAddress: `addr-${TOKEN_SYMBOLS[tokenIdx].toLowerCase()}`,
    tokenSymbol: TOKEN_SYMBOLS[tokenIdx],
    tokenName: TOKEN_NAMES[tokenIdx],
    type: isBuy ? "buy" : "sell",
    amount,
    price,
    totalValue: Number((amount * price).toFixed(2)),
    txHash: `${Math.random().toString(36).slice(2, 10)}...${Math.random().toString(36).slice(2, 6)}`,
    dex: randomFrom(DEX_LIST),
    timestamp: new Date().toISOString(),
  };
}

function generatePriceUpdate() {
  const tokenIdx = Math.floor(Math.random() * TOKEN_SYMBOLS.length);
  const price = randomBetween(0.0000001, 0.5, 10);
  const change = randomBetween(-15, 20);

  return {
    tokenSymbol: TOKEN_SYMBOLS[tokenIdx],
    tokenName: TOKEN_NAMES[tokenIdx],
    tokenAddress: `addr-${TOKEN_SYMBOLS[tokenIdx].toLowerCase()}`,
    price,
    priceChange24h: change,
    volume24h: randomBetween(50000, 50000000),
    marketCap: randomBetween(100000, 500000000),
    timestamp: new Date().toISOString(),
  };
}

function generateAlert() {
  const type = randomFrom(ALERT_TYPES);
  const tokenIdx = Math.floor(Math.random() * TOKEN_SYMBOLS.length);
  const walletLabel = randomFrom(WHALE_LABELS);

  const titles: Record<string, string> = {
    whale_buy: "Whale Buy Detected",
    whale_sell: "Whale Sell Detected",
    volume_spike: "Volume Spike",
    new_token: "New Trending Token",
    copy_trade: "Copy Trade Executed",
  };

  const messages: Record<string, string> = {
    whale_buy: `${walletLabel} bought ${randomBetween(1000, 50000).toLocaleString()} ${TOKEN_SYMBOLS[tokenIdx]} worth $${randomBetween(1000, 25000).toLocaleString()}`,
    whale_sell: `${walletLabel} sold ${randomBetween(5000, 100000).toLocaleString()} ${TOKEN_SYMBOLS[tokenIdx]}`,
    volume_spike: `${TOKEN_SYMBOLS[tokenIdx]} volume up ${randomBetween(100, 500)}% in last hour`,
    new_token: `${TOKEN_SYMBOLS[tokenIdx]} is trending with ${Math.floor(randomBetween(50, 300))} whale entries`,
    copy_trade: `Copied ${walletLabel}: Bought ${TOKEN_SYMBOLS[tokenIdx]} worth ${randomBetween(1, 10)} SOL`,
  };

  return {
    id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    title: titles[type],
    message: messages[type],
    token: TOKEN_SYMBOLS[tokenIdx],
    isRead: false,
    channel: "browser",
    timestamp: new Date().toISOString(),
  };
}

// Create HTTP server
const httpServer = createServer();

// Create Socket.IO server with CORS
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let clientCount = 0;

io.on("connection", (socket) => {
  clientCount++;
  console.log(`[+] Client connected (${clientCount} total)`);

  // Send initial data
  socket.emit("connected", { message: "WhaleRadar Real-time Service", clientCount });
  socket.emit("whale-trade", generateWhaleTrade());
  socket.emit("price-update", generatePriceUpdate());

  // Handle client requests
  socket.on("subscribe-whale", (whaleId: string) => {
    console.log(`[→] Client subscribed to whale: ${whaleId}`);
    socket.join(`whale-${whaleId}`);
  });

  socket.on("unsubscribe-whale", (whaleId: string) => {
    console.log(`[←] Client unsubscribed from whale: ${whaleId}`);
    socket.leave(`whale-${whaleId}`);
  });

  socket.on("subscribe-token", (tokenAddress: string) => {
    console.log(`[→] Client subscribed to token: ${tokenAddress}`);
    socket.join(`token-${tokenAddress}`);
  });

  socket.on("unsubscribe-token", (tokenAddress: string) => {
    console.log(`[←] Client unsubscribed from token: ${tokenAddress}`);
    socket.leave(`token-${tokenAddress}`);
  });

  socket.on("disconnect", () => {
    clientCount--;
    console.log(`[-] Client disconnected (${clientCount} total)`);
  });
});

// Emit whale trades every 3-8 seconds
function emitWhaleTrade() {
  const trade = generateWhaleTrade();
  io.emit("whale-trade", trade);
  io.to(`whale-${trade.walletAddress}`).emit("whale-activity", {
    whaleAddress: trade.walletAddress,
    trade,
    timestamp: new Date().toISOString(),
  });
  setTimeout(emitWhaleTrade, randomBetween(3000, 8000));
}

// Emit price updates every 5-10 seconds
function emitPriceUpdate() {
  const update = generatePriceUpdate();
  io.emit("price-update", update);
  io.to(`token-${update.tokenAddress}`).emit("token-price", update);
  setTimeout(emitPriceUpdate, randomBetween(5000, 10000));
}

// Emit alerts every 15-45 seconds
function emitAlert() {
  const alert = generateAlert();
  io.emit("alert", alert);
  setTimeout(emitAlert, randomBetween(15000, 45000));
}

// Start emitting
setTimeout(emitWhaleTrade, 2000);
setTimeout(emitPriceUpdate, 5000);
setTimeout(emitAlert, 10000);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 WhaleRadar Real-time Service running on port ${PORT}`);
  console.log(`   Socket.IO endpoint: /?XTransformPort=${PORT}`);
});
