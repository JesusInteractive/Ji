import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';
import AppRoot from './src/AppRoot';

// Keeps the native splash (assets/splash.png) on screen past its normal
// auto-hide point -- LogoIntroScreen calls SplashScreen.hideAsync() itself,
// once its own static logo overlay has mounted, so the native splash
// dissolves into that identical-looking overlay instead of an abrupt cut
// to a blank frame. Errors ignored: this can throw if the splash was
// already auto-hidden by the time this runs, which is harmless.
SplashScreen.preventAutoHideAsync().catch(() => {});

// registerRootComponent calls AppRegistry.registerComponent('main', ...)
// and sets up the environment appropriately for either Expo Go or a
// native build.
registerRootComponent(AppRoot);
