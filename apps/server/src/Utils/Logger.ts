import Log from '../Models/Log';

export const logActivity = async (data: { type: string, details: string, guildId: string }) => {
    try {
        console.log(`[Log] ${data.type}: ${data.details} (${data.guildId})`);
        const log = new Log(data);
        await log.save();
    } catch (e) {
        console.error('[Logger] Failed to log:', e);
    }
};
