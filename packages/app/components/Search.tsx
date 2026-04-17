import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import type { SearchResult } from "@shared/types";
import SearchResultItem from "./SearchResultItem";
import { useThemeColors } from "../contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";

// Simple filled location pin
const PinIcon = ({ color }: { color: string }) => (
  <Text style={{ fontSize: 20, lineHeight: 24, color }}>📍</Text>
);

interface SearchProps {
  onSelect: (result: SearchResult) => void;
  showTagline?: boolean;
}

export default function Search({ onSelect, showTagline = false }: SearchProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [searchPhrase, setSearchPhrase] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedPhrase, setDebouncedPhrase] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (searchPhrase) {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [searchPhrase]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedPhrase(searchPhrase), 300);
    return () => clearTimeout(handler);
  }, [searchPhrase]);

  useEffect(() => {
    const doSearch = async () => {
      if (debouncedPhrase.length > 2) {
        setLoading(true);
        try {
          const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/search?query=${encodeURIComponent(debouncedPhrase)}`);
          const data: SearchResult[] = await res.json();
          setSearchResults(data);
          setShowDropdown(true);
        } catch {
          setSearchResults([]);
          setShowDropdown(false);
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    };
    doSearch();
  }, [debouncedPhrase]);

  const handleSelect = (result: SearchResult) => {
    setSearchPhrase(result.name);
    setShowDropdown(false);
    setSearchResults([]);
    onSelect(result);
  };

  const hasDropdown = showDropdown && searchResults.length > 0;

  return (
    <View>
      {showTagline && (
        <Text style={[styles.tagline, { color: "rgba(255,255,255,0.65)", fontFamily: "Syne-SemiBold" }]}>
          {t("searchTagline").toUpperCase()}
        </Text>
      )}

      {/* Input row */}
      <View
        style={[
          styles.inputCard,
          { backgroundColor: colors.surface },
          hasDropdown && styles.inputCardOpen,
        ]}
      >
        <PinIcon color={colors.primaryLight} />
        <TextInput
          style={[styles.input, { color: colors.onSurface, fontFamily: "DMSans-Regular" }]}
          placeholder={t("searchPlaceholder")}
          placeholderTextColor={colors.onSurface + "55"}
          value={searchPhrase}
          onChangeText={setSearchPhrase}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        {loading && (
          <ActivityIndicator size="small" color={colors.primaryLight} />
        )}
      </View>

      {/* Dropdown */}
      {hasDropdown && (
        <View style={[styles.dropdown, { backgroundColor: colors.surface }]}>
          <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
            {searchResults.map((item, index) => (
              <SearchResultItem
                key={`${item.id}-${index}`}
                item={item}
                isLastItem={index === searchResults.length - 1}
                onSelect={handleSelect}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tagline: {
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  inputCardOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  input: {
    flex: 1,
    fontSize: 19,
    lineHeight: 24,
    padding: 0,
  },
  dropdown: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
});
