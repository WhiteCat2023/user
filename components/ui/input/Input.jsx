import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

const Input = ({
  placeholder,
  secureTextEntry,
  value,
  onChangeText,
  icon,
  onIconPress,
  leftIconName,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focusedBorder,
        ]}
      >
        {/* Left icon */}
        {leftIconName && (
          <Feather
            name={leftIconName}
            size={20}
            color="#4b5563"
            style={styles.leftIcon}
          />
        )}

        {/* Input field */}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#6b7280"
          secureTextEntry={secureTextEntry}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={styles.input}
        />

        {/* Right icon (toggle password) */}
        {icon && (
          <TouchableOpacity onPress={onIconPress}>
            <Ionicons name={icon} size={20} color="#4b5563" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginBottom: 18,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5, // ✅ thinner border like screenshot
    borderColor: "#22c55e",
    borderRadius: 8,
    backgroundColor: "white",
    paddingHorizontal: 12,
    height: 50, // ✅ match screenshot height
  },
  focusedBorder: {
    borderColor: "#16a34a",
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
});

export default Input;
