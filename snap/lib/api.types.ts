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
