import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AIChatbot() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I'm NicolAI 🤖. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const scrollViewRef = useRef(null);

  // inside AIChatbot
const { user } = useAuth(); // Add this at the top of the component

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    const typingMessage = { sender: "bot", text: "..." };
    setMessages((prev) => [...prev, typingMessage]);

    try {
      const response = await fetch(
        "https://ethangabril.app.n8n.cloud/webhook-test/de96b7cc-d472-4bf4-b534-1de06cb85947",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: "demo-session", message: input }),
        }
      );
      const data = await response.json();

      setMessages((prev) => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = {
          sender: "bot",
          text: data.output || "Sorry, I didn't understand that.",
        };
        return newMsgs;
      });
    } catch (err) {
      console.error("Chatbot error:", err);
      setMessages((prev) => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = {
          sender: "bot",
          text: "⚠️ Error connecting to AI.",
        };
        return newMsgs;
      });
    }

    setLoading(false);
  };

  // Colors based on theme
  const themeColors = {
    background: isDarkMode ? "#1c1c1c" : "#D9E9DD",
    headerBg: isDarkMode ? "#121212" : "#fff",
    headerText: isDarkMode ? "#A0FFA0" : "#347a42",
    userMsg: isDarkMode ? "#286738" : "#b7e0b3",
    botMsg: isDarkMode ? "#333" : "#FFFFFF",
    inputBg: isDarkMode ? "#222" : "#fff",
    inputText: isDarkMode ? "#fff" : "#000",
    sendIcon: isDarkMode ? "#80FF80" : "#347a42",
    typingDot: isDarkMode ? "#aaa" : "#555",
    placeholder: isDarkMode ? "#888" : "#666",
  };

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg }]}>
        <Ionicons name="sparkles-outline" size={24} color={themeColors.sendIcon} />
        <Text style={[styles.headerTitle, { color: themeColors.headerText }]}>NicolAI</Text>

        {/* Light/Dark icon toggle */}
        <TouchableOpacity style={{ marginLeft: "auto" }} onPress={toggleTheme}>
          <Ionicons
            name={isDarkMode ? "sunny-outline" : "moon-outline"}
            size={24}
            color={themeColors.headerText}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.chatArea}
        onContentSizeChange={() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        }}
      >
       {messages.map((msg, idx) => (
  <View
    key={idx}
    style={[
      styles.messageRow,
      msg.sender === "user"
        ? { justifyContent: "flex-end" }
        : { justifyContent: "flex-start" },
    ]}
  >
    {/* Message bubble first for user, then profile pic */}
    {msg.sender === "user" && (
      <View
        style={[
          styles.message,
          { backgroundColor: themeColors.userMsg },
        ]}
      >
        <Text style={{ color: themeColors.inputText }}>{msg.text}</Text>
      </View>
    )}

    {msg.sender === "bot" && (
      <>
        {/* Bot profile pic */}
        <Image
          source={require("@/assets/images/ariba-logo.png")}
          style={styles.profilePic}
        />
        {/* Bot message bubble */}
        <View
          style={[
            styles.message,
            { backgroundColor: themeColors.botMsg },
          ]}
        >
          {msg.text === "..." ? (
            <TypingIndicator typingDotColor={themeColors.typingDot} />
          ) : (
            <Text style={{ color: themeColors.inputText }}>{msg.text}</Text>
          )}
        </View>
      </>
    )}

    {/* User profile pic at the right */}
    {msg.sender === "user" && (
      <Image
        source={{ uri: user?.photoURL || "https://i.pravatar.cc/100" }}
        style={styles.profilePic}
      />
    )}
  </View>
))}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.inputArea, { backgroundColor: themeColors.inputBg }]}>
          <TextInput
            style={[styles.input, { color: themeColors.inputText }]}
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            placeholderTextColor={themeColors.placeholder}
            editable={!loading}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={loading}>
            <Ionicons name="send" size={24} color={themeColors.sendIcon} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const TypingIndicator = ({ typingDotColor }) => (
  <View style={styles.typingContainer}>
    <Text style={[styles.typingDot, { color: typingDotColor }]}>•</Text>
    <Text style={[styles.typingDot, { color: typingDotColor }]}>•</Text>
    <Text style={[styles.typingDot, { color: typingDotColor }]}>•</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", marginLeft: 8 },
  chatArea: { padding: 12 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", marginVertical: 4 },
  profilePic: { width: 36, height: 36, borderRadius: 18, marginHorizontal: 6 },
  message: { padding: 12, borderRadius: 20, maxWidth: "75%" },
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 12,
    elevation: 2,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 6, paddingHorizontal: 10 },
  sendBtn: { padding: 8, borderRadius: 50, justifyContent: "center", alignItems: "center" },
  typingContainer: { flexDirection: "row", alignItems: "center", padding: 4 },
  typingDot: { fontSize: 18, marginHorizontal: 2 },
});
