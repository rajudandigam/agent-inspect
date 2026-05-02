export default [
  {
    name: "@agent-inspect/core",
    path: "packages/core/dist/index.mjs",
    limit: "120 KB",
    modifyEsbuildConfig(config) {
      config.platform = "node";
      return config;
    },
  },
];
