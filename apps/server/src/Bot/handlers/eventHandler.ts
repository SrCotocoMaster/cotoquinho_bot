import { ExtendedClient } from '../client';
import fs from 'fs';
import path from 'path';

export const eventHandler = (client: ExtendedClient) => {
    const eventsPath = path.join(__dirname, '../events');
    if (!fs.existsSync(eventsPath)) return;

    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args: any[]) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args: any[]) => event.execute(...args, client));
        }
    }
    console.log(`[Handler] ${eventFiles.length} eventos carregados.`);
};
