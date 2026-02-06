import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import client from './Bot/client';
import { eventHandler } from './Bot/handlers/eventHandler';
import { commandHandler } from './Bot/handlers/commandHandler';
import { registerCommands } from './Bot/handlers/registerCommands';
import { connectDB } from './Configs/database';
import audioRoutes from './Routes/AudioRoutes';
import guildRoutes from './Routes/GuildRoutes';
import authRoutes from './Routes/AuthRoutes';
import commandRoutes from './Routes/CommandRoutes';
import logRoutes from './Routes/LogRoutes';

// Initialize env
dotenv.config({ path: path.join(__dirname, '../../../.env') });
console.log('[Env] Token carregado:', process.env.DISCORD_TOKEN ? 'Sim' : 'Não');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/music', audioRoutes);
app.use('/api/guilds', guildRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/commands', commandRoutes);
app.use('/api/logs', logRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', bot: client.user ? 'Online' : 'Offline' });
});

// Bot setup
eventHandler(client);
commandHandler(client);
registerCommands();

// Start Server
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[API] Servidor TS rodando na porta ${PORT}`);

    if (process.env.DISCORD_TOKEN) {
        (client as any).login(process.env.DISCORD_TOKEN)
            .then(() => console.log('[Bot] Login realizado com sucesso!'))
            .catch((err: any) => console.error('[Bot] Falha no login:', err.message));
    }
});

// Anti-Crash
process.on('unhandledRejection', (reason) => {
    console.error('[Anti-Crash] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('[Anti-Crash] Uncaught Exception:', err);
});
