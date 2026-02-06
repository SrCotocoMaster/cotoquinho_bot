import { ExtendedClient } from '../client';
import fs from 'fs';
import path from 'path';

export const commandHandler = (client: ExtendedClient) => {
    const commandsPath = path.join(__dirname, '../commands');
    if (!fs.existsSync(commandsPath)) return;

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if (command.data && command.execute) {
            client.commands?.set(command.data.name, command);
        }
    }
    console.log(`[Handler] ${commandFiles.length} comandos carregados.`);
};
