import express from 'express';
import Log from '../Models/Log';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { guildId } = req.query;
        if (!guildId) return res.status(400).json({ error: 'guildId required' });

        const query = guildId === 'global' ? {} : { guildId };
        const logs = await Log.find(query).sort({ timestamp: -1 }).limit(50);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao buscar logs' });
    }
});

export default router;
