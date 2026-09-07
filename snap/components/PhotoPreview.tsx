import { View, StyleSheet, Pressable, Text } from 'react-native'
import { Image } from 'expo-image'
import { SafeAreaView } from 'react-native-safe-area-context'

type PhotoPreviewProps = {
    photoUri: string
    discard: () => void
    send: () => void
}

function PhotoPreview({ photoUri, discard, send }: PhotoPreviewProps) {

    return (
        <View style={styles.container}>
            <Image source={photoUri} style={StyleSheet.absoluteFill} contentFit='cover' />

            <SafeAreaView style={styles.controls}>
                <Pressable onPress={discard} hitSlop={8}>
                    <Text style={styles.discard}>X</Text>
                </Pressable>

                <Pressable onPress={send} hitSlop={8}>
                    <Text style={styles.send}>Send</Text>
                </Pressable>
            </SafeAreaView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    controls: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 16
    },
    discard: { fontSize: 48, color: 'white' },
    send: { fontSize: 24, color: 'white', fontWeight: '600', marginTop: 16 }
})

export default PhotoPreview
