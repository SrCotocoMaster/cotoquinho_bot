import express from 'express';
import { AudioService } from '../Services/AudioService';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Music } from '../Models/Music';
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
        queue: state.queue.length
    });
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

router.post('/playlist/save', async (req, res) => {
    try {
        const playlist = new Playlist(req.body);
        await playlist.save();
        res.status(201).json(playlist);
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
