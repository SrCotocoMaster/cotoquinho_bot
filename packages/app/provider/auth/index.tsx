'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext<any>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Logic to load token from localStorage (web) or SecureStore (mobile)
        // For now, let's assume web-only persistence for the MVP transition
        const stored = typeof window !== 'undefined' ? localStorage.getItem('cotoquinho_user') : null
        if (stored) {
            try {
                setUser(JSON.parse(stored))
            } catch (e) { }
        }
        setLoading(false)
    }, [])

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
