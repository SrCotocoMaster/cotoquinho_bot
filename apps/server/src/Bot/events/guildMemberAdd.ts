import { Events, GuildMember, TextChannel } from 'discord.js';
import Automation from '../../Models/Automation';
import { logActivity } from '../../Utils/Logger';

export default {
    name: Events.GuildMemberAdd,
    async execute(member: GuildMember) {
        const guildId = member.guild.id;

        try {
            // Fetch enabled welcome automations
            const automations = await Automation.find({
                guildId,
                triggerType: { $in: ['WELCOME', 'MEMBER_JOIN'] },
                enabled: true,
            });

            for (const automation of automations) {
                if (automation.action === 'SEND_MESSAGE' && automation.config.channelId) {
                    const channel = member.guild.channels.cache.get(automation.config.channelId) as TextChannel;
                    if (channel) {
                        let message = automation.config.message || 'Bem-vindo(a) {user} ao servidor!';

                        // Variable substitution
                        message = message
                            .replace(/{user}/g, `<@${member.id}>`)
                            .replace(/{username}/g, member.user.username)
                            .replace(/{server_name}/g, member.guild.name);

                        await channel.send(message);

                        await logActivity({
                            type: 'N8N_TRIGGER',
                            details: `Automação ${automation.name} executada para ${member.user.username}`,
                            guildId,
                        });
                    }
                } else if (automation.action === 'ADD_ROLE' && automation.config.roleId) {
                    const role = member.guild.roles.cache.get(automation.config.roleId);
                    if (role) {
                        await member.roles.add(role);
                        await logActivity({
                            type: 'N8N_TRIGGER',
                            details: `Cargo ${role.name} adicionado automaticamente a ${member.user.username}`,
                            guildId,
                        });
                    }
                }
            }
        } catch (error: any) {
            console.error(`[Bot] Erro ao processar automação de boas-vindas na guilda ${guildId}:`, error.message);
        }
    },
};
