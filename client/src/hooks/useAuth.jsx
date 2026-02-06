import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Check for token in URL (from OAuth2 redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (token) {
            // Very simplified: decode JWT and save
            // In a real app, use a lib like jwt-decode
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const userData = JSON.parse(jsonPayload);
            setUser(userData);
            localStorage.setItem('cotoquinho_user', JSON.stringify(userData));
            localStorage.setItem('cotoquinho_token', token);

            // Clean URL
            window.history.replaceState({}, document.title, "/");
        } else {
            // 2. Check persistence
            const storedUser = localStorage.getItem('cotoquinho_user');
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    localStorage.removeItem('cotoquinho_user');
                }
            }
        }
        setLoading(false);
    }, []);

    const loginDiscord = async () => {
        try {
            const configRes = await axios.get('http://localhost:3000/api/config');
            const { clientId } = configRes.data;

            if (!clientId) {
                alert('Erro: CLIENT_ID não configurado no servidor.');
                return;
            }

            const redirectUri = encodeURIComponent(window.location.origin + '/api/auth/discord/callback');
            const scope = encodeURIComponent('identify');
            const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;

            window.location.href = discordAuthUrl;
        } catch (error) {
            console.error('Falha ao buscar config:', error);
            alert('Erro ao iniciar login. Verifique se o servidor está rodando.');
        }
    };

    const loginGoogle = () => {
        console.log('Redirecting to Google OAuth...');
        const mockUser = { name: 'GoogleAdmin', avatar: null, provider: 'google' };
        setUser(mockUser);
        localStorage.setItem('cotoquinho_user', JSON.stringify(mockUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('cotoquinho_user');
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginDiscord, loginGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
