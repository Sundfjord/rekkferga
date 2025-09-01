import { View } from "react-native";

export default function Map() {
  return <View />;
}

// import { Platform } from "react-native";
// import React, { useEffect, useState } from "react";

// export default function Map() {
//   const [MapComponent, setMapComponent] = useState<React.ComponentType | null>(
//     null
//   );

//   useEffect(() => {
//     if (Platform.OS === "web") {
//       import("../components/MapWeb").then((mod) =>
//         setMapComponent(() => mod.default)
//       );
//     } else {
//       import("../components/MapNative").then((mod) =>
//         setMapComponent(() => mod.default)
//       );
//     }
//   }, []);

//   if (!MapComponent) return null;
//   return <MapComponent />;
// }
