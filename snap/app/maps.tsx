import { mockFriendLocations } from '@/lib/mockLocations';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function MapsScreen() {
    const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const requestLocation = useCallback(async () => {
        setErrorMessage(null);

        const { status } = await Location.requestForegroundPermissionsAsync();
        setPermissionStatus(status);

        if (status !== 'granted') {
            return;
        }

        try {
            const current = await Location.getCurrentPositionAsync({});
            setLocation(current);
        } catch {
            setErrorMessage('Kunde inte hämta din position. Försök igen.');
        }
    }, []);

    useEffect(() => {
        // Fetches from the OS permission/location APIs on mount, not local state.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        requestLocation();
    }, [requestLocation]);

    if (permissionStatus !== 'granted') {
        return (
            <View style={styles.centered}>
                <Text style={styles.message}>
                    Vi behöver din platstillåtelse för att visa kartan
                </Text>
                <Button title="Försök igen" onPress={requestLocation} />
            </View>
        );
    }

    if (errorMessage) {
        return (
            <View style={styles.centered}>
                <Text style={styles.message}>{errorMessage}</Text>
                <Button title="Försök igen" onPress={requestLocation} />
            </View>
        );
    }

    if (!location) {
        return (
            <View style={styles.centered}>
                <Text style={styles.message}>Hämtar din position…</Text>
            </View>
        );
    }

    const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    return (
        <View style={styles.container}>
            <MapView style={styles.map} initialRegion={region} showsUserLocation>
                {mockFriendLocations.map((friend) => (
                    <Marker
                        key={friend.username}
                        coordinate={{
                            latitude: location.coords.latitude + friend.latitude,
                            longitude: location.coords.longitude + friend.longitude,
                        }}
                        title={friend.username}
                    />
                ))}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 12,
    },
    message: {
        textAlign: 'center',
    },
});
