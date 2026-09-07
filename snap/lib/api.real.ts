// The real client. Swap snap/lib/api.ts to `export * from './api.real'` on Wednesday.
// Same signatures as api.mock.ts, so screens don't change.
import { ApiError, notifyUnauthorized } from './api.types'
import type { AddFriendResponse, ApiFriend, AuthResponse, SendSnapInput } from './api.types'

// Ahmad gives us this on Wednesday. A physical phone needs the computer's IP, not localhost.
export const API_BASE_URL = 'http://localhost:3000'

let accessToken: string | null = null

export function setAccessToken(token: string | null): void {
    accessToken = token
}

// Every call goes through here. `protectedRoute` decides two things: whether the
// bearer token is sent, and whether a 401 means "session is gone" (logout via
// notifyUnauthorized). Login's own 401 "Invalid password!" is not protected, so it
// just becomes an ApiError the login screen shows.
async function request<T>(path: string, init: RequestInit, protectedRoute: boolean): Promise<T> {
    const headers = new Headers(init.headers)

    if (protectedRoute && accessToken !== null) headers.set('Authorization', `Bearer ${accessToken}`)

    const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })

    if (!response.ok) {
        if (protectedRoute && response.status === 401) notifyUnauthorized()

        throw await toApiError(response)
    }

    // 204 (deleteFriend) has no body, and 201 from /snaps may not either.
    const text = await response.text()

    return (text === '' ? undefined : JSON.parse(text)) as T
}

// The backend's envelope is { success, code, message }. The auth guard answers plain
// text 'Not authorized' instead (question 2 for Ahmad), so a non-JSON body falls back.
async function toApiError(response: Response): Promise<ApiError> {
    try {
        const body = (await response.json()) as { code?: number; message?: string }

        if (typeof body.message === 'string') return new ApiError(body.code ?? response.status, body.message)
    } catch {
        // not JSON
    }

    return new ApiError(response.status, 'Något gick fel')
}

function json(body: unknown): RequestInit {
    return {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    }
}

export async function register(username: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/register', json({ username, password }), false)
}

export async function login(username: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/login', json({ username, password }), false)
}

// GET /friends answers { friends: [...] }; screens get the array.
export async function getFriends(): Promise<ApiFriend[]> {
    const body = await request<{ friends: ApiFriend[] }>('/friends', { method: 'GET' }, true)

    return body.friends
}

export async function addFriend(friendUsername: string): Promise<AddFriendResponse> {
    return request<AddFriendResponse>('/friends', json({ friend_username: friendUsername }), true)
}

export async function deleteFriend(username: string): Promise<void> {
    await request<void>(`/friends/${encodeURIComponent(username)}`, { method: 'DELETE' }, true)
}

// multipart/form-data. `recipients` is appended once per username (question 3 for
// Ahmad — the backend has to read it the same way). fetch sets the multipart
// boundary itself, so no Content-Type header here.
export async function sendSnap(input: SendSnapInput): Promise<void> {
    const form = new FormData()

    // React Native's FormData takes { uri, name, type } for a file, not a Blob.
    form.append('file', {
        uri: input.photo.uri,
        name: input.photo.mimetype === 'image/png' ? 'snap.png' : 'snap.jpg',
        type: input.photo.mimetype,
    } as unknown as Blob)

    for (const recipient of input.recipients) form.append('recipients', recipient)

    if (input.text) form.append('text', input.text)

    await request<void>('/snaps', { method: 'POST', body: form }, true)
}
