import { Feather, Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Input = ({
  placeholder,
  secureTextEntry,
  value,
  onChangeText,
  icon,
  onIconPress,
  leftIconName,
  type, // "password" | "confirmPassword" | "text"
  compareWith, // for confirmPassword
  showErrors, // parent forces validation on submit
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const isWeb = Platform.OS === "web";

  // password rules
  const passwordRules = [
    { test: /.{12,}/, message: "At least 12 characters" },
    { test: /[A-Za-z]/, message: "At least 1 letter" },
    { test: /\d/, message: "At least 1 number" },
    { test: /[^A-Za-z0-9]/, message: "At least 1 special character" },
  ];

  // validation messages
  let validations = [];
  const shouldValidate =
    type === "password" || type === "confirmPassword"
      ? touched // ✅ live validation for passwords
      : showErrors; // ✅ only after Sign Up for others

  if (shouldValidate) {
    if (!value) {
      validations.push({ message: `${placeholder} is required`, valid: false });
    } else if (type === "password") {
      validations = [
        ...validations,
        ...passwordRules.map((rule) => ({
          message: rule.message,
          valid: rule.test.test(value),
        })),
      ];
    } else if (type === "confirmPassword") {
      validations.push({
        message: "Passwords match",
        valid: value === compareWith && !!value,
      });
    }
  }

  const hasError = validations.some((v) => !v.valid);
  const currentStyles = isWeb ? stylesWeb : stylesMobile;

  return (
    <View style={{ width: "100%" }}>
      <View
        style={[
          currentStyles.inputContainer,
          isFocused && currentStyles.focusedBorder,
          hasError && currentStyles.errorBorder,
        ]}
      >
        {leftIconName && (
          <Feather
            name={leftIconName}
            size={20}
            color="#4b5563"
            style={currentStyles.leftIcon}
          />
        )}

        <TextInput
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => {
            setIsFocused(true);
            setTouched(true);
          }}
          onBlur={() => setIsFocused(false)}
          style={currentStyles.input}
          placeholderTextColor="#6b7280"
        />

        {icon && (
          <TouchableOpacity onPress={onIconPress}>
            <Ionicons name={icon} size={20} color="#4b5563" />
          </TouchableOpacity>
        )}
      </View>

      {/* Validation messages */}
      {shouldValidate && validations.length > 0 && (
        <View style={{ marginBottom: 5, marginLeft: 2 }}>
          {validations.map((v, i) => (
            <Text
              key={i}
              style={{ fontSize: 12, color: v.valid ? "#16a34a" : "#dc2626" }}
            >
              {v.valid ? "✔ " : "✘ "} {v.message}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const baseStyles = {
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#22c55e",
    borderRadius: 8,
    backgroundColor: "white",
  },
  focusedBorder: {
    borderColor: "#16a34a",
  },
  errorBorder: {
    borderColor: "#dc2626",
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
};

const stylesWeb = StyleSheet.create({
  ...baseStyles,
  inputContainer: {
    ...baseStyles.inputContainer,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 18,
  },
});

const stylesMobile = StyleSheet.create({
  ...baseStyles,
  inputContainer: {
    ...baseStyles.inputContainer,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
});

export default Input;
