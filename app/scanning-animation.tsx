import { View, Text, StyleSheet } from 'react-native';

export default function ScanningAnimationScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Scanning Animation</Text>
            <Text style={styles.subtitle}>Analyzing environmental data...</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ecfdf5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
});
