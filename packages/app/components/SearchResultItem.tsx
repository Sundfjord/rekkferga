import { TouchableOpacity, Text, View } from "react-native";
import type { SearchResult } from "@shared/types";

interface SearchResultItemProps {
  item: SearchResult;
  isLastItem: boolean;
  onSelect: (item: SearchResult) => void;
}

export default function SearchResultItem({ item, isLastItem, onSelect }: SearchResultItemProps) {
  return (
    <TouchableOpacity
      onPress={() => onSelect(item)}
      className={`px-4 py-3 ${!isLastItem ? "border-b border-border" : ""}`}
      activeOpacity={0.7}
    >
      <Text className="font-medium text-base text-surface-on">{item.name}</Text>
      {item.sub_name && (
        <Text className="opacity-70 text-sm text-surface-on">{item.sub_name}</Text>
      )}
    </TouchableOpacity>
  );
}
