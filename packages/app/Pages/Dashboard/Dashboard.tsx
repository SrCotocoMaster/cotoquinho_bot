import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, TextInput, Pressable, TouchableOpacity, Platform } from 'react-native'
import axios from 'axios'
import { styles } from './styles'
import { MusicAction, PlayerStatus } from './interfaces'

// Detecta se está rodando no browser/celular e ajusta o IP dinamicamente
// Se estiver no celular via 192.168.x.x, a API deve ser buscada no mesmo IP
const isWeb = typeof window !== 'undefined';
// V34.3: Use Proxy for Web to bypass Host Mode restrictions
const API_URL = isWeb
    ? '/api/proxy'
    : 'http://server:3001'; // V34.6: Internal Docker DNS

const COMMAND_TYPES = [
    { label: 'Texto Simples', value: 'TEXT' },
    { label: 'Private (DM)', value: 'DM' },
    { label: 'Canal Específico', value: 'CHANNEL' },
    { label: 'Timeout (Mute)', value: 'TIMEOUT' },
    { label: 'Banir', value: 'BAN' },
    { label: 'Kick', value: 'KICK' },
    { label: 'Tocar Música', value: 'PLAY_MUSIC' },
]

export function DashboardScreen() {
    const [status, setStatus] = useState('Checking...')
    const [logs, setLogs] = useState<string[]>([])
    const [dbCommands, setDbCommands] = useState<any[]>([])
    const [errorPopup, setErrorPopup] = useState<string | null>(null)

    // Command Form State
    const [newCmd, setNewCmd] = useState({ name: '', description: '', response: '' })
    const [commandType, setCommandType] = useState('TEXT')
    const [duration, setDuration] = useState('60')

    // Multi-Select & Media State
    const [selectedTargets, setSelectedTargets] = useState<string[]>([])
    const [mediaUrl, setMediaUrl] = useState('')
    const [attachments, setAttachments] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)

    // Resources State
    const [guilds, setGuilds] = useState<any[]>([])
    const [selectedGuild, setSelectedGuild] = useState<string | null>(null)
    const [channels, setChannels] = useState<any[]>([])
    const [members, setMembers] = useState<any[]>([])

    useEffect(() => {
        const fetchGuilds = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/guilds`)
                const allGuilds = [{ id: 'global', name: '🌍 Global / DM' }, ...res.data]
                setGuilds(allGuilds)
                if (allGuilds.length > 0 && !selectedGuild) setSelectedGuild(allGuilds[0].id)
            } catch (e) {
                setErrorPopup('Falha ao buscar Guildas. O servidor está rodando?')
            }
        }
        fetchGuilds()
    }, [])

    useEffect(() => {
        if (!selectedGuild) return

        const fetchData = async () => {
            try {
                const healthRes = await axios.get(`${API_URL}/health`)
                setStatus(healthRes.data.bot)

                const logsRes = await axios.get(`${API_URL}/api/logs?guildId=${selectedGuild}`)
                setLogs(logsRes.data.map((l: any) => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.type}: ${l.details}`))

                if (selectedGuild !== 'global') {
                    const [cRes, mRes] = await Promise.all([
                        axios.get(`${API_URL}/api/guilds/${selectedGuild}/channels`).catch(() => ({ data: [] })),
                        axios.get(`${API_URL}/api/guilds/${selectedGuild}/members`).catch(() => ({ data: [] }))
                    ])
                    setChannels(cRes.data)
                    setMembers(mRes.data)
                }
            } catch (e) { setStatus('Offline') }
        }

        fetchData()
        fetchCommands()
        const interval = setInterval(fetchData, 5000)
        return () => clearInterval(interval)
    }, [selectedGuild])

    const fetchCommands = async () => {
        if (!selectedGuild) return
        try {
            const res = await axios.get(`${API_URL}/api/commands?guildId=${selectedGuild}`)
            setDbCommands(res.data)
        } catch (e) { }
    }

    const handleFileUpload = async (event: any) => {
        const file = event.target.files?.[0];
        if (!file || !selectedGuild) return;

        if (selectedGuild === 'global') {
            alert('Atenção: Selecione um Servidor específico (não "Global") para testar áudio/upload.');
            setUploading(false);
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post(`${API_URL}/api/music/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Auto-play local file
            await axios.post(`${API_URL}/api/music/play`, {
                guildId: selectedGuild,
                channelId: selectedVoice, // FIX: Pass channel ID so bot can join
                url: res.data.url
            });
            // Alert user
            alert(`Upload OK! Tocando: ${res.data.filename}`);
        } catch (e: any) {
            const errMsg = e.response?.data?.error || e.message;
            alert(`Upload falhou: ${errMsg}`);
            console.error(e);
        } finally {
            setUploading(false);
        }
    }

    const toggleTarget = (id: string) => {
        if (selectedTargets.includes(id)) {
            setSelectedTargets(selectedTargets.filter(t => t !== id))
        } else {
            setSelectedTargets([...selectedTargets, id])
        }
    }

    const addAttachment = () => {
        if (mediaUrl) {
            setAttachments([...attachments, mediaUrl])
            setMediaUrl('')
        }
    }

    // State for Editing
    const [editingId, setEditingId] = useState<string | null>(null);

    // Music State
    const [activeTab, setActiveTab] = useState<'COMMANDS' | 'MUSIC'>('COMMANDS');
    const [musicUrl, setMusicUrl] = useState('');
    const [voiceChannels, setVoiceChannels] = useState<any[]>([]);
    const [selectedVoice, setSelectedVoice] = useState('');
    const [playerStatus, setPlayerStatus] = useState<PlayerStatus>({ status: 'Idle', current: null, queue: 0, history: 0 });
    const [playlists, setPlaylists] = useState<any[]>([]);
    const [playlistName, setPlaylistName] = useState('');
    const [stagingTracks, setStagingTracks] = useState<{ title: string, url: string }[]>([]);
    const [trackUrl, setTrackUrl] = useState('');
    const [trackTitle, setTrackTitle] = useState('');

    // V29: Library State
    const [library, setLibrary] = useState<any[]>([]);
    const fetchLibrary = async () => {
        if (!selectedGuild) return;
        try {
            const res = await axios.get(`${API_URL}/api/music/library?guildId=${selectedGuild}`);
            setLibrary(res.data);
        } catch (e) { }
    }

    useEffect(() => {
        if (activeTab === 'MUSIC' && selectedGuild) {
            fetchVoiceChannels();
            const interval = setInterval(fetchPlayerStatus, 3000);
            return () => clearInterval(interval);
        }
    }, [activeTab, selectedGuild]);

    const fetchVoiceChannels = async () => {
        if (!selectedGuild || selectedGuild === 'global') return;
        try {
            // Note: Reuse channels endpoint but filter for voice on client or backend
            // MVP: Assuming backend returns all channels or we filter what we get
            const res = await axios.get(`${API_URL}/api/guilds/${selectedGuild}/channels`)
            setVoiceChannels(res.data.filter((c: any) => c.type === 2));
        } catch (e) {
            console.error('fetchVoiceChannels error:', e)
            setVoiceChannels([])
        }
    }

    const fetchPlayerStatus = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/music/status?guildId=${selectedGuild}`)
            setPlayerStatus(res.data);
        } catch (e) { }
    }

    const fetchPlaylists = async () => {
        if (!selectedGuild) return;
        try {
            const res = await axios.get(`${API_URL}/api/music/playlist/list?guildId=${selectedGuild}`);
            setPlaylists(res.data);
        } catch (e) { }
    }

    useEffect(() => {
        let interval: any;
        if (activeTab === 'MUSIC' && selectedGuild) {
            fetchPlaylists();
            fetchPlayerStatus();
            fetchLibrary();
            fetchVoiceChannels();
            interval = setInterval(fetchPlayerStatus, 2000);
        }
        return () => clearInterval(interval);
    }, [activeTab, selectedGuild]);

    const handleAddStagingTrack = () => {
        if (!trackUrl) return;
        setStagingTracks([...stagingTracks, { title: trackTitle || 'Música Manual', url: trackUrl }]);
        setTrackUrl('');
        setTrackTitle('');
    }

    const handleSavePlaylist = async () => {
        if (!playlistName) return alert('Dê um nome para a playlist');
        try {
            await axios.post(`${API_URL}/api/music/playlist/save`, {
                guildId: selectedGuild,
                name: playlistName,
                userId: 'admin',
                tracks: stagingTracks
            });
            setPlaylistName('');
            setStagingTracks([]);
            fetchPlaylists();
            alert('Playlist salva com sucesso!');
        } catch (e) { alert('Erro ao salvar playlist'); }
    }

    const handleDeletePlaylist = async (id: string) => {
        try {
            await axios.delete(`${API_URL}/api/music/playlist/${id}`);
            fetchPlaylists();
        } catch (e) { alert('Erro ao excluir'); }
    }

    const handleLoadPlaylist = async (id: string) => {
        try {
            await axios.post(`${API_URL}/api/music/playlist/load`, {
                guildId: selectedGuild,
                playlistId: id
            });
            fetchPlayerStatus();
            alert('Playlist carregada!');
        } catch (e) { alert('Erro ao carregar playlist'); }
    }

    const handleMusicAction = async (action: MusicAction) => {
        if (!selectedGuild) return;
        try {
            if (action === 'play') {
                if (!musicUrl) return alert('Cole uma URL primeiro');
                await axios.post(`${API_URL}/api/music/play`, {
                    guildId: selectedGuild,
                    channelId: selectedVoice,
                    url: musicUrl
                });
                setMusicUrl('');
            } else {
                await axios.post(`${API_URL}/api/music/${action}`, { guildId: selectedGuild });
            }
            fetchPlayerStatus();
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message;
            const details = err.response?.data?.details ? `\nDetalhes: ${err.response.data.details}` : '';
            alert('Erro: ' + msg + details);
        }
    }

    const startEditing = (cmd: any) => {
        setEditingId(cmd._id);
        setNewCmd({
            name: cmd.name,
            description: cmd.description,
            response: cmd.response
        });
        setCommandType(cmd.type);
        setSelectedTargets(cmd.targets || []);
        setAttachments(cmd.attachments || []);
        if (cmd.options?.duration) {
            setDuration((cmd.options.duration / 1000).toString());
        }
    }

    const cancelEditing = () => {
        setEditingId(null);
        setNewCmd({ name: '', description: '', response: '' });
        setCommandType('TEXT');
        setSelectedTargets([]);
        setAttachments([]);
        setDuration('60');
    }

    const handleAddCommand = async () => {
        if (!selectedGuild) return
        try {
            const payload = {
                ...newCmd,
                guildId: selectedGuild,
                type: commandType,
                targets: selectedTargets,
                attachments: attachments,
                options: commandType === 'TIMEOUT' ? { duration: parseInt(duration) * 1000 } : {}
            }

            if (editingId) {
                // UPDATE logic
                await axios.put(`${API_URL}/api/commands/${editingId}`, payload)
                setLogs(prev => [`[${new Date().toLocaleTimeString()}] Comando /${newCmd.name} atualizado`, ...prev])
            } else {
                // CREATE logic
                await axios.post(`${API_URL}/api/commands`, payload)
                setLogs(prev => [`[${new Date().toLocaleTimeString()}] Comando /${newCmd.name} criado`, ...prev])
            }

            // Reset form
            cancelEditing();

            fetchCommands()
        } catch (err: any) {
            alert(err.response?.data?.error || 'Erro ao salvar comando')
        }
    }

    const handleDeleteCommand = async (id: string) => {
        try {
            await axios.delete(`${API_URL}/api/commands/${id}`)
            fetchCommands()
        } catch (e) { }
    }

    // Determine what list to show based on type
    const showMemberSelector = commandType === 'DM' || commandType === 'TIMEOUT' || commandType === 'BAN' || commandType === 'KICK'
    const showChannelSelector = commandType === 'CHANNEL'
    const targetList = showMemberSelector ? members : (showChannelSelector ? channels : [])

    return (
        <View style={styles.container}>
            <View style={{ padding: 20, paddingBottom: 0 }}>
                <Text style={styles.title}>Dashboard de Controle v2</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                    <Pressable onPress={() => setActiveTab('COMMANDS')} style={[styles.tab, activeTab === 'COMMANDS' && styles.activeTab]}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Comandos</Text>
                    </Pressable>
                    <Pressable onPress={() => setActiveTab('MUSIC')} style={[styles.tab, activeTab === 'MUSIC' && styles.activeTab]}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Player de Música (V41 - Trace Mode)</Text>
                    </Pressable>
                </View>

                <View style={styles.guildPicker}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {guilds.map((guild) => (
                            <Pressable
                                key={guild.id}
                                style={[styles.guildItem, selectedGuild === guild.id && styles.guildItemSelected]}
                                onPress={() => setSelectedGuild(guild.id)}
                            >
                                <Text style={styles.guildText}>{guild.name}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                {/* Error Popup */}
                {errorPopup && (
                    <TouchableOpacity
                        onPress={() => setErrorPopup(null)}
                        style={styles.errorContainer}
                    >
                        <View style={styles.errorContent}>
                            <Text style={styles.errorText}>⚠️ {errorPopup}</Text>
                            <Text style={styles.errorSubtext}>Toque para fechar</Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>

            {activeTab === 'COMMANDS' ? (
                <ScrollView style={styles.content}>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{editingId ? 'Editar Comando' : 'Criar Novo Comando'}</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Nome (ex: avisos)"
                            placeholderTextColor="#94a3b8"
                            value={newCmd.name}
                            onChangeText={(text) => setNewCmd({ ...newCmd, name: text.toLowerCase() })}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Descrição"
                            placeholderTextColor="#94a3b8"
                            value={newCmd.description}
                            onChangeText={(text) => setNewCmd({ ...newCmd, description: text })}
                        />

                        <Text style={styles.label}>Tipo de Ação:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                            {COMMAND_TYPES.map((type) => (
                                <Pressable
                                    key={type.value}
                                    style={[styles.typeItem, commandType === type.value && styles.typeItemSelected]}
                                    onPress={() => {
                                        setCommandType(type.value)
                                        setSelectedTargets([])
                                    }}
                                >
                                    <Text style={styles.typeText}>{type.label}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>

                        <View style={{ marginBottom: 12 }}>
                            <Text style={styles.label}>
                                {showMemberSelector ? 'Selecionar Usuários Alvo:' : 'Selecionar Canais Alvo:'}
                            </Text>
                            <ScrollView style={{ maxHeight: 200, marginBottom: 8 }} nestedScrollEnabled={true}>
                                <View style={styles.targetList}>
                                    {targetList.map(item => (
                                        <TouchableOpacity
                                            key={item.id}
                                            style={[styles.targetItem, selectedTargets.includes(item.id) && styles.targetItemSelected]}
                                            onPress={() => toggleTarget(item.id)}
                                        >
                                            <Text style={{ color: '#fff' }}>{item.username || item.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        {/* Media Input */}
                        <View style={{ marginBottom: 12 }}>
                            <Text style={styles.label}>
                                {commandType === 'PLAY_MUSIC' ? 'URLs do YouTube Music:' : 'Adicionar Mídia (URL):'}
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TextInput
                                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                    placeholder={commandType === 'PLAY_MUSIC' ? "https://music.youtube.com/..." : "https://..."}
                                    placeholderTextColor="#94a3b8"
                                    value={mediaUrl}
                                    onChangeText={setMediaUrl}
                                />
                                <Pressable style={[styles.button, { marginTop: 0, padding: 12 }]} onPress={addAttachment}>
                                    <Text style={styles.buttonText}>+</Text>
                                </Pressable>
                            </View>
                            {attachments.map((url, i) => (
                                <Text key={i} style={{ color: '#aaa', fontSize: 11, marginTop: 4 }}>
                                    {commandType === 'PLAY_MUSIC' ? '🎵 ' : '📎 '} {url}
                                </Text>
                            ))}
                        </View>

                        {commandType === 'TIMEOUT' && (
                            <TextInput
                                style={styles.input}
                                placeholder="Duração (segundos)"
                                placeholderTextColor="#94a3b8"
                                keyboardType="numeric"
                                value={duration}
                                onChangeText={setDuration}
                            />
                        )}

                        <View style={{ marginBottom: 10 }}>
                            <Text style={styles.label}>Mensagem / Resposta:</Text>
                            {(commandType === 'TEXT' || commandType === 'DM' || commandType === 'CHANNEL') && (
                                <Text style={{ color: '#64748b', fontSize: 10, marginBottom: 4 }}>
                                    Dica: Use {'{{user}}'} para mencionar a pessoa e {'{{server}}'} para o nome do servidor.
                                </Text>
                            )}
                            <TextInput
                                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                placeholder={commandType === 'PLAY_MUSIC' ? "Mensagem ao iniciar (opcional)" : "Olá {{user}}, bem-vindo ao {{server}}!"}
                                placeholderTextColor="#94a3b8"
                                multiline
                                value={newCmd.response}
                                onChangeText={(text) => setNewCmd({ ...newCmd, response: text })}
                            />
                        </View>

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Pressable style={[styles.button, { flex: 1, backgroundColor: editingId ? '#f59e0b' : '#6366f1' }]} onPress={handleAddCommand}>
                                <Text style={styles.buttonText}>{editingId ? 'Salvar Alterações' : 'Adicionar Comando'}</Text>
                            </Pressable>
                            {editingId && (
                                <Pressable style={[styles.button, { flex: 0.3, backgroundColor: '#64748b' }]} onPress={cancelEditing}>
                                    <Text style={styles.buttonText}>Cancelar</Text>
                                </Pressable>
                            )}
                        </View>

                        <Text style={[styles.cardTitle, { marginTop: 24 }]}>Comandos Ativos</Text>
                        {dbCommands.map((cmd) => (
                            <View key={cmd._id} style={styles.listItem}>
                                <View>
                                    <Text style={styles.listText}>/{cmd.name}</Text>
                                    <Text style={styles.listSubText}>
                                        {cmd.type} • {cmd.targets?.length || 0} alvos • {cmd.attachments?.length || 0} mídias
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <Pressable onPress={() => startEditing(cmd)}>
                                        <Text style={{ color: '#f59e0b' }}>Editar</Text>
                                    </Pressable>
                                    <Pressable onPress={() => handleDeleteCommand(cmd._id)}>
                                        <Text style={{ color: '#f87171' }}>Deletar</Text>
                                    </Pressable>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={styles.logCard}>
                        <ScrollView style={styles.logScroll} nestedScrollEnabled={true}>
                            {logs.map((log, i) => (
                                <Text key={i} style={styles.logText}>{log}</Text>
                            ))}
                        </ScrollView>
                    </View>
                </ScrollView>
            ) : (
                <ScrollView style={styles.content}>
                    {!selectedGuild ? (
                        <View style={[styles.card, { alignItems: 'center', padding: 40 }]}>
                            <Text style={{ color: '#fff', fontSize: 18 }}>Selecione um Servidor para Tocar Música 🎵</Text>
                        </View>
                    ) : (
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Player de Música: {guilds.find(g => g.id === selectedGuild)?.name}</Text>

                            <View style={{
                                height: 120, backgroundColor: '#000', borderRadius: 8, marginBottom: 20,
                                justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#333'
                            }}>
                                {/* Now Playing Header - Always Visible */}
                                {playerStatus.current && (
                                    <View style={{ position: 'absolute', top: 10, width: '100%', alignItems: 'center', zIndex: 10 }}>
                                        <Text style={{ color: '#4ade80', fontSize: 13, fontWeight: 'bold', textShadowColor: 'rgba(74, 222, 128, 0.5)', textShadowRadius: 10 }}>
                                            NOW PLAYING: {playerStatus.current}
                                        </Text>
                                    </View>
                                )}

                                {playerStatus.status?.toLowerCase() === 'playing' ? (
                                    <>
                                        {/* WMP Style Visualizer */}
                                        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 60, gap: 2, marginBottom: 10 }}>
                                            {Array.from({ length: 20 }).map((_, i) => (
                                                <VisualizerBar key={i} playing={true} />
                                            ))}
                                        </View>
                                    </>
                                ) : (
                                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                                        {playerStatus.current ? (
                                            <Text style={{ color: '#fbbf24', fontSize: 12, marginTop: 20 }}>Carregando / Pausado...</Text>
                                        ) : (
                                            <Text style={{ color: '#555', fontSize: 16 }}>Parado</Text>
                                        )}
                                    </View>
                                )}
                            </View>

                            <Text style={styles.label}>Canal de Voz (Para conectar):</Text>
                            {voiceChannels.length === 0 ? (
                                <Text style={{ color: '#f87171', marginBottom: 10, fontSize: 12 }}>Nenhum canal de voz encontrado (ou permissão negada)</Text>
                            ) : (
                                <ScrollView horizontal style={{ marginBottom: 20 }} showsHorizontalScrollIndicator={false}>
                                    {voiceChannels.map(vc => (
                                        <TouchableOpacity
                                            key={vc.id}
                                            style={[styles.typeItem, selectedVoice === vc.id && styles.typeItemSelected]}
                                            onPress={() => setSelectedVoice(vc.id)}
                                        >
                                            <Text style={styles.typeText}>🔊 {vc.name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}

                            <Text style={styles.label}>URL da Música / Vídeo:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Cole a URL do YouTube Music..."
                                placeholderTextColor="#94a3b8"
                                value={musicUrl}
                                onChangeText={setMusicUrl}
                            />

                            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 10 }}>
                                <Pressable style={[styles.navButton, { backgroundColor: '#475569' }]} onPress={() => handleMusicAction('back')}>
                                    <Text style={styles.buttonText}>⏮ Back</Text>
                                </Pressable>
                                <Pressable style={[styles.button, { flex: 1, backgroundColor: '#ef4444', marginTop: 0 }]} onPress={() => handleMusicAction('stop')}>
                                    <Text style={styles.buttonText}>⏹ Stop</Text>
                                </Pressable>
                                <Pressable style={[styles.button, { flex: 1, backgroundColor: '#eab308', marginTop: 0 }]} onPress={() => handleMusicAction('pause')}>
                                    <Text style={styles.buttonText}>⏸ Pause</Text>
                                </Pressable>
                                <Pressable style={[styles.button, { flex: 2, backgroundColor: '#22c55e', marginTop: 0 }]} onPress={() => handleMusicAction('play')}>
                                    <Text style={styles.buttonText}>▶ Play</Text>
                                </Pressable>
                                <Pressable style={[styles.navButton, { backgroundColor: '#475569' }]} onPress={() => handleMusicAction('next')}>
                                    <Text style={styles.buttonText}>Next ⏭</Text>
                                </Pressable>
                            </View>

                            <View style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 20 }}>
                                <Text style={[styles.cardTitle, { color: '#0ea5e9' }]}>📚 BIBLIOTECA DE MÚSICAS (V29)</Text>
                                <Text style={{ color: '#94a3b8', fontSize: 12, marginBottom: 10 }}>
                                    Selecione uma música já enviada ou faça um novo upload abaixo.
                                </Text>

                                {/* Dropdown para Biblioteca */}
                                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                                    <View style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' }}>
                                        {isWeb ? (
                                            // @ts-ignore
                                            <select
                                                style={{ width: '100%', padding: 12, backgroundColor: 'transparent', color: '#fff', border: 'none', outline: 'none' }}
                                                onChange={(e: any) => setMusicUrl(e.target.value)}
                                                value={musicUrl}
                                            >
                                                {/* @ts-ignore */}
                                                <option style={{ backgroundColor: '#1e293b' }} value="">-- Escolher da Biblioteca --</option>
                                                {library.map((m: any) => (
                                                    // @ts-ignore
                                                    <option key={m._id} style={{ backgroundColor: '#1e293b' }} value={`local:${m.path}`}>{m.title}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <TextInput
                                                style={{ padding: 12, color: '#fff' }}
                                                placeholder="Selecione (Web Only Dropdown)"
                                                editable={false}
                                            />
                                        )}
                                    </View>
                                    <Pressable
                                        onPress={fetchLibrary}
                                        style={({ pressed }) => [
                                            styles.navButton,
                                            { backgroundColor: pressed ? '#1e293b' : '#334155', minWidth: 50 }
                                        ]}
                                    >
                                        <Text style={{ fontSize: 18 }}>🔄</Text>
                                    </Pressable>
                                </View>

                                <Text style={[styles.cardTitle, { color: '#0ea5e9', fontSize: 13 }]}>TEST LAB: Upload Local</Text>

                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    {/* Web-only File Input */}
                                    {isWeb && (
                                        // @ts-ignore
                                        <input
                                            type="file"
                                            accept="audio/*"
                                            onChange={handleFileUpload}
                                            style={{ color: 'white' }}
                                            disabled={uploading}
                                        />
                                    )}
                                    {uploading && <Text style={{ color: '#eab308' }}>Enviando...</Text>}
                                </View>

                                {/* Play/Pause controls for Upload */}
                                <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
                                    <Pressable style={[styles.button, { flex: 1, backgroundColor: '#4ade80' }]} onPress={() => handleMusicAction('resume')}>
                                        <Text style={styles.buttonText}>▶ Play/Resume</Text>
                                    </Pressable>
                                    <Pressable style={[styles.button, { flex: 1, backgroundColor: '#eab308' }]} onPress={() => handleMusicAction('pause')}>
                                        <Text style={styles.buttonText}>⏸ Pause</Text>
                                    </Pressable>
                                    <Pressable style={[styles.button, { flex: 1, backgroundColor: '#ef4444' }]} onPress={() => handleMusicAction('stop')}>
                                        <Text style={styles.buttonText}>⏹ Stop</Text>
                                    </Pressable>
                                </View>
                            </View>

                            <View style={{ marginTop: 20, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 20 }}>
                                <Text style={styles.cardTitle}>Gerenciar Playlists</Text>

                                <View style={{ backgroundColor: '#1e293b', padding: 10, borderRadius: 8, marginBottom: 15 }}>
                                    <Text style={[styles.label, { color: '#6366f1' }]}>CONSTRUTOR MANUAL</Text>
                                    <View style={{ gap: 8 }}>
                                        <TextInput
                                            style={[styles.input, { marginBottom: 0 }]}
                                            placeholder="Título da música (ex: My Favorite Song)"
                                            placeholderTextColor="#475569"
                                            value={trackTitle}
                                            onChangeText={setTrackTitle}
                                        />
                                        <TextInput
                                            style={[styles.input, { marginBottom: 0 }]}
                                            placeholder="URL do YouTube Music..."
                                            placeholderTextColor="#475569"
                                            value={trackUrl}
                                            onChangeText={setTrackUrl}
                                        />
                                        <Pressable style={[styles.button, { backgroundColor: '#4338ca', marginTop: 5 }]} onPress={handleAddStagingTrack}>
                                            <Text style={styles.buttonText}>➕ Adicionar à Lista ({stagingTracks.length})</Text>
                                        </Pressable>
                                    </View>
                                    {stagingTracks.length > 0 && (
                                        <View style={{ marginTop: 10 }}>
                                            {stagingTracks.map((t, idx) => (
                                                <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                                                    <Text style={{ color: '#fff', fontSize: 11 }}>• {t.title}</Text>
                                                    <Pressable onPress={() => setStagingTracks(stagingTracks.filter((_, i) => i !== idx))}>
                                                        <Text style={{ color: '#ef4444', fontSize: 11 }}>Remover</Text>
                                                    </Pressable>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 15 }}>
                                    <TextInput
                                        style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                        placeholder="Nome da nova playlist..."
                                        placeholderTextColor="#94a3b8"
                                        value={playlistName}
                                        onChangeText={setPlaylistName}
                                    />
                                    <Pressable style={[styles.button, { marginTop: 0 }]} onPress={handleSavePlaylist}>
                                        <Text style={styles.buttonText}>Finalizar e Salvar</Text>
                                    </Pressable>
                                </View>

                                <Text style={styles.label}>Suas Playlists ({playlists.length}):</Text>
                                <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled={true}>
                                    {playlists.map(p => (
                                        <View key={p._id} style={[styles.listItem, { borderBottomWidth: 1, borderBottomColor: '#222' }]}>
                                            <View>
                                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{p.name}</Text>
                                                <Text style={{ color: '#94a3b8', fontSize: 10 }}>{p.tracks?.length || 0} músicas</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                                <Pressable
                                                    style={{ backgroundColor: '#22c55e22', padding: 6, borderRadius: 4, borderWidth: 1, borderColor: '#22c55e55' }}
                                                    onPress={() => handleLoadPlaylist(p._id)}
                                                >
                                                    <Text style={{ color: '#22c55e', fontSize: 11, fontWeight: 'bold' }}>Play ▶</Text>
                                                </Pressable>
                                                <Pressable
                                                    style={{ backgroundColor: '#ef444422', padding: 6, borderRadius: 4, borderWidth: 1, borderColor: '#ef444455' }}
                                                    onPress={() => handleDeletePlaylist(p._id)}
                                                >
                                                    <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: 'bold' }}>❌</Text>
                                                </Pressable>
                                            </View>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Music Activity logs */}
                            <View style={[styles.logCard, { marginTop: 20 }]}>
                                <Text style={[styles.label, { marginBottom: 8, color: '#4ade80' }]}>Monitor de Atividade (Bot):</Text>
                                <ScrollView style={styles.logScroll} nestedScrollEnabled={true}>
                                    {logs.length === 0 ? (
                                        <Text style={[styles.logText, { opacity: 0.5 }]}>Nenhuma atividade registrada ainda...</Text>
                                    ) : (
                                        logs.map((log, i) => (
                                            <Text key={i} style={styles.logText}>{log}</Text>
                                        ))
                                    )}
                                </ScrollView>
                            </View>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    )
}

const VisualizerBar = ({ playing }: { playing: boolean }) => {
    const [height, setHeight] = useState(10);
    useEffect(() => {
        if (!playing) {
            setHeight(5); // Resting height
            return;
        }
        // Randomize height to simulate spectrum
        const interval = setInterval(() => {
            setHeight(Math.random() * 40 + 10);
        }, 100);
        return () => clearInterval(interval);
    }, [playing]);

    return (
        <View style={{
            width: 12,
            height,
            backgroundColor: '#4ade80',
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
            opacity: 0.9,
            shadowColor: '#4ade80',
            shadowOpacity: 0.5,
            shadowRadius: 5
        }} />
    )
}

