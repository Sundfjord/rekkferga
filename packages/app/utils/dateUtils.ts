import { useTranslation } from "@/hooks/useTranslation";

// Helper function to format duration in hours and minutes
export const formatDuration = (
  minutes: number,
  t: (key: string) => string
): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}${t("minutesShort")}`;
  } else if (remainingMinutes === 0) {
    return `${hours}${t("hoursShort")}`;
  } else {
    return `${hours}${t("hoursShort")} ${remainingMinutes}${t("minutesShort")}`;
  }
};

// Helper function to format time in Norwegian locale
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleTimeString("no-NO", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Helper function to calculate time difference in minutes
export const getTimeDifferenceMinutes = (
  date1: Date | string,
  date2: Date | string
): number => {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60));
};

// Helper function to calculate and format margin between arrival and departure
export const calculateMarginText = (
  arrivalTime: Date | string,
  departureTime: Date | string,
  t: (key: string) => string
): string | null => {
  const marginMinutes = getTimeDifferenceMinutes(arrivalTime, departureTime);

  let hours = 0;
  let minutes = 0;

  if (marginMinutes > 0) {
    hours = Math.floor(marginMinutes / 60);
    minutes = marginMinutes % 60;
  } else if (marginMinutes < 0) {
    const absMinutes = Math.abs(marginMinutes);
    hours = Math.floor(absMinutes / 60);
    minutes = absMinutes % 60;
  }

  if (hours >= 1) {
    return `${hours}${t("hoursShort")} ${minutes}${t("minutesShort")}`;
  } else {
    return `${minutes}${t("minutesShort")}`;
  }
};
