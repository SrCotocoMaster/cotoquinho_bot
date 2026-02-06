import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'http://localhost:3001'

export function useAuth() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const loginDiscord = async () => {
        try {
            const configRes = await axios.get(`${API_URL}/api/config`)
            const { clientId, redirectUri } = configRes.data

            const scope = encodeURIComponent('identify');
            const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;

            window.location.href = discordAuthUrl;
        } catch (error) {
            console.error('Falha ao buscar config:', error);
            alert('Erro ao iniciar login.');
        }
    }

    return { user, loading, loginDiscord }
}
