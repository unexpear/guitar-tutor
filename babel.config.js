module.exports = function (api) {
  api.cache.using(() => process.env.NODE_ENV);
  const production = process.env.NODE_ENV === 'production';
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ...(production ? [] : [require('@reticlehq/babel-plugin')]),
      'react-native-reanimated/plugin',
    ],
  };
};
