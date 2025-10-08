import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

// UI Components
import SearchBar from "@/components/inputs/searchbar/SearchBar";
import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

// Firebase
import { db } from "@/api/config/firebase.config";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

// Context
import { useAuth } from "@/context/AuthContext";

// Icons
import { Heart, MessageCircle, Plus } from "lucide-react-native";

const ForumsScreen = () => {
  const { user } = useAuth();
  const router = useRouter();

  // States
  const [modalVisible, setModalVisible] = useState(false);
  const [discussions, setDiscussions] = useState([]);
  const [newDiscussion, setNewDiscussion] = useState({ title: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("newest");
  const [sortOrder, setSortOrder] = useState("desc");
  const [userLikes, setUserLikes] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDiscussions, setFilteredDiscussions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Load cached likes
  useEffect(() => {
    const loadCachedLikes = async () => {
      try {
        const cached = await AsyncStorage.getItem(`userLikes_${user?.uid}`);
        if (cached) setUserLikes(JSON.parse(cached));
      } catch (e) {
        console.error("Error loading cached likes:", e);
      }
    };
    if (user) loadCachedLikes();
  }, [user]);

  const saveLikesToCache = async (likes) => {
    try {
      await AsyncStorage.setItem(`userLikes_${user?.uid}`, JSON.stringify(likes));
    } catch (e) {
      console.error("Error saving likes:", e);
    }
  };

  // Realtime discussions
  useEffect(() => {
    const q = collection(db, "forums");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setDiscussions(fetched);
    });
    return () => unsubscribe();
  }, []);

  // Listen for user likes
  useEffect(() => {
    if (!user) return;
    const likesRef = collection(db, "userLikes", user.uid, "forums");
    const unsubscribe = onSnapshot(likesRef, (snapshot) => {
      const likedPosts = {};
      snapshot.forEach((docSnap) => {
        likedPosts[docSnap.id] = true;
      });
      setUserLikes(likedPosts);
      saveLikesToCache(likedPosts);
    });
    return () => unsubscribe();
  }, [user]);

  // Compute filtered + sorted discussions
  useEffect(() => {
    const computeFiltered = () => {
      let list = Array.isArray(discussions) ? [...discussions] : [];
      const q = (searchQuery || "").trim().toLowerCase();

      if (q.length > 0) {
        list = list.filter((item) => {
          const title = (item.title || "").toString().toLowerCase();
          const content = (item.content || "").toString().toLowerCase();
          return title.includes(q) || content.includes(q);
        });
      }

      if (filter === "newest") {
        list.sort((a, b) => {
          const ta = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
          const tb = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
          return tb - ta;
        });
      } else if (filter === "ongoing") {
        list.sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0));
      }

      if (sortOrder === "asc") list.reverse();
      return list;
    };

    setFilteredDiscussions(computeFiltered());
  }, [discussions, searchQuery, filter, sortOrder]);

  // Save discussion
  const saveDiscussion = async () => {
    if (!newDiscussion.title?.trim() || !newDiscussion.description?.trim() || isSaving) return;

    setIsSaving(true);

    try {
      if (editingId) {
        await updateDoc(doc(db, "forums", editingId), {
          title: newDiscussion.title,
          content: newDiscussion.description,
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, "forums"), {
          title: newDiscussion.title,
          content: newDiscussion.description,
          likesCount: 0,
          commentsCount: 0,
          authorName: user?.displayName || "Anonymous",
          authorPhoto: user?.photoURL || "https://i.pravatar.cc/100",
          authorId: user?.uid,
          timestamp: serverTimestamp(),
        });
      }

      setNewDiscussion({ title: "", description: "" });
      setModalVisible(false);
    } catch (error) {
      console.error("Error saving discussion:", error);
      // Optionally, show an error message to the user
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDiscussion = async (forumId) => {
    await deleteDoc(doc(db, "forums", forumId));
  };

  const formatTimeAgo = (date, now = new Date()) => {
    if (!date) return "...";
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (weeks < 5) return `${weeks}w ago`;
    if (months < 12) return `${months}mo ago`;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const toggleLike = async (forum) => {
    if (!user) return;
    const forumRef = doc(db, "forums", forum.id);
    const likeRef = doc(db, "forums", forum.id, "likes", user.uid);
    const userLikeRef = doc(db, "userLikes", user.uid, "forums", forum.id);

    const likeDoc = await getDoc(likeRef);
    const updatedLikes = { ...userLikes };

    if (likeDoc.exists()) {
      await deleteDoc(likeRef);
      await deleteDoc(userLikeRef);
      await updateDoc(forumRef, { likesCount: increment(-1) });
      delete updatedLikes[forum.id];
    } else {
      await setDoc(likeRef, { userId: user.uid });
      await setDoc(userLikeRef, { forumId: forum.id });
      await updateDoc(forumRef, { likesCount: increment(1) });
      updatedLikes[forum.id] = true;
    }

    setUserLikes(updatedLikes);
    saveLikesToCache(updatedLikes);
  };

  const [fontsLoaded] = useFonts({
    Pacifico: require("../../../assets/fonts/Pacifico-Regular.ttf"),
    SpaceMono: require("../../../assets/fonts/SpaceMono-Regular.ttf"),
    Roboto: require("../../../assets/fonts/Roboto-Bold.ttf"),
    Poppins: require("../../../assets/fonts/Poppins-Bold.ttf"),
  });

  if (!fontsLoaded) return null;

  // ===== MOBILE VERSION ONLY =====
  return (
    <SafeAreaView className="flex-1 bg-[#D9E9DD] px-3">
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <Box className="flex-row items-center justify-between mt-2 ">
        <Box className="flex-row items-center">
          <Image
            source={require("@/assets/images/ariba-logo.png")}
            style={{ width: 80, height: 80, marginRight: 2, marginBottom: 12 }}
            resizeMode="contain"
          />
          
        </Box>
        <Box className="w-[140px] h-11 mt-6">
          <SearchBar
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
            placeholder="Search"
            className="w-[140px]"
          />
        </Box>
      </Box>

      {/* FORUMS HEADER */}
      <Box className="bg-white rounded-2xl p-4 shadow-sm">
        <Box className="flex-row items-center justify-between mb-4">
          <Box>
            <Text size="4xl" className="font-[Poppins] mb-1">
              FORUMS
            </Text>
            <Text className="text-gray-600">{discussions.length} Discussions</Text>
          </Box>

          {/* Controls */}
          <Box className="flex-row items-center">
            <TouchableOpacity
              onPress={() => {
                setModalVisible(true);
                setEditingId(null);
                setNewDiscussion({ title: "", description: "" });
              }}
              className="bg-green-600 w-9 h-9 items-center justify-center rounded-md mr-1 mt-11"
            >
              <Plus size={20} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilter("newest")}
              className={`px-2 py-1 border border-green-600 rounded-l-md mt-11 ${
                filter === "newest" ? "bg-green-600" : "bg-white"
              }`}
            >
              <Text className={filter === "newest" ? "text-white" : "text-black"}>Newest</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFilter("ongoing")}
              className={`px-2 py-1 border border-green-600 rounded-r-md mt-11 ${
                filter === "ongoing" ? "bg-green-600" : "bg-white"
              }`}
            >
              <Text className={filter === "ongoing" ? "text-white" : "text-black"}>Ongoing</Text>
            </TouchableOpacity>
          </Box>
        </Box>

        {/* DISCUSSION LIST */}
        <FlatList
          data={filteredDiscussions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const liked = userLikes[item.id] || false;
            const isOwner = item.authorId === user?.uid;
            return (
              <Card className="p-4 mb-4 rounded-xl border border-gray-300 bg-white">
                <TouchableOpacity onPress={() => router.push(`/(tabs)/(index)/${item.id}`)}>
                  <Box className="flex-row items-center mb-2">
                    <Text className="text-lg font-bold">{item.title}</Text>
                    <Text className="mx-2 text-gray-400">•</Text>
                    <Text className="text-xs text-gray-500">
                      {item.timestamp?.toDate
                        ? formatTimeAgo(item.timestamp.toDate(), currentTime)
                        : "..."}
                    </Text>
                  </Box>
                  <Text numberOfLines={2} className="text-gray-700 mb-3">
                    {item.content}
                  </Text>
                </TouchableOpacity>

                {/* Likes + Comments */}
                <Box className="flex-row items-center">
                  <TouchableOpacity onPress={() => toggleLike(item)} className="flex-row items-center mr-6">
                    <Heart size={18} color={liked ? "red" : "black"} fill={liked ? "red" : "transparent"} />
                    <Text className="ml-1 text-gray-700">{item.likesCount || 0} Likes</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => router.push(`/(tabs)/(index)/${item.id}`)} className="flex-row items-center">
                    <MessageCircle size={18} />
                    <Text className="ml-1 text-gray-700">{item.commentsCount || 0} Comments</Text>
                  </TouchableOpacity>
                </Box>
              </Card>
            );
          }}
          contentContainerStyle={{ paddingBottom: 160 }}
        />

        {/* ADD DISCUSSION MODAL */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View className="flex-1 bg-black/40 justify-center items-center px-4">
            <View className="bg-white w-full rounded-2xl shadow-lg p-6">
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setEditingId(null);
                  setNewDiscussion({ title: "", description: "" });
                }}
              >
                <Text className="text-sm font-bold text-black mb-2">BACK</Text>
              </TouchableOpacity>

              <Text className="text-xl font-[Poppins] text-center mb-2">START A DISCUSSION</Text>
              <View className="border-t border-gray-300 mb-4" />

              <Text className="font-semibold text-black mb-2">Discussion Title</Text>
              <TextInput
                placeholder="Write your report title here."
                value={newDiscussion.title}
                onChangeText={(text) => setNewDiscussion((prev) => ({ ...prev, title: text }))}
                className="bg-gray-200 rounded-md px-4 py-3 mb-4 text-gray-800"
              />

              <Text className="font-semibold text-black mb-2">Report Description</Text>
              <TextInput
                placeholder="Write your report description here."
                value={newDiscussion.description}
                onChangeText={(text) => setNewDiscussion((prev) => ({ ...prev, description: text }))}
                className="bg-gray-200 rounded-md px-4 py-3 text-gray-800 mb-6 h-32"
                multiline
                textAlignVertical="top"
              />

              <View className="flex-row justify-between mt-2">
                <TouchableOpacity
                  className="flex-1 bg-green-600 py-3 rounded-md mr-2 items-center"
                  onPress={saveDiscussion}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-semibold">Confirm</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-red-600 py-3 rounded-md ml-2 items-center"
                  onPress={() => {
                    if (isSaving) return;
                    setModalVisible(false);
                    setEditingId(null);
                    setNewDiscussion({ title: "", description: "" });
                  }}
                  disabled={isSaving}
                >
                  <Text className="text-white font-semibold">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </Box>
    </SafeAreaView>
  );
};

export default ForumsScreen;
