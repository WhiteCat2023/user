import { format, isThisMonth, isThisWeek, isToday, isYesterday } from "date-fns";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  Text as RNText,
  SafeAreaView,
  SectionList,
  StatusBar,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";

import { Filter as FilterIcon } from "lucide-react-native";

import { getAllReportsAsNotifications } from "@/api/controller/report.controller";
import SearchBar from "@/components/inputs/searchbar/SearchBar";
import { Box } from "@/components/ui/box";
import { useAuth } from "@/context/AuthContext";
import ReportNotificationService from "../../../utils/ReportNotificationService";

const NotificationsScreen = () => {
  const router = useRouter();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [statusFilter, setStatusFilter] = useState("responded");
  const [sortOrder, setSortOrder] = useState("desc");

  const { width } = useWindowDimensions();
  const isMobile = true; // ✅ always mobile in Expo Go

  useEffect(() => {
    if (!user?.uid) return;

    // Set up notifications permission
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Start listening to report updates
    ReportNotificationService.listenToReportUpdates(user.uid, fetchNotifications);

    // Clean up listener
    return () => {
      ReportNotificationService.stopListening();
    };
  }, [user]);

  // fetch data
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const result = await getAllReportsAsNotifications();
      if (result.status === 200) {
        const reports = result.data
          .filter((r) => r.uid === user?.uid)
          .sort((a, b) => {
            const dateA = a.timestamp?.toDate
              ? a.timestamp.toDate()
              : new Date(a.timestamp);
            const dateB = b.timestamp?.toDate
              ? b.timestamp.toDate()
              : new Date(b.timestamp);
            return dateB.getTime() - dateA.getTime();
          });

        setNotifications(reports);
        setFilteredNotifications(reports);

        // Update badge count
        await Notifications.setBadgeCountAsync(
          reports.filter((r) => !r.isRead).length
        );
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    let filtered = notifications;

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tier?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(
        (item) => item.status?.toLowerCase() === statusFilter
      );
    }

    filtered.sort((a, b) => {
      const dateA = a.timestamp?.toDate
        ? a.timestamp.toDate()
        : new Date(a.timestamp);
      const dateB = b.timestamp?.toDate
        ? b.timestamp.toDate()
        : new Date(b.timestamp);
      return sortOrder === "desc"
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });

    setFilteredNotifications(filtered);
    setCurrentPage(1);
  }, [notifications, searchQuery, statusFilter, sortOrder]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredNotifications.slice(startIndex, endIndex);

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, "MMM. dd, yyyy | h:mma");
    } catch {
      return "Invalid Date";
    }
  };

  const groupNotificationsByDate = (notifications) => {
    const grouped = notifications.reduce((groups, item) => {
      const date = item.timestamp?.toDate
        ? item.timestamp.toDate()
        : new Date(item.timestamp);

      let dateGroup;
      if (isToday(date)) {
        dateGroup = "Today";
      } else if (isYesterday(date)) {
        dateGroup = "Yesterday";
      } else if (isThisWeek(date)) {
        dateGroup = "This Week";
      } else if (isThisMonth(date)) {
        dateGroup = "This Month";
      } else {
        dateGroup = "Earlier";
      }

      if (!groups[dateGroup]) {
        groups[dateGroup] = [];
      }
      groups[dateGroup].push(item);
      return groups;
    }, {});

    return Object.entries(grouped).map(([title, data]) => ({
      title,
      data: data.sort((a, b) => {
        const dateA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const dateB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      })
    }));
  };

  if (loading) {
    return (
      <Box className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
        <RNText className="mt-4">Loading notifications...</RNText>
      </Box>
    );
  }

  // ✅ Mobile Layout Only
  return (
    <SafeAreaView className="flex-1 bg-[#D9E9DD]">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="px-4 pt-3 pb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Image
              source={require("../../../assets/images/ariba-logo.png")}
              style={{ width: 80, height: 80, marginRight: 1 }}
              resizeMode="contain"
            />
            <RNText className="text-3xl font-[Poppins]">NOTIFICATION</RNText>
          </View>
        </View>

        {/* Search + Filter */}
        <View className="flex-row items-center justify-end">
          <Box className="w-[160px] h-10">
            <SearchBar
              value={searchQuery}
              onChangeText={(text) => setSearchQuery(text)}
              placeholder="Search"
              className="w-[140px]"
            />
          </Box>

          {/* Filter button */}
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center ml-2 rounded-md"
            style={{
              backgroundColor: "#D9E9DD", // same as page background
              borderWidth: 2,
              borderColor: "#064E3B", // dark green border
            }}
            onPress={() =>
              setStatusFilter((prev) =>
                prev === "responded" ? "ignored" : "responded"
              )
            }
          >
            <FilterIcon size={18} color="#1F2937" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications List */}
      <SectionList
        sections={groupNotificationsByDate(filteredNotifications)}
        keyExtractor={(item) => item.id || item._id || Math.random().toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
        renderSectionHeader={({ section: { title } }) => (
          <View className="py-2 px-4 bg-[#D9E9DD]">
            <RNText className="text-lg font-[DMBold] text-gray-700">{title}</RNText>
          </View>
        )}
        renderItem={({ item }) => (
          <View className="bg-white rounded-xl p-4 mb-4 shadow">
            <View className="flex-row justify-between items-start">
              {/* Left: Title + Date + Description */}
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View className="flex-row items-center flex-nowrap">
                  {/* Title */}
                  <RNText
                    className="text-lg mr-2 font-[DMBold]"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{ maxWidth: "55%" }} // ✅ slightly smaller to give space for timestamp
                  >
                    {item.title || "Untitled Report"}
                  </RNText>

                  {/* Separator circle */}
                  <RNText className="text-gray-400 mx-1">•</RNText>

                  {/* Timestamp (truncate if too long) */}
                  <RNText
                    className="text-xs text-gray-500 font-[DM]"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{ maxWidth: "40%" }} // ✅ prevents wrapping below
                  >
                    {formatDate(item.timestamp)}
                  </RNText>
                </View>

                {/* Description (1 line max + "Click to see more...") */}
                <TouchableOpacity
                  onPress={() => router.push(`(tabs)/(notifications)/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <RNText
                    className="text-sm text-gray-600 mt-2 font-[DM]"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.description || "No description"}
                  </RNText>

                  {item.description && item.description.length > 60 && (
                    <RNText className="text-sm text-gray-400 font-[DM]">
                      Click to see more...
                    </RNText>
                  )}
                </TouchableOpacity>
              </View>

              {/* Right: Tier + Status (inside card, no overlap) */}
              <View className="items-end justify-between">
                <RNText
                  className=" text-lg font-[DMBold]"
                  style={{
                    color:
                      item.tier?.toLowerCase() === "low"
                        ? "#16A34A" // green-600
                        : item.tier?.toLowerCase() === "medium"
                        ? "#EAB308" // yellow-500
                        : item.tier?.toLowerCase() === "high"
                        ? "#F97316" // orange-500
                        : item.tier?.toLowerCase() === "emergency"
                        ? "#DC2626" // red-600
                        : "#6B7280", // gray-500 (default if tier is missing/unknown)
                  }}
                >
                  {(item.tier || "N/A").toUpperCase()}
                </RNText>
                <RNText
                  className="mt-10 text-lg font-[DMBold]"
                  style={{
                    color:
                      item.status?.toLowerCase() === "responded"
                        ? "#16A34A" // green-600
                        : item.status?.toLowerCase() === "ignored"
                        ? "#DC2626" // red-600
                        : "#374151", // default gray-700
                  }}
                >
                  {(item.status || "N/A").toUpperCase()}
                </RNText>
              </View>
            </View>
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
};

export default NotificationsScreen;
