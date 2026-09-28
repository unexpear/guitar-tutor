import { Tabs, useRouter } from 'expo-router';
import { ColorValue, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type MCIName = keyof typeof MaterialCommunityIcons.glyphMap;

function TabIcon({ name, color }: { name: MCIName; color: ColorValue }) {
  return (
    <MaterialCommunityIcons
      name={name}
      size={24}
      color={color}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}

export default function TabLayout() {
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const usesSidebar = width >= 768;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#0f0f23' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: '#0f0f23',
          borderTopColor: '#2a2a4a',
          height: usesSidebar ? undefined : 64 + insets.bottom + Math.max(0, Math.min(fontScale, 1.5) - 1) * 12,
          // The navigator applies the cutout inset inside the rail's width.
          width: usesSidebar ? 104 + insets.left : undefined,
          paddingTop: 8 + (usesSidebar ? insets.top : 0),
        },
        tabBarPosition: usesSidebar ? 'left' : 'bottom',
        tabBarVariant: usesSidebar ? 'material' : 'uikit',
        tabBarLabelPosition: 'below-icon',
        // Six material items otherwise include enough vertical margins to
        // push the final activity below a landscape phone's safe area.
        tabBarItemStyle: usesSidebar ? { flex: 1, minHeight: 48, marginVertical: 0 } : undefined,
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarShowLabel: true,
        // Keep all six names visible; full-size accessible names remain on each tab.
        tabBarAllowFontScaling: false,
        tabBarActiveBackgroundColor: '#1b302c',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tuner',
          headerTitle: 'StandardTune',
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/settings')}
              style={{ marginRight: 12, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
              accessibilityLabel="Settings"
              accessibilityRole="button"
            >
              <Ionicons name="settings-outline" size={22} color="#9ca3af" />
            </Pressable>
          ),
          tabBarAccessibilityLabel: 'Tuner',
          tabBarIcon: ({ color }) => <TabIcon name="tune-vertical" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chords"
        options={{
          title: 'Chords',
          tabBarAccessibilityLabel: 'Chords',
          tabBarIcon: ({ color }) => <TabIcon name="guitar-acoustic" color={color} />,
        }}
      />
      <Tabs.Screen
        name="lessons"
        options={{
          headerShown: false,
          title: 'Learn',
          tabBarAccessibilityLabel: 'Learn',
          tabBarIcon: ({ color }) => <TabIcon name="book-open-variant" color={color} />,
        }}
      />
      <Tabs.Screen
        name="songs"
        options={{
          headerShown: false,
          title: 'Songs',
          tabBarAccessibilityLabel: 'Songs',
          tabBarIcon: ({ color }) => <TabIcon name="music-note" color={color} />,
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          headerShown: false,
          title: 'Games',
          tabBarAccessibilityLabel: 'Games',
          tabBarIcon: ({ color }) => <TabIcon name="gamepad-variant" color={color} />,
        }}
      />
      <Tabs.Screen
        name="metronome"
        options={{
          headerShown: false,
          title: 'Tempo',
          tabBarAccessibilityLabel: 'Tempo',
          tabBarIcon: ({ color }) => <TabIcon name="metronome" color={color} />,
        }}
      />
    </Tabs>
  );
}
