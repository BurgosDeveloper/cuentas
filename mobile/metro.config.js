const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  '@cuentas/shared': path.resolve(__dirname, 'src/shared'),
};

module.exports = config;
