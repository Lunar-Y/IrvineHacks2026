import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, usePathname, useRouter } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: pathname !== '/recommendations',
        tabBarStyle: pathname === '/recommendations' ? { position: 'absolute', bottom: 0 } : undefined,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="scan-ar"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color }) => <TabBarIcon name="camera" color={color} />,
        }}
        listeners={{
          tabPress: (event) => {
            if (pathname !== '/recommendations') return;
            event.preventDefault();
            router.dismiss();
            setTimeout(() => {
              router.replace('/(tabs)/scan-ar');
            }, 0);
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
            setTimeout(() => {
              router.replace('/(tabs)/plants');
            }, 0);
          },
        }}
      />
      <Tabs.Screen
        name="care"
        options={{
          title: 'Care',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
        listeners={{
          tabPress: (event) => {
            if (pathname !== '/recommendations') return;
            event.preventDefault();
            router.dismiss();
            setTimeout(() => {
              router.replace('/(tabs)/care');
            }, 0);
          },
        }}
      />
      <Tabs.Screen
        name="impact"
        options={{
          title: 'Impact',
          tabBarIcon: ({ color }) => <TabBarIcon name="globe" color={color} />,
        }}
        listeners={{
          tabPress: (event) => {
            if (pathname !== '/recommendations') return;
            event.preventDefault();
            router.dismiss();
            setTimeout(() => {
              router.replace('/(tabs)/impact');
            }, 0);
          },
        }}
      />
    </Tabs>
  );
}
