import { TouchableOpacity, Text, View } from "react-native";
import { SearchResult } from "../types";
import { useTranslation } from "../hooks/useTranslation";

import { useRouter } from "expo-router";
interface SearchResultItemProps {
  item: SearchResult;
  isLastItem: boolean;
}

export default function SearchResultItem({
  item,
  isLastItem,
}: SearchResultItemProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const handleResultSelect = () => {
    if (item.type === "location") {
      router.push(`/destination/${item.latitude},${item.longitude}`);
    } else {
      router.push(`/${item.id}`);
    }
  };

  return (
    <TouchableOpacity
      key={item.id}
      onPress={handleResultSelect}
      className={`px-4 py-3 ${!isLastItem ? "border-b border-border" : ""}`}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        <View className="flex-1">
          <Text className="font-medium text-base text-surface-on">
            {item.name}
          </Text>
          <Text className="opacity-70 text-sm text-surface-on">
            {item.sub_name}
          </Text>
        </View>
        <View className="ml-2">
          <Text
            className={`text-xs px-2 py-1 rounded ${
              item.type === "location" ? "bg-primary-light" : "bg-primary"
            } text-on-primary`}
          >
            {item.type === "location" ? t("destination") : t("quay")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
