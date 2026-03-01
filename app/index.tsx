import { Redirect } from 'expo-router';
import { View } from 'react-native';
// import { useProfileStore } from '../lib/store/profileStore';
// import { useEffect, useState } from 'react';
// import { View, ActivityIndicator } from 'react-native';

export default function Index() {
    /*
    INTEGRATION NOTE FOR TEAM:
    The following logic handles first-launch Onboarding redirects. 
    It is currently commented out to prevent disrupting your local testing. 
    Uncomment this logic and update _layout.tsx initialRouteName to 'index' when we merge.
    
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
    */

    // For now, bypass onboarding and go straight to your tabs:
    return (
        <>
            <Redirect href="/scan" />
            <View style={{ flex: 1, backgroundColor: '#fff' }} />
        </>
    );
}
