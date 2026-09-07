import * as SecureStore from 'expo-secure-store'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { login as apiLogin, register as apiRegister, setAccessToken, setUnauthorizedHandler, type ApiUser, type AuthResponse } from './api'

const ACCESS_TOKEN_KEY = 'access_token'
// There is no GET /me, so the user is stored alongside the token — otherwise
// we'd know we're logged in after a restart but not who as.
const USER_KEY = 'user'

type AuthState = {
    user: ApiUser | null
    isLoading: boolean
    login: (username: string, password: string) => Promise<void>
    register: (username: string, password: string) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<ApiUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function restoreSession() {
            try {
                const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
                const storedUser = await SecureStore.getItemAsync(USER_KEY)

                if (token && storedUser) {
                    setAccessToken(token)
                    setUser(JSON.parse(storedUser))
                }
            } finally {
                setIsLoading(false)
            }
        }

        restoreSession()
    }, [])

    async function logout() {
        setAccessToken(null)

        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY)
        await SecureStore.deleteItemAsync(USER_KEY)

        setUser(null)
    }

    // One place: any protected 401 calls this, screens never check e.code === 401.
    useEffect(() => {
        setUnauthorizedHandler(() => {
            void logout()
        })

        return () => setUnauthorizedHandler(null)
    }, [])

    // The three copies of the session are always written together: the one the
    // API layer reads, the one that survives a restart, and the one React renders.
    async function startSession(auth: AuthResponse) {
        setAccessToken(auth.tokens.access_token)

        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, auth.tokens.access_token)
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(auth.user))

        setUser(auth.user)
    }

    // ApiError is deliberately not caught here — the screen shows the message.
    async function login(username: string, password: string) {
        await startSession(await apiLogin(username, password))
    }

    async function register(username: string, password: string) {
        await startSession(await apiRegister(username, password))
    }

    const value: AuthState = { user, isLoading, login, register, logout }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
    const context = useContext(AuthContext)

    if (context === null) throw new Error('useAuth must be used inside an AuthProvider')

    return context
}
