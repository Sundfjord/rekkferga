const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Required for npm workspaces monorepo: tell Metro where to find hoisted packages
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Resolve @shared/* → shared/ in the monorepo root
config.resolver.extraNodeModules = {
  "@shared": path.resolve(workspaceRoot, "shared"),
};

module.exports = withNativeWind(config, { input: "./global.css" });
