import { useAuth } from '../hooks/useAuth';

const Login = () => {
    const { loginDiscord, loginGoogle } = useAuth();

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', padding: '16px'
        }}>
            <div className="glass" style={{ padding: '48px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                <h1 className="title-gradient" style={{ fontSize: '2.5rem', marginBottom: '12px' }}>Cotoquinho</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Dashboard de Gerenciamento do Bot</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <button onClick={loginDiscord} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        <span>Entrar com Discord</span>
                    </button>
                    <button onClick={loginGoogle} className="btn glass" style={{ width: '100%', justifyContent: 'center' }}>
                        <span>Entrar com Google</span>
                    </button>
                </div>

                <p style={{ color: '#444', fontSize: '0.8rem', marginTop: '32px' }}>
                    Ao entrar, você concorda com nossos termos de serviço.
                </p>
            </div>
        </div>
    );
};

export default Login;
