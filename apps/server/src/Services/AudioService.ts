import {
    createAudioPlayer,
    AudioPlayer,
    AudioPlayerStatus,
    NoSubscriberBehavior,
    VoiceConnection,
    joinVoiceChannel,
    getVoiceConnection,
    VoiceConnectionStatus,
    createAudioResource,
    StreamType
} from '@discordjs/voice';
import { spawn } from 'child_process';
import play from 'play-dl';
import path from 'path';
import fs from 'fs';
import client from '../Bot/client';
import { logActivity } from '../Utils/Logger';

export interface AudioState {
    player: AudioPlayer;
    queue: string[];
    history: string[];
    current: string | null;
    currentUrl?: string;
    volume: number;
    guildId: string;
}

export class AudioService {
    private static instance: AudioService;
    private musicStates = new Map<string, AudioState>();

    private constructor() { }

    public static getInstance(): AudioService {
        if (!AudioService.instance) {
            AudioService.instance = new AudioService();
        }
        return AudioService.instance;
    }

    public getState(guildId: string): AudioState {
        if (!this.musicStates.has(guildId)) {
            const player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Play,
                },
            });

            const state: AudioState = {
                player,
                queue: [],
                history: [],
                current: null,
                volume: 1.0,
                guildId
            };

            player.on(AudioPlayerStatus.Idle, () => {
                console.log(`[AudioService] Player Idle in ${guildId}. Checking for next track...`);
                this.playNext(guildId);
            });

            this.musicStates.set(guildId, state);
        }
        return this.musicStates.get(guildId)!;
    }

    public async playNext(guildId: string) {
        const state = this.musicStates.get(guildId);
        if (!state || state.queue.length === 0) {
            state && (state.current = null);
            return;
        }

        if (state.current) state.history.push(state.current);
        const nextUrl = state.queue.shift()!;
        await this.innerPlay(guildId, nextUrl);
    }

    public async innerPlay(guildId: string, url: string, channelId?: string) {
        const state = this.getState(guildId);
        let connection = getVoiceConnection(guildId);

        if (!connection && channelId) {
            console.log(`[AudioService] Connecting to channel ${channelId} in ${guildId}`);
            connection = joinVoiceChannel({
                channelId: channelId,
                guildId: guildId,
                adapterCreator: client.guilds.cache.get(guildId)!.voiceAdapterCreator,
            });
        }

        if (!connection) {
            console.warn(`[AudioService] No voice connection found for guild ${guildId} and no channelId provided.`);
            return;
        }

        // V43: Subscribe Player to Connection (CRITICAL FIX)
        connection.subscribe(state.player);

        // V43: DAVE / Handshake Handling
        if (connection.state.status !== VoiceConnectionStatus.Ready) {
            try {
                await new Promise<void>((resolve, reject) => {
                    const timeout = setTimeout(() => reject(new Error('Handshake timeout')), 10000);
                    connection!.once(VoiceConnectionStatus.Ready, () => {
                        clearTimeout(timeout);
                        resolve();
                    });
                });
            } catch (err: any) {
                console.error('[AudioService] Handshake error:', err.message);
            }
        }

        // V43: Set Speaking state
        try { (connection as any).setSpeaking(true); } catch (e) { }

        try {
            let targetUrl = url;
            let info: any;

            if (targetUrl.includes('music.youtube.com')) targetUrl = targetUrl.replace('music.youtube.com', 'www.youtube.com');

            // V44: Improved Search Support
            if (!targetUrl.startsWith('http') && !targetUrl.startsWith('local:')) {
                console.log(`[AudioService] Searching for: ${targetUrl}`);
                targetUrl = `ytsearch:${targetUrl}`;
            }

            if (targetUrl.startsWith('http') || targetUrl.startsWith('ytsearch:')) {
                try {
                    const searchResult = await play.search(url, { limit: 1 });
                    if (searchResult.length > 0) {
                        info = searchResult[0];
                        targetUrl = info.url;
                    }
                } catch (e) { console.error('[AudioService] Search Error:', e); }
            }

            let resource;
            if (targetUrl.startsWith('local:')) {
                const fileName = targetUrl.replace('local:', '');
                const filePath = path.join(__dirname, '../../uploads', fileName);
                console.log(`[AudioService] Playing local file: ${filePath}`);

                if (!fs.existsSync(filePath)) {
                    throw new Error(`Arquivo não encontrado: ${filePath}`);
                }

                const ffmpegArgs = ['-i', filePath, '-c:a', 'libopus', '-b:a', '96k', '-ar', '48000', '-ac', '2', '-f', 'opus', 'pipe:1'];
                const ffmpeg = spawn('ffmpeg', ffmpegArgs);

                ffmpeg.stderr.on('data', (data) => console.log(`[FFmpeg-Local] ${data}`));

                resource = createAudioResource(ffmpeg.stdout, { inputType: StreamType.OggOpus, inlineVolume: true });
            } else {
                console.log(`[AudioService] Streaming from YouTube: ${targetUrl}`);
                const ytDlp = spawn('yt-dlp', ['-f', 'ba/b[ext=webm]+wa/b', '-o', '-', '-q', '--no-warnings', targetUrl]);
                const ffmpeg = spawn('ffmpeg', ['-i', 'pipe:0', '-c:a', 'libopus', '-b:a', '96k', '-ar', '48000', '-ac', '2', '-f', 'opus', 'pipe:1']);

                ytDlp.stdout.pipe(ffmpeg.stdin);

                ytDlp.stderr.on('data', (data) => console.log(`[yt-dlp] ${data}`));
                ffmpeg.stderr.on('data', (data) => console.log(`[FFmpeg-YT] ${data}`));

                resource = createAudioResource(ffmpeg.stdout, { inputType: StreamType.OggOpus, inlineVolume: true });
            }

            resource.volume?.setVolume(state.volume);
            state.player.play(resource);

            state.current = info?.video_details?.title || path.basename(url);
            state.currentUrl = targetUrl;

            // V43: Activity Presence
            if (client.user) {
                client.user.setActivity(state.current!, { type: 2 });
            }

            logActivity({ type: 'AUDIO_PLAY', details: `Tocando: ${state.current}`, guildId });

        } catch (e: any) {
            console.error('[AudioService] Error:', e);
        }
    }

    public pause(guildId: string) {
        const state = this.musicStates.get(guildId);
        if (state) state.player.pause();
    }

    public resume(guildId: string) {
        const state = this.musicStates.get(guildId);
        if (state) state.player.unpause();
    }

    public stop(guildId: string) {
        const state = this.musicStates.get(guildId);
        if (state) {
            state.player.stop();
            getVoiceConnection(guildId)?.destroy();
            this.musicStates.delete(guildId);
        }
    }
}

export const audioService = AudioService.getInstance();
