import { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
    const [status, setStatus] = useState('Checking...');
    const [channelId, setChannelId] = useState('');
    const [message, setMessage] = useState('');
    const [logs, setLogs] = useState([]);
    const [dbCommands, setDbCommands] = useState([]);
    const [newCmd, setNewCmd] = useState({ name: '', description: '', response: '' });

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await axios.get('http://localhost:3000/health');
                setStatus(res.data.bot);
            } catch (err) {
                setStatus('Offline (Backend unreachable)');
            }
        };
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        fetchCommands(); // Added fetchCommands here
        return () => clearInterval(interval);
    }, []);

    const fetchCommands = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/commands');
            setDbCommands(res.data);
        } catch (e) { }
    };

    const handleAddCommand = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3000/api/commands', newCmd);
            setNewCmd({ name: '', description: '', response: '' });
            fetchCommands();
            setLogs(prev => [`[${new Date().toLocaleTimeString()}] Comando /${newCmd.name} criado`, ...prev]);
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao criar comando');
        }
    };

    const handleDeleteCommand = async (id) => {
        if (confirm('Deletar este comando?')) {
            await axios.delete(`http://localhost:3000/api/commands/${id}`);
            fetchCommands();
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:3000/api/send-message', {
                channelId,
                message
            }, {
                headers: { 'x-api-key': 'your_secure_internal_api_key_here' } // In real case, get from user profile or config
            });
            setLogs(prev => [`[${new Date().toLocaleTimeString()}] Mensagem enviada para ${channelId}`, ...prev]);
            setMessage('');
        } catch (err) {
            alert('Erro ao enviar: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="grid-dashboard">
            <div style={{ gridColumn: '1 / -1' }}>
                <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Dashboard de Controle</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Gerencie seu bot de forma profissional e intuitiva.</p>
            </div>

            {/* Row 1 */}
            <div className="glass" style={{ padding: '28px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                    <span className="status-indicator" style={{ backgroundColor: status === 'Online' ? 'var(--accent)' : '#ff4444' }}></span>
                    Status do Sistema
                </h3>
                <p style={{ fontSize: '1.4rem', fontWeight: 700 }}>{status}</p>
            </div>

            <div className="glass" style={{ padding: '28px' }}>
                <h3 style={{ marginBottom: '20px' }}>Mensagem Direta</h3>
                <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input className="input-field" placeholder="Channel ID" value={channelId} onChange={e => setChannelId(e.target.value)} required />
                    <textarea
                        className="input-field"
                        style={{ minHeight: '60px', resize: 'vertical' }}
                        placeholder="Mensagem"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        required
                    ></textarea>
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>Enviar</button>
                </form>
            </div>

            {/* Row 2: Manage Commands */}
            <div className="glass" style={{ padding: '28px', gridColumn: '1 / -1' }}>
                <h3 style={{ marginBottom: '24px' }}>Gerenciar Comandos (Persistent)</h3>

                <form onSubmit={handleAddCommand} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                    <input className="input-field" placeholder="Nome (/comando)" value={newCmd.name} onChange={e => setNewCmd({ ...newCmd, name: e.target.value })} required />
                    <input className="input-field" placeholder="Descrição" value={newCmd.description} onChange={e => setNewCmd({ ...newCmd, description: e.target.value })} required />
                    <input className="input-field" placeholder="Resposta do Bot" value={newCmd.response} onChange={e => setNewCmd({ ...newCmd, response: e.target.value })} required />
                    <button type="submit" className="btn btn-primary">Adicionar Comando</button>
                </form>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ color: 'var(--text-muted)', fontSize: '0.9rem', borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ padding: '12px' }}>Comando</th>
                                <th style={{ padding: '12px' }}>Descrição</th>
                                <th style={{ padding: '12px' }}>Resposta</th>
                                <th style={{ padding: '12px' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dbCommands.map(cmd => (
                                <tr key={cmd._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '12px', fontWeight: 600 }}>/{cmd.name}</td>
                                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{cmd.description}</td>
                                    <td style={{ padding: '12px' }}>{cmd.response}</td>
                                    <td style={{ padding: '12px' }}><button onClick={() => handleDeleteCommand(cmd._id)} style={{ color: '#ff4444', background: 'none', border: 'none', cursor: 'pointer' }}>Excluir</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Logs */}
            <div className="glass" style={{ padding: '28px', gridColumn: '1 / -1' }}>
                <h3 style={{ marginBottom: '16px' }}>Logs</h3>
                <div style={{ background: '#000', padding: '16px', borderRadius: '12px', height: '120px', overflowY: 'auto', fontSize: '0.85rem', color: '#0f0' }}>
                    {logs.map((l, i) => <div key={i}>{l}</div>)}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
