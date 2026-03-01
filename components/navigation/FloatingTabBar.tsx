import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    return (
        <View style={styles.container} pointerEvents="box-none">
            {state.routes.map((route, index) => {
                const options = descriptors[route.key].options as any;

                // Explicitly skip 'index' and explicitly hidden routes
                if (route.name === 'index' || options.href === null) {
                    return null;
                }

                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                // Determine icon name based on route name
                let iconName: React.ComponentProps<typeof FontAwesome>['name'] = 'circle';
                if (route.name === 'scan') iconName = 'camera';
                if (route.name === 'plants') iconName = 'leaf';

                if (route.name === 'impact') iconName = 'globe';

                return (
                    <TouchableOpacity
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarTestID}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={styles.tabButton}
                    >
                        <View style={{ padding: 10 }}>
                            <FontAwesome
                                name={iconName}
                                size={28}
                                color={isFocused ? '#2F6B4F' : '#9FAFAA'}
                                style={{ marginBottom: -3 }}
                            />
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 30 : 20,
        left: '10%',
        right: '10%',
        height: 64,
        backgroundColor: '#18201D',
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'space-evenly',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 100,
        zIndex: 100,
    },
    tabButton: {
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        flex: 1,
    },
});
