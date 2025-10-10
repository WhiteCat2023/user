import * as Location from 'expo-location';
import { Tabs, useSegments } from "expo-router";
import { Bell, Bot, FileText, Home, Send, User } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, StyleSheet, TouchableOpacity, View } from "react-native";
import SendNewReport from "../../components/modals/SendNewReport";

export default function TabLayout() {
  const [isModalVisible, setModalVisible] = useState(false);
  const segments = useSegments();
  const currentTab = segments[segments.length - 1];
  
  // Animation values
  const fabAnimation = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const shimmerAnimation = useRef(new Animated.Value(-1)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  // Start continuous pulse animation
  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.08,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, []);

  // Periodic shimmer effect
  useEffect(() => {
    const shimmer = () => {
      Animated.timing(shimmerAnimation, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        shimmerAnimation.setValue(-1);
        setTimeout(shimmer, 3000); // Shimmer every 4.5 seconds
      });
    };
    setTimeout(shimmer, 1000); // Start after 1 second
  }, []);

  const animateFab = () => {
    // Scale animation (existing)
    Animated.sequence([
      Animated.timing(fabAnimation, {
        toValue: 1.1,
        duration: 100,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(fabAnimation, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.elastic(1)),
        useNativeDriver: true,
      }),
    ]).start();

    // Rotation animation
    Animated.timing(rotateAnimation, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      rotateAnimation.setValue(0);
    });

    // Trigger immediate shimmer
    shimmerAnimation.setValue(-1);
    Animated.timing(shimmerAnimation, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      shimmerAnimation.setValue(-1);
    });
  };

  const handleFabPress = async () => {
    animateFab();
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
      {currentTab !== '(ai)' && currentTab !== '[id]' && (
        <Animated.View 
          style={[
            styles.fab, 
            { 
              transform: [
                { scale: Animated.multiply(fabAnimation, pulseAnimation) },
                { 
                  rotate: rotateAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '15deg']
                  })
                }
              ]
            }
          ]}
        >
          <TouchableOpacity
            style={styles.fabButton}
            onPress={handleFabPress}
          >
            <Animated.View 
              style={[
                styles.shimmerOverlay,
                {
                  transform: [{
                    translateX: shimmerAnimation.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-100, 100]
                    })
                  }]
                }
              ]}
            />
            <Send color="white" size={24} />
          </TouchableOpacity>
        </Animated.View>
      )}
      <SendNewReport visible={isModalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
  },
  fabButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fd7e14',
    borderRadius: 15,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    width: 20,
    transform: [{ skewX: '-20deg' }],
  },
});
