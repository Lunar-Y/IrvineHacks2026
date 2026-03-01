import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, usePathname, useRouter } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { FloatingTabBar } from '@/components/navigation/FloatingTabBar';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={26} style={{ marginBottom: -3 }} {...props} />;
}

import { View } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Tabs
      initialRouteName="scan"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        sceneStyle: { backgroundColor: '#0F1412' },
        tabBarStyle: { backgroundColor: '#18201D', borderTopColor: '#2F6B4F' },
      }}>
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color }) => <TabBarIcon name="camera" color={color} />,
        }}
        listeners={{
          tabPress: (event) => {
            if (pathname !== '/recommendations') return;
            event.preventDefault();
            router.dismiss();
            setTimeout(() => router.replace('/(tabs)/scan'), 0);
          },
        }}
      />
      <Tabs.Screen
        name="plants"
        options={{
          title: 'My Plants',
          tabBarIcon: ({ color }) => <TabBarIcon name="leaf" color={color} />,
        }}
        listeners={{
          tabPress: (event) => {
            if (pathname !== '/recommendations') return;
            event.preventDefault();
            router.dismiss();
            setTimeout(() => router.replace('/(tabs)/plants'), 0);
          },
        }}
      />

      <Tabs.Screen
        name="impact"
        options={{
          title: 'Impact',
          tabBarIcon: ({ color }) => <TabBarIcon name="bar-chart" color={color} />,
        }}
        listeners={{
          tabPress: (event) => {
            if (pathname !== '/recommendations') return;
            event.preventDefault();
            router.dismiss();
            setTimeout(() => router.replace('/(tabs)/impact'), 0);
          },
        }}
      />
    </Tabs>
  );
}
