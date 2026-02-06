import express from 'express';
import client from '../Bot/client';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        if (client.guilds.cache.size === 0) await client.guilds.fetch();
        const guilds = client.guilds.cache.map(g => ({
            id: g.id,
            name: g.name,
            icon: g.iconURL(),
        }));
        res.json(guilds);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao buscar guildas' });
    }
});

router.get('/:id/channels', async (req, res) => {
    try {
        const guild = await client.guilds.fetch(req.params.id);
        const channels = guild.channels.cache
            .filter(c => !c.isDMBased())
            .map(c => ({ id: c.id, name: c.name, type: c.type }));
        res.json(channels);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao buscar canais' });
    }
});

export default router;
