module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated 4 moved the Babel plugin into react-native-worklets;
      // must be listed last per the docs.
      'react-native-worklets/plugin',
    ],
  };
};
