import PhotoPreview from '@/components/PhotoPreview';
import { CameraView, CameraType, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function App() {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const cameraViewRef = useRef<CameraView | null>(null)
    const [cameraReady, setCameraReady] = useState(false)
    const [takenPhoto, setTakenPhoto] = useState<CameraCapturedPicture>()

    const lastTapTimeRef = useRef<number | null>(null);

    const handleTap = () => {
        const now = new Date().getTime();
        const DOUBLE_TAP_DELAY = 300; // Adjust as needed for your use case (in milliseconds)

        const isDoubleTap = lastTapTimeRef.current && (now - lastTapTimeRef.current) < DOUBLE_TAP_DELAY

        if (isDoubleTap) {
            toggleCameraFacing()
        } else {
            // Single tap detected
            console.log('Single tap!');
        }

        lastTapTimeRef.current = now;
    };

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (takenPhoto) {
        return (
            <PhotoPreview photoUri={takenPhoto.uri} discard={() => setTakenPhoto(undefined)} />
        )
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    const takePhoto = async () => {
        if (!cameraReady) return

        const photo = await cameraViewRef.current?.takePictureAsync()
        setTakenPhoto(photo)
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity style={{ flex: 1 }} onPress={handleTap}>
                <CameraView ref={cameraViewRef} onCameraReady={() => setCameraReady(true)} style={styles.camera} facing={facing} />
            </TouchableOpacity>


            {cameraReady && <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={takePhoto}>
                </TouchableOpacity>
            </View>}

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
    },
    camera: {
        flex: 1,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 64,
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        paddingHorizontal: 64,
    },
    button: {
        alignItems: 'center',
        width: 80,
        height: 80,
        borderRadius: '50%',
        backgroundColor: 'transparent',
        borderColor: '#3338',
        borderWidth: 4
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
});
