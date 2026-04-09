import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import type { SearchResult } from "@shared/types";
import SearchResultItem from "./SearchResultItem";

interface SearchProps {
  onSelect: (result: SearchResult) => void;
}

export default function Search({ onSelect }: SearchProps) {
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
          const res = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/search?query=${encodeURIComponent(debouncedPhrase)}`,
            { headers: { "ngrok-skip-browser-warning": "true" } }
          );
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

  return (
    <View>
      <View className="relative">
        <TextInput
          className={`bg-surface text-surface-on px-4 py-3 text-base border border-border shadow-sm ${
            showDropdown && searchResults.length > 0 ? "rounded-t-xl" : "rounded-xl"
          }`}
          placeholder="Where are you going today?"
          placeholderTextColor="#bdbdbd"
          value={searchPhrase}
          onChangeText={setSearchPhrase}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          style={{ fontWeight: "500" }}
        />
        {loading && (
          <View className="absolute right-4 top-3">
            <ActivityIndicator size="small" color="#011638" />
          </View>
        )}
      </View>

      {showDropdown && searchResults.length > 0 && (
        <View className="bg-surface rounded-b-xl border border-border shadow-sm max-h-60 border-t-0">
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
