module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Plugin này bắt buộc phải có khi dùng react-native-reanimated
      'react-native-reanimated/plugin',
    ],
  };
};