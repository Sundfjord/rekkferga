import React from "react";
import { View, FlatList, Text } from "react-native";

interface TimelineItem {
  id: string;
  content: React.ReactNode;
  time?: string;
  isRealtime?: boolean;
}

interface TimelineProps {
  items: TimelineItem[];
  bulletColor?: string;
  lineColor?: string;
  bulletSize?: number;
  lineWidth?: number;
  timelineWidth?: number;
}

export default function Timeline({
  items,
  bulletColor = "#42a5f5",
  lineColor = "#42a5f5",
  bulletSize = 10,
  lineWidth = 2,
  timelineWidth = 24,
}: TimelineProps) {
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => {
        const isFirst = index === 0;
        const isLast = index === items.length - 1;

        return (
          <View className="flex-row">
            {/* Time column (if time is present) */}
            {item.time && (
              <View
                style={{
                  justifyContent: "center",
                  alignItems: "flex-start",
                  paddingHorizontal: 8,
                  flexShrink: 0,
                }}
              >
                <Text
                  className={`${
                    item.isRealtime ? "text-primary" : "text-surface-on"
                  }`}
                >
                  {item.time}
                </Text>
              </View>
            )}
            {/* Timeline column */}
            <View
              style={{
                alignItems: "center",
                width: timelineWidth,
                position: "relative",
                minHeight: 32,
                flex: 0,
              }}
            >
              {/* Vertical line (absolutely positioned) */}
              {items.length > 1 && (
                <View
                  style={{
                    position: "absolute",
                    left: timelineWidth / 2 - lineWidth / 2,
                    top: isFirst ? "50%" : 0,
                    bottom: isLast ? "50%" : 0,
                    width: lineWidth,
                    backgroundColor: lineColor,
                    zIndex: 0,
                  }}
                />
              )}
              {/* Bullet (absolutely positioned and centered) */}
              <View
                style={{
                  width: bulletSize,
                  height: bulletSize,
                  borderRadius: bulletSize / 2,
                  backgroundColor: bulletColor,
                  zIndex: 1,
                  position: "absolute",
                  top: "50%",
                  left: timelineWidth / 2 - bulletSize / 2,
                  marginTop: -bulletSize / 2,
                }}
              />
            </View>
            {/* Content */}
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                paddingVertical: 8,
                marginLeft: 24,
                paddingRight: 8,
                minWidth: 0, // This is crucial for text wrapping
              }}
            >
              {item.content}
            </View>
          </View>
        );
      }}
    />
  );
}
