export type ApiUser = {
    username: string
    created_at: string
}

export type AuthResponse = {
    tokens: {
        access_token: string
        refresh_token: string
    }
    user: ApiUser
}

export type ApiFriend = {
    username: string
    created_at: string
    mutual: boolean
}

export type AddFriendResponse = {
    status: 'pending' | 'friends'
}

export type SendSnapInput = {
    recipients: string[]
    photo: { uri: string; mimetype: string }
    text?: string
}

// code is the HTTP status, message is the backend's own text. It is written for
// the user, so screens show it as-is rather than inventing their own wording.
export class ApiError extends Error {
    constructor(public code: number, message: string) {
        super(message)
    }
}

// AuthProvider plugs logout() in here. Protected 401s call it — login's
// "Invalid password!" 401 does not, so a failed login stays on the login screen.
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
    onUnauthorized = handler
}

export function notifyUnauthorized(): void {
    onUnauthorized?.()
}
