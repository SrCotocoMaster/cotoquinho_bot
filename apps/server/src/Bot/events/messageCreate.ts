import { Events, Message, Client, SlashCommandBuilder } from 'discord.js';
import Command from '../../Models/Command';
import { registerCommands } from '../handlers/registerCommands';

export default {
    name: Events.MessageCreate,
    async execute(message: Message, client: Client) {
        if (message.author.bot) return;

        // Command: !criarcomando <name> <response>
        if (message.content.startsWith('!criarcomando')) {
            const args = message.content.slice(14).trim().split(' ');
            const name = args[0]?.toLowerCase();
            const response = args.slice(1).join(' ');

            if (!name || !response) {
                return message.reply('❌ Uso incorreto: `!criarcomando <nome> <resposta>`');
            }

            // Regex validation for slash commands
            const nameRegex = /^[a-z0-9-]{1,32}$/;
            if (!nameRegex.test(name)) {
                return message.reply('❌ Nome inválido! Use apenas letras minúsculas, números e hifens (max 32 chars).');
            }

            try {
                const guildId = message.guild?.id;
                if (!guildId) return;

                // Check if exists
                const existing = await Command.findOne({ name, guildId });
                if (existing) {
                    return message.reply(`⚠️ O comando \`${name}\` já existe!`);
                }

                // Create new basic TEXT command
                const newCommand = new Command({
                    name,
                    description: 'Comando criado via chat',
                    response,
                    guildId,
                    type: 'TEXT'
                });

                await newCommand.save();
                message.reply(`✅ Comando \`${name}\` criado com sucesso! Registrando...`);

                // Sync with Discord
                await registerCommands(guildId);

                const channel = message.channel as any;
                if (channel.send) {
                    await channel.send(`🎉 Comando \`/${name}\` está pronto para uso!`);
                }

            } catch (error) {
                console.error('Erro ao criar comando via chat:', error);
                message.reply('❌ Erro ao salvar comando. Tente novamente.');
            }
        }
    },
};
