import React, { useCallback, useState } from "react";
import { View, ScrollView } from "react-native";
import Search from "@/components/Search";
import Nearby from "@/components/Nearby";
import Favourites from "@/components/Favourites";

function Index() {
  const [loadingMore, setLoadingMore] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const handleScroll = useCallback(
    (event: any) => {
      const { layoutMeasurement, contentOffset, contentSize } =
        event.nativeEvent;
      const paddingToBottom = 20;

      if (
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingToBottom
      ) {
        if (hasMore && !loadingMore) {
          setLoadingMore(true);
        }
      }
    },
    [hasMore, loadingMore]
  );

  return (
    <ScrollView
      className="flex-1 p-4"
      onScroll={handleScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-y-4">
        <View>
          <Search />
          <Favourites />
        </View>
        <Nearby
          onLoadMore={() => setLoadingMore(true)}
          onLoadMoreComplete={() => setLoadingMore(false)}
          onHasMoreChange={setHasMore}
          loadingMore={loadingMore}
          hasMore={hasMore}
        />
      </View>
    </ScrollView>
  );
}

export default Index;
