import { Tabs, useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { Colors } from '../../constants/Colors';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

export default function TabLayout() {
  const router = useRouter();

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
          height: 84,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#9ca3af',
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
              style={{ marginRight: 16, padding: 8 }}
              accessibilityLabel="Settings"
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 20 }}>⚙️</Text>
            </Pressable>
          ),
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎵" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chords"
        options={{
          title: 'Chords',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎸" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="lessons"
        options={{
          headerShown: false,
          title: 'Lessons',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📚" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="songs"
        options={{
          headerShown: false,
          title: 'Songs',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎶" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          headerShown: false,
          title: 'Games',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎮" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="metronome"
        options={{
          headerShown: false,
          title: 'Metronome',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🥁" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
