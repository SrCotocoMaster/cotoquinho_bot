'use client'

import React from 'react'
import { View } from 'react-native'
import { AuthProvider } from './auth'

export function Provider({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <View style={{ flex: 1 }}>
                {children}
            </View>
        </AuthProvider>
    )
}
