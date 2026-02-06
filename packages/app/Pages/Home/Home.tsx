'use client'

import { Link } from 'solito/link'
import { View, Text, Platform, Pressable } from 'react-native'
import { styles } from './styles'

export function HomeScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Cotoquinho Universal</Text>
            <Text style={styles.subtitle}>O ecossistema do seu bot, em qualquer lugar.</Text>
            <View style={{ height: 20 }} />

            <Link href="/dashboard">
                <View style={[styles.button, styles.linkButton]}>
                    <Text style={styles.buttonText}>Ir para o Dashboard</Text>
                </View>
            </Link>

            <View style={{ height: 16 }} />

            <Link href="/login">
                <View style={[styles.button, styles.linkButton, { backgroundColor: '#10b981' }]}>
                    <Text style={styles.buttonText}>Fazer Login</Text>
                </View>
            </Link>

            <View style={{ height: 32 }} />

            <Pressable onPress={() => {
                if (Platform.OS === 'web') {
                    window.location.href = '/dashboard'
                }
            }}>
                <Text style={{ color: '#f87171', textDecorationLine: 'underline' }}>
                    🚨 PULAR LOGIN (DEBUG)
                </Text>
            </Pressable>
        </View>
    )
}

