import { TouchableOpacity, Text, StyleSheet } from "react-native";
import type { SearchResult } from "@shared/types";
import { useThemeColors } from "../contexts/ThemeContext";

interface SearchResultItemProps {
  item: SearchResult;
  isLastItem: boolean;
  onSelect: (item: SearchResult) => void;
}

export default function SearchResultItem({ item, isLastItem, onSelect }: SearchResultItemProps) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      onPress={() => onSelect(item)}
      style={[styles.row, { borderBottomColor: colors.border }, !isLastItem && styles.border]}
      activeOpacity={0.7}
    >
      <Text style={[styles.name, { color: colors.onSurface }]}>{item.name}</Text>
      {item.subName && (
        <Text style={[styles.subName, { color: colors.onSurface }]}>{item.subName}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  border: {
    borderBottomWidth: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: "DMSans-Medium",
  },
  subName: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 1,
    fontFamily: "DMSans-Regular",
  },
});
