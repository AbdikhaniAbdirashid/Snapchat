import { View, StyleSheet, Pressable, Text } from 'react-native'
import { Image } from 'expo-image'
import { SafeAreaView } from 'react-native-safe-area-context'

type PhotoPreviewProps = {
    photoUri: string
    discard: () => void
}

function PhotoPreview({ photoUri, discard }: PhotoPreviewProps) {

    return (
        <View style={styles.container}>
            <Image source={photoUri} style={StyleSheet.absoluteFill} contentFit='cover' />

            <SafeAreaView style={styles.controls}>
                <Pressable onPress={discard}>
                    <Text style={styles.discard}>X</Text>
                </Pressable>
            </SafeAreaView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    controls: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'flex-start',
        padding: 16
    },
    discard: { fontSize: 48 }
})

export default PhotoPreview