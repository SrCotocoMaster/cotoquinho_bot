import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import Command from '../../Models/Command';
import { SlashCommandBuilder } from 'discord.js';

export const registerCommands = async (guildId?: string) => {
    const commands: any[] = [];

    // 1. Load Hardcoded Commands (Files)
    const commandsPath = path.join(__dirname, '../commands');
    if (fs.existsSync(commandsPath)) {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            if (command.data) {
                commands.push(command.data.toJSON());
            }
        }
    }

    // 2. Load Custom Commands (Database)
    // If guildId is provided, we can register specifically for that guild (faster sync)
    // Otherwise, for now, we keep them as application commands if global
    try {
        const dbCommands = await Command.find(guildId ? { guildId } : {});
        for (const dbCmd of dbCommands) {
            const slash = new SlashCommandBuilder()
                .setName(dbCmd.name)
                .setDescription(dbCmd.description || 'Comando customizado');
            commands.push(slash.toJSON());
        }
    } catch (e) {
        console.error('[REST] Error fetching DB commands:', e);
    }

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

    try {
        console.log(`[REST] Iniciando a atualização de ${commands.length} comandos slash ${guildId ? `na guilda ${guildId}` : 'globalmente'}.`);

        if (guildId) {
            await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID!, guildId),
                { body: commands },
            );
        } else {
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID!),
                { body: commands },
            );
        }

        console.log('[REST] Comandos slash registrados com sucesso.');
    } catch (error) {
        console.error('[REST] Erro ao registrar comandos:', error);
    }
};
