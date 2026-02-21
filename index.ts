import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';
import './src/i18n'; // Initialize i18n

// Suppress noisy third-party library warnings that don't affect functionality
LogBox.ignoreLogs([
    'expo-notifications',
    'i18next',
    '[i18next]',
    'locize',
    'InCallManager',
    'Cannot read property',
    'TypeError: Cannot read',
    'new NativeEventEmitter',
    'EventEmitter.removeListener',
]);

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
