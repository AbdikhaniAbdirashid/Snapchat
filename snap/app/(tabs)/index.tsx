import PhotoPreview from '@/components/PhotoPreview';
import { CameraView, CameraType, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CameraPage() {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const cameraViewRef = useRef<CameraView | null>(null)
    const [cameraReady, setCameraReady] = useState(false)
    const [takenPhoto, setTakenPhoto] = useState<CameraCapturedPicture>()
    // Set when Send is tapped. The photo is handed to send-snap, so when the
    // camera gets focus back the preview is cleared and a new photo can be taken.
    const handedOffRef = useRef(false)

    const lastTapTimeRef = useRef<number | null>(null);

    useFocusEffect(useCallback(() => {
        if (handedOffRef.current) {
            handedOffRef.current = false
            setTakenPhoto(undefined)
        }
    }, []))

    const handleTap = () => {
        const now = new Date().getTime();
        const DOUBLE_TAP_DELAY = 300;

        const isDoubleTap = lastTapTimeRef.current && (now - lastTapTimeRef.current) < DOUBLE_TAP_DELAY

        if (isDoubleTap) {
            toggleCameraFacing()
        }

        lastTapTimeRef.current = now;
    };

    if (!permission) {
        return <View />;
    }

    if (takenPhoto) {
        return (
            <PhotoPreview
                photoUri={takenPhoto.uri}
                discard={() => setTakenPhoto(undefined)}
                send={() => {
                    handedOffRef.current = true
                    router.push({
                        pathname: '/send-snap',
                        params: { uri: takenPhoto.uri },
                    })
                }}
            />
        )
    }

    if (!permission.granted) {
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
});
