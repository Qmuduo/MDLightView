const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const workDirectory = path.resolve(__dirname, 'work').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const workBlockList = new RegExp(`^${workDirectory}(?:[\\\\/]|$)`);

config.resolver.blockList = [...config.resolver.blockList, workBlockList];

module.exports = config;
