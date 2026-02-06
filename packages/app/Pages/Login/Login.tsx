import { useState } from 'react'
import { View, Text, Pressable, TextInput, ActivityIndicator, Platform } from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Link } from 'solito/link'
import { styles } from './styles'

export function LoginScreen() {
    const { loginDiscord } = useAuth()

    // State
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false) // New Success State

    const handleLogin = async () => {
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        setLoading(false)

        if (error) {
            alert(error.message)
        } else {
            // Success! Set state to show success UI
            setSuccess(true)
        }
    }

    const handleSignUp = async () => {
        setLoading(true)
        const { error } = await supabase.auth.signUp({
            email,
            password,
        })
        setLoading(false)

        if (error) {
            alert(error.message)
        } else {
            alert('Cadastro realizado! Verifique seu email e tente logar.')
        }
    }

    // Success View
    if (success) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>🎉 Login Sucesso!</Text>
                <Text style={styles.subtitle}>Bem-vindo de volta.</Text>

                <View style={{ height: 20 }} />

                <Link href="/dashboard">
                    <View style={[styles.authButton, { backgroundColor: '#10b981', paddingHorizontal: 40 }]}>
                        <Text style={styles.buttonText}>Ir para o Dashboard</Text>
                    </View>
                </Link>
            </View>
        )
    }

    // Login Form View
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Cotoquinho</Text>
            <Text style={styles.subtitle}>Conecte sua conta para começar</Text>

            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#64748b"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Senha"
                    placeholderTextColor="#64748b"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <View style={styles.row}>
                    <Pressable style={[styles.authButton, { backgroundColor: '#2563eb', flex: 1, marginRight: 8 }]} onPress={handleLogin} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
                    </Pressable>
                    <Pressable style={[styles.authButton, { backgroundColor: '#475569', flex: 1, marginLeft: 8 }]} onPress={handleSignUp} disabled={loading}>
                        <Text style={styles.buttonText}>Cadastrar</Text>
                    </Pressable>
                </View>
            </View>

            <View style={styles.divider}>
                <Text style={styles.dividerText}>OU</Text>
            </View>

            <Pressable style={styles.discordButton} onPress={loginDiscord}>
                <Text style={styles.buttonText}>Login com Discord</Text>
            </Pressable>
        </View>
    )
}

