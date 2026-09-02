import { Tabs, useRouter } from 'expo-router';
import { ColorValue, Pressable, useWindowDimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type MCIName = keyof typeof MaterialCommunityIcons.glyphMap;

function TabIcon({ name, color }: { name: MCIName; color: ColorValue }) {
  return <MaterialCommunityIcons name={name} size={24} color={color} />;
}

export default function TabLayout() {
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
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
          height: usesSidebar ? undefined : 84,
          width: usesSidebar ? 104 : undefined,
          paddingTop: 8,
        },
        tabBarPosition: usesSidebar ? 'left' : 'bottom',
        tabBarVariant: usesSidebar ? 'material' : 'uikit',
        tabBarLabelPosition: 'below-icon',
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarShowLabel: fontScale <= 1.4,
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
          tabBarIcon: ({ color }) => <TabIcon name="tune-vertical" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chords"
        options={{
          title: 'Chords',
          tabBarIcon: ({ color }) => <TabIcon name="guitar-acoustic" color={color} />,
        }}
      />
      <Tabs.Screen
        name="lessons"
        options={{
          headerShown: false,
          title: 'Lessons',
          tabBarIcon: ({ color }) => <TabIcon name="book-open-variant" color={color} />,
        }}
      />
      <Tabs.Screen
        name="songs"
        options={{
          headerShown: false,
          title: 'Songs',
          tabBarIcon: ({ color }) => <TabIcon name="music-note" color={color} />,
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          headerShown: false,
          title: 'Games',
          tabBarIcon: ({ color }) => <TabIcon name="gamepad-variant" color={color} />,
        }}
      />
      <Tabs.Screen
        name="metronome"
        options={{
          headerShown: false,
          title: 'Tempo',
          tabBarIcon: ({ color }) => <TabIcon name="metronome" color={color} />,
        }}
      />
    </Tabs>
  );
}
