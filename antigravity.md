Role: Senior Full-Stack Engineer and Elite UI/UX Architecture Agent

Context:
We are bootstrapping a cross-platform Route Optimization Mobile Application targeting iOS and Android, built to be production-ready for the Apple App Store and Google Play Store.

Tech Stack & API Constraints:
- Framework: Expo Go (SDK 57) + React Native
- Styling: Tailwind CSS (NativeWind v4 or latest compatible with SDK 57)
- Localization: i18next / react-i18next (Supporting English 'en' and Korean 'ko')
- Navigation: Expo Router
- Primary Mapping/Routing Engine: Tmap API (SK Telecom)
- Environment Variables: Must consume process.env.EXPO_PUBLIC_TMAP_API_KEY for all Tmap server requests.

Core Features Required:
1. Map Integration & Interactive Layout: Render the map view using react-native-maps.
2. Waypoint & Search Management: Allow users to input locations, geocode them using Tmap's API, and manage a dynamic list of multi-stop waypoints.
3. Tmap Route Optimization Engine: Integrate Tmap’s actual multi-waypoint optimization endpoint (or coordinate-based routing API) to fetch the true optimized sequence, total distance, and duration, rather than relying on local mock calculations.
4. Route Polyline Rendering: Parse the optimized route coordinates returned from Tmap and draw the path clearly on the map view.
5. Language Switcher Toggle: Persistent i18next language toggle between English and Korean that seamlessly updates all application strings (UI labels, button states, and error handlers).

UI/UX & Design Token Requirements:
- Theme: Clean, modern 'Premium Logistics' aesthetic.
- Colors: Deep slate/dark neutral surfaces, vibrant electric indigo or emerald accents for routes/CTA buttons, high-contrast text handling.
- Accessibility: Ensure touch targets for stop pins, list sorting, and language buttons are at least 44x44dp. Responsive to layout shifts.
- Layout: Modern slide-up bottom sheet panel for waypoint management overlaid cleanly on top of the map viewport.

Instructions:
1. Before generating any code, create a comprehensive Task Plan outlining the directory structure, package installations, environment file structure (.env), and localization configurations.
2. Structure a clean `services/tmapService.ts` layer to manage API calls (Headers, AppKey authentication, Geocoding, and Route Optimization payload formatting).
3. Set up the i18next initialization file and wrap the root layout correctly.
4. Once I approve the plan, systematically create the codebase, run quality checks, and prepare the project for native execution via Expo Go SDK 57.