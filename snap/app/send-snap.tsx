import { useLocalSearchParams } from 'expo-router'
import { Text, View } from 'react-native'

// Stub so the camera send button has somewhere to go. D builds the real picker.
export default function SendSnapScreen() {
    const { uri } = useLocalSearchParams<{ uri: string }>()

    return (
        <View>
            <Text>Send snap</Text>
            <Text>{uri}</Text>
        </View>
    )
}
