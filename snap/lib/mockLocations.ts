// Fake friend positions for the map screen. Local only — no endpoint for
// friend locations exists or is coming, so this never goes through lib/api.ts.
export type MockFriendLocation = {
    username: string
    latitude: number
    longitude: number
}

// Offsets are small enough to render near the user's own position on the map.
export const mockFriendLocations: MockFriendLocation[] = [
    { username: 'anna', latitude: 0.004, longitude: 0.006 },
    { username: 'oskar', latitude: -0.003, longitude: 0.008 },
    { username: 'maja', latitude: 0.006, longitude: -0.004 },
]
