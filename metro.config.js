const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
  'obj', 'mtl', 'vrx', 'gltf', 'glb', 'bin'
);

module.exports = config;
