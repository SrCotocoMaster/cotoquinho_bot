import express from 'express';
import { AudioService } from '../Services/AudioService';
import { AudioPlayerStatus } from '@discordjs/voice';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Music from '../Models/Music';
import Playlist from '../Models/Playlist';

const router = express.Router();
const audioService = AudioService.getInstance();

// Multer setup for uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

router.post('/play', async (req, res) => {
    const { guildId, channelId, url } = req.body;
    if (!guildId || !url) return res.status(400).json({ error: 'Missing Data' });

    try {
        const state = audioService.getState(guildId);
        state.queue.push(url);

        await audioService.innerPlay(guildId, url, channelId);

        res.json({ success: true, title: state.current });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/stop', (req, res) => {
    const { guildId } = req.body;
    audioService.stop(guildId);
    res.json({ success: true });
});

router.post('/pause', (req, res) => {
    const { guildId } = req.body;
    audioService.pause(guildId);
    res.json({ success: true });
});

router.post('/resume', (req, res) => {
    const { guildId } = req.body;
    audioService.resume(guildId);
    res.json({ success: true });
});

router.get('/status', (req, res) => {
    const { guildId } = req.query;
    const state = audioService.getState(guildId as string);
    res.json({
        status: state.player.state.status,
        current: state.current,
        queue: state.queue.length,
        history: state.history.length
    });
});

router.post('/skip', async (req, res) => {
    const { guildId } = req.body;
    const success = await audioService.skip(guildId);
    res.json({ success });
});

router.post('/back', async (req, res) => {
    const { guildId } = req.body;
    const success = await audioService.back(guildId);
    res.json({ success });
});

router.post('/shuffle', (req, res) => {
    const { guildId } = req.body;
    const success = audioService.shuffle(guildId);
    res.json({ success });
});

router.post('/playlist/:id/play', async (req, res) => {
    try {
        const { id } = req.params;
        const { guildId, channelId, shuffle } = req.body;
        const playlist = await Playlist.findById(id);
        if (!playlist) return res.status(404).json({ error: 'Playlist não encontrada' });

        const state = audioService.getState(guildId);
        let urls = playlist.tracks.map(t => t.url);

        if (shuffle) {
            urls = urls.sort(() => Math.random() - 0.5);
        }

        state.queue.push(...urls);

        // If nothing is playing, start immediately
        if (state.player.state.status === AudioPlayerStatus.Idle) {
            await audioService.playNext(guildId);
        }

        res.json({ success: true, count: urls.length });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Library
router.get('/library', async (req, res) => {
    try {
        const { guildId } = req.query;
        const query = guildId ? { guildId } : {};
        const music = await Music.find(query);
        res.json(music);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao buscar biblioteca' });
    }
});

router.delete('/library/:id', async (req, res) => {
    try {
        await Music.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Falha ao remover da biblioteca' });
    }
});

// Playlists
router.get('/playlist/list', async (req, res) => {
    try {
        const { guildId } = req.query;
        const query = guildId ? { guildId } : {};
        const playlists = await Playlist.find(query);
        res.json(playlists);
    } catch (error) {
        res.status(500).json({ error: 'Falha ao buscar playlists' });
    }
});

router.post('/playlist', async (req, res) => {
    try {
        const playlist = new Playlist(req.body);
        await playlist.save();
        res.status(201).json(playlist);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/playlist/:id/add', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, url } = req.body;
        const playlist = await Playlist.findById(id);
        if (!playlist) return res.status(404).json({ error: 'Playlist não encontrada' });

        playlist.tracks.push({ title, url });
        await playlist.save();
        res.json(playlist);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/playlist/:id/remove/:trackIndex', async (req, res) => {
    try {
        const { id, trackIndex } = req.params;
        const playlist = await Playlist.findById(id);
        if (!playlist) return res.status(404).json({ error: 'Playlist não encontrada' });

        playlist.tracks.splice(Number(trackIndex), 1);
        await playlist.save();
        res.json(playlist);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/playlist/:id', async (req, res) => {
    try {
        await Playlist.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Upload
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        res.json({
            url: `local:${req.file.filename}`,
            filename: req.file.originalname
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
