# E16 — Owner notes

## Bundle identifier

Use `io.github.fletcherwerner.trainmetosing`.

- Set it in `capacitor.config.ts` (`appId`) and in `PRODUCT_BUNDLE_IDENTIFIER` in `ios/App/App.xcodeproj/project.pbxproj`, for both Debug and Release. Keep them equal.
- No version number in the bundle id. Leave `MARKETING_VERSION` (1.0) and `CURRENT_PROJECT_VERSION` (1) as they are.
- Update `docs/ios-build.md` so it no longer tells the owner to replace the placeholder, only to choose their signing team.
