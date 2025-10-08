import * as Location from 'expo-location';
import { Tabs, useSegments } from "expo-router";
import { Bell, Bot, FileText, Home, Send, User } from "lucide-react-native";
import { useState } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import SendNewReport from "../../components/modals/SendNewReport";

export default function TabLayout() {
  const [isModalVisible, setModalVisible] = useState(false);
  const segments = useSegments();
  const currentTab = segments[segments.length - 1];

  const handleFabPress = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Permission to access location was denied. Please enable it in your device settings to submit a report.');
      return;
    }
    setModalVisible(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: 'green',
          tabBarInactiveTintColor: 'gray',
        }}
      >
        <Tabs.Screen
          name="(index)"
          options={{
            title: "Dashboard",
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="(reports)"
          options={{
            title: "Reports",
            headerShown: false,
            tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="(ai)"
          options={{
            title: "Nico",
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Bot color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="(notifications)"
          options={{
            title: "Notifications",
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="(profile)"
          options={{
            title: "Profile",
            headerShown: false,
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />
      </Tabs>
      {currentTab !== '(ai)' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleFabPress}
        >
          <Send color="white" size={24} />
        </TouchableOpacity>
      )}
      <SendNewReport visible={isModalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 90,
    backgroundColor: '#fd7e14',
    borderRadius: 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
