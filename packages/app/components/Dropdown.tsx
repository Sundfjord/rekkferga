import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "@/hooks/useTranslation";
import { FontAwesome6 } from "@expo/vector-icons";

interface DropdownProps {
  title: string;
  onPressOption: (option: Option) => void;
  options: Option[];
  selectedOption: string;
  background?: string;
}

export interface Option {
  value: string;
  name: string;
  icon?: React.ReactNode | string;
}

export default function Dropdown({
  title,
  onPressOption,
  options,
  selectedOption,
  background = "background",
}: DropdownProps) {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <View className="px-4">
      <View className="flex-row items-center justify-between">
        {title && (
          <View className="flex-row items-center">
            <Text className={`text-${background}-on text-md font-semibold`}>
              {title}
            </Text>
          </View>
        )}
        <Pressable
          onPress={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex-row items-center"
        >
          <View className="flex-row items-center gap-2">
            <Text className={`text-${background}-on`}>
              {t(selectedOption) || selectedOption}
            </Text>
            <FontAwesome6
              name={isDropdownOpen ? "chevron-up" : "chevron-down"}
              size={12}
              className={`text-${background}-on`}
            />
          </View>
        </Pressable>
      </View>

      {isDropdownOpen && (
        <View className="bg-surface rounded-lg mt-2 overflow-hidden">
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={async () => {
                setIsDropdownOpen(false);
                onPressOption(option);
              }}
              className={`p-2 flex-row items-center gap-2 ${
                selectedOption === option.name
                  ? "bg-primary-dark"
                  : "bg-transparent"
              }`}
            >
              {option.icon && <Text className="text-xl">{option.icon}</Text>}
              <Text
                className={`text-md ${
                  selectedOption === option.name
                    ? "text-surface-on font-semibold"
                    : "text-surface-on"
                }`}
              >
                {t(option.name) || option.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
