export type AuthRequest = {
    username: string
    password: string
}

export type ApiUser = {
    username: string
    created_at: string
}

export type AddFriendRequest = {
    friend_username: string
}

export type SendSnapRequest = {
    mimetype: string
    recipients: string[]
    text?: string
}

export type ApiFriend = {
    username: string
    created_at: string
    mutual: boolean
}

// 'pending' — you've added them, waiting for them to add you back
// 'friends' — both directions exist
export type AddFriendResponse = {
    status: 'pending' | 'friends'
}

export type FriendParams = {
    username: string
}
