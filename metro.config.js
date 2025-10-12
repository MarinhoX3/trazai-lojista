// metro.config.js - Localizado em I:\ADMX3\app-lojista\

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Obtém a configuração padrão do Expo
const config = getDefaultConfig(__dirname);

// --- CORREÇÃO PARA AMBIENTES MONOREPO (Caminhos ABSOLUTOS e Seguros) ---

// Define o caminho para a pasta raiz do seu monorepo (I:\ADMX3)
const workspaceRoot = path.resolve(__dirname, '..'); // Volta de app-lojista para ADMX3
const projectRoot = __dirname; // I:\ADMX3\app-lojista

// 1. O Metro deve observar a pasta raiz e o projeto (para buscar arquivos).
config.watchFolders = [workspaceRoot, projectRoot];

// 2. Define os locais onde o Metro deve procurar pacotes (node_modules).
// Adicionamos apenas os locais que o Metro precisa:
config.resolver.nodeModulesPaths = [
    path.resolve(workspaceRoot, 'node_modules'), // Caminho: I:\ADMX3\node_modules
    path.resolve(projectRoot, 'node_modules'), // Caminho: I:\ADMX3\app-lojista\node_modules (seu local principal)
];

// 3. Garante que o Metro consiga lidar com SVG e outros assets
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

// --- SOLUÇÃO PARA O ERRO DO STRIPE (Módulos Nativos na Web) ---

// Mantemos o mock para o módulo nativo do Stripe, essencial para builds funcionarem.
config.resolver.unstable_enableSymlinks = true;
config.resolver.resolverMainFields = ['sbmodern', 'browser', 'main'];

config.resolver.extraNodeModules = {
    'react-native/Libraries/Utilities/codegenNativeComponent': require.resolve('react-native/Libraries/Utilities/codegenNativeComponent'),
};


module.exports = config;
