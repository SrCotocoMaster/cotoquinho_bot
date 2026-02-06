import express from 'express';
import Command from '../Models/Command';
import { logActivity } from '../Utils/Logger';

const router = express.Router();

// GET all commands for a guild
router.get('/', async (req, res) => {
    try {
        const { guildId } = req.query;
        const query = guildId ? { guildId } : {};
        const commands = await Command.find(query);
        res.json(commands);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao buscar comandos' });
    }
});

// POST create new command
router.post('/', async (req, res) => {
    try {
        const command = new Command(req.body);
        await command.save();

        await logActivity({
            type: 'COMMAND_CREATE',
            details: `Comando /${command.name} criado`,
            guildId: command.guildId
        });

        res.status(201).json(command);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update command
router.put('/:id', async (req, res) => {
    try {
        const command = await Command.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!command) return res.status(404).json({ error: 'Comando não encontrado' });

        await logActivity({
            type: 'COMMAND_UPDATE',
            details: `Comando /${command.name} atualizado`,
            guildId: command.guildId
        });

        res.json(command);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE command
router.delete('/:id', async (req, res) => {
    try {
        const command = await Command.findByIdAndDelete(req.params.id);
        if (command) {
            await logActivity({
                type: 'COMMAND_DELETE',
                details: `Comando /${command.name} removido`,
                guildId: command.guildId
            });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Falha ao excluir comando' });
    }
});

export default router;
