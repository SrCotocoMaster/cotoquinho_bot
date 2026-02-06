import { Events, Interaction, ChatInputCommandInteraction, EmbedBuilder, PermissionsBitField } from 'discord.js';
import Command from '../../Models/Command';
import { audioService } from '../../Services/AudioService';
import { logActivity } from '../../Utils/Logger';

// Helper to replace template placeholders
const parseTemplate = (text: string, interaction: ChatInputCommandInteraction) => {
    if (!text) return '';
    return text
        .replace(/{{user}}/g, interaction.user.toString())
        .replace(/{{server}}/g, interaction.guild?.name || '')
        .replace(/{{username}}/g, interaction.user.username);
};

export default {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction) {
        if (!interaction.isChatInputCommand()) return;

        const chatInteraction = interaction as ChatInputCommandInteraction;

        // 1. Handle Custom Commands from DB
        try {
            const dbCommand = await Command.findOne({
                name: chatInteraction.commandName,
                guildId: chatInteraction.guildId
            });

            if (dbCommand) {
                const response = parseTemplate(dbCommand.response || '', chatInteraction);
                const type = dbCommand.type || 'TEXT';

                switch (type) {
                    case 'TEXT':
                    case 'REPLY':
                        await chatInteraction.reply({
                            content: response,
                            files: dbCommand.attachments
                        });
                        break;

                    case 'DM':
                        await chatInteraction.reply({ content: '📩 Enviando DMs...', ephemeral: true });
                        const targets = dbCommand.targets || [];
                        let sentCount = 0;
                        for (const targetId of targets) {
                            try {
                                const user = await chatInteraction.client.users.fetch(targetId);
                                if (user) {
                                    await user.send({ content: response, files: dbCommand.attachments });
                                    sentCount++;
                                }
                            } catch (e) { console.error(`DM Fail: ${targetId}`, e); }
                        }
                        await chatInteraction.followUp({ content: `✅ DM enviada para ${sentCount} usuários.`, ephemeral: true });
                        break;

                    case 'PLAY_MUSIC':
                        const member = chatInteraction.member as any;
                        if (!member?.voice?.channel) {
                            return chatInteraction.reply({ content: '❌ Você precisa estar em um canal de voz!', ephemeral: true });
                        }

                        await chatInteraction.deferReply();
                        const urls = dbCommand.attachments || [];
                        if (urls.length === 0) {
                            return chatInteraction.editReply('❌ Nenhuma música configurada neste comando.');
                        }

                        // Use the new AudioService
                        // For now, we play the first URL
                        await audioService.innerPlay(chatInteraction.guildId!, urls[0], member.voice.channel.id);
                        await chatInteraction.editReply(`🎶 Tocando: ${dbCommand.name} no canal ${member.voice.channel.name}`);
                        break;

                    default:
                        await chatInteraction.reply(response);
                }

                logActivity({
                    type: 'COMMAND_EXECUTED',
                    details: `Comando customizado /${chatInteraction.commandName} (${type}) executado`,
                    guildId: chatInteraction.guildId!
                });
                return;
            }
        } catch (err) {
            console.error('[Interaction] DB Command Error:', err);
        }

        // 2. Handle Native Commands (Files)
        const client = chatInteraction.client as any;
        const command = client.commands.get(chatInteraction.commandName);

        if (!command) {
            console.warn(`[Handler] Comando /${chatInteraction.commandName} não encontrado.`);
            return;
        }

        try {
            await command.execute(chatInteraction);
            logActivity({
                type: 'COMMAND_EXECUTED',
                details: `Comando nativo /${chatInteraction.commandName} executado`,
                guildId: chatInteraction.guildId!
            });
        } catch (error) {
            console.error(error);
            const msg = 'Houve um erro ao executar este comando!';
            if (chatInteraction.replied || chatInteraction.deferred) {
                await chatInteraction.followUp({ content: msg, ephemeral: true });
            } else {
                await chatInteraction.reply({ content: msg, ephemeral: true });
            }
        }
    },
};
