import { db } from "@/api/config/firebase.config";
import SearchBar from "@/components/inputs/searchbar/SearchBar";
import { Box } from "@/components/ui/box";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Edit3, Filter as FilterIcon, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  Text as RNText,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  View,
} from "react-native";

export default function Reports() {
  const { user } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);

  // fetch reports (like Notifications code, no index required)
  const fetchReports = useCallback(() => {
    setLoading(true);

    const q = query(collection(db, "allReports"), orderBy("timestamp", "desc"));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        let list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // filter by logged-in user (done in JS, not Firestore query)
        if (user?.uid) {
          list = list.filter((r) => r.uid === user.uid);
        }

        setReports(list);
        setFilteredReports(list);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error("Error fetching reports:", error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsub();
  }, [user]);

  useEffect(() => {
    const unsub = fetchReports();
    return () => unsub && unsub();
  }, [fetchReports]);

  // filter + search
  useEffect(() => {
    let filtered = reports;

    if (searchQuery) {
      filtered = filtered.filter(
        (r) =>
          r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.tier?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(
        (r) => r.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredReports(filtered);
  }, [searchQuery, statusFilter, reports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, "MMMM dd, yyyy");
    } catch {
      return "Invalid Date";
    }
  };

  if (loading) {
    return (
      <Box className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
        <RNText className="mt-4">Loading reports...</RNText>
      </Box>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#D9E9DD]">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="px-4 pt-5 pb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Image
              source={require("../../../assets/images/ariba-logo.png")}
              style={{ width: 50, height: 50, marginRight: 8 }}
              resizeMode="contain"
            />
            <RNText className="text-2xl font-extrabold text-black">
              REPORTS
            </RNText>
          </View>
        </View>

        {/* Search + Filter */}
        <View className="flex-row items-center justify-end mt-3">
          <Box className="w-[160px] h-10">
            <SearchBar
              value={searchQuery}
              onChangeText={(text) => setSearchQuery(text)}
              placeholder="Search"
              className="w-[140px]"
            />
          </Box>

         <TouchableOpacity
  className="w-10 h-10 items-center justify-center ml-2 rounded-md"
  style={{
    backgroundColor: "#D9E9DD",
    borderWidth: 2,
    borderColor: "#064E3B",
  }}
  onPress={() =>
    setStatusFilter((prev) => {
      if (prev === null) return "pending";     // First click → Pending
      if (prev === "pending") return "responded"; // Next → Responded
      if (prev === "responded") return "ignored"; // Next → Ignored
      return null; // Next → Reset (show all)
    })
  }
>
  <FilterIcon size={18} color="#1F2937" strokeWidth={2.5} />
</TouchableOpacity>
        </View>
      </View>

      {/* Reports List */}
      <FlatList
        data={filteredReports}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 5 }}
        renderItem={({ item }) => (
          <View className="bg-white rounded-xl p-4 mb-2 shadow">
            <View className="flex-row justify-between items-start">
              {/* Left Side */}
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
  <RNText
    className="text-xl font-bold text-black mr-1"
    numberOfLines={1}
    ellipsizeMode="tail"
    style={{ flexShrink: 1 }}
  >
    {item.title || "Untitled"}
  </RNText>

  {/* Tier Color Mapping */}
  <RNText
    className="text-lg font-bold"
    style={{
      color:
        item.tier?.toLowerCase() === "low"
          ? "#16A34A" // Green
          : item.tier?.toLowerCase() === "medium"
          ? "#EAB308" // Yellow
          : item.tier?.toLowerCase() === "high"
          ? "#F97316" // Orange
          : item.tier?.toLowerCase() === "emergency"
          ? "#DC2626" // Red
          : "#6B7280", // Default Gray if undefined
    }}
  >
    • {item.tier || "N/A"}
  </RNText>
</View>
                <RNText className="text-xs text-gray-500">
                  {formatDate(item.timestamp)}
                </RNText>
                <RNText
  className="text-sm text-black mt-2"
  numberOfLines={2}
  ellipsizeMode="tail"
>
  {item.description || "No description"}
</RNText>

{/* Show "Click to see more..." if description length is long */}
{item.description && item.description.length > 80 && (
  <TouchableOpacity
    onPress={() => router.push(`/(tabs)/(reports)/${item.id}`)}
  >
    <RNText className=" text-gray-500 text-sm">
      Click to see more...
    </RNText>
  </TouchableOpacity>
)}
              </View>

              {/* Right Side */}
<View className="items-center">
  {/* Buttons at the top */}
  <View className="flex-row mb-2 self-end">
    <TouchableOpacity className="w-7 h-7 mr-2 items-center justify-center rounded-md bg-green-500">
      <Edit3 size={16} color="#fff" />
    </TouchableOpacity>
    <TouchableOpacity className="w-7 h-7 items-center justify-center rounded-md bg-red-500">
      <Trash2 size={16} color="#fff" />
    </TouchableOpacity>
  </View>

  {/* Image below */}
  {item.images && item.images.length > 0 ? (
    <Image
      source={{ uri: item.images[0] }}
      style={{
        width: 130,
        height: 100,
        borderRadius: 8,
        marginBottom: 8,
      }}
    />
  ) : (
    <View
      style={{
        width: 90,
        height: 70,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ccc",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <RNText className="text-xs text-gray-400">No Image</RNText>
    </View>
  )}
</View>
            </View>

            {/* Status */}
            <RNText
              className="-mt-9 text-2xl font-bold"
              style={{
                color:
                  item.status?.toLowerCase() === "responded"
                    ? "#16A34A"
                    : item.status?.toLowerCase() === "ignored"
                    ? "#DC2626"
                    : "#374151",
              }}
            >
              {item.status?.toUpperCase() || "N/A"}
            </RNText>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center mt-12">
            <RNText>No reports found</RNText>
          </View>
        }
      />
    </SafeAreaView>
  );
}
