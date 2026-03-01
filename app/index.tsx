import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useProfileStore } from '../lib/store/profileStore';
import { useEffect, useState } from 'react';

export default function Index() {
    const [isHydrated, setIsHydrated] = useState(false);
    const hasCompletedOnboarding = useProfileStore((state) => state.hasCompletedOnboarding);

    useEffect(() => {
        const unsubHydrate = useProfileStore.persist.onFinishHydration(() => setIsHydrated(true));
        setIsHydrated(useProfileStore.persist.hasHydrated());
        return () => unsubHydrate();
    }, []);

    if (!isHydrated) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    if (!hasCompletedOnboarding) {
        return <Redirect href="/onboarding" />;
    }

    return (
        <>
            <Redirect href="/scan" />
            <View style={{ flex: 1, backgroundColor: '#fff' }} />
        </>
    );
}
