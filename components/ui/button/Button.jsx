import { Platform, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function Button({ title, onPress, style, textStyle, children }) {
  const isWeb = Platform.OS === "web";
  const currentStyles = isWeb ? stylesWeb : stylesMobile;

  return (
    <TouchableOpacity style={[currentStyles.button, style]} onPress={onPress}>
      {children ? (
        children
      ) : (
        <Text style={[currentStyles.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const baseStyles = {
  button: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8, // smooth rounded corners
    backgroundColor: "#fff",
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 3,
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
};

const stylesWeb = StyleSheet.create({
  ...baseStyles,
  button: {
    ...baseStyles.button,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
});

const stylesMobile = StyleSheet.create({
  ...baseStyles,
  button: {
    ...baseStyles.button,
    bottom: 20,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 14, // slightly bigger tap target
  },
});
