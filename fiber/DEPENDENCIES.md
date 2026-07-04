# Dependencies & Version Notes

## Why React 18 (Not React 19)?

This app uses **React 18.3.1** instead of React 19 because:

1. **React Three Fiber v8** requires `react@">=18 <19"`
2. R3F v9 (which will support React 19) is still in development
3. React 18 is stable and fully compatible with all our packages

## Latest Package Versions (as of Nov 2025)

### Core Framework
- `next`: 16.0.3 (latest stable)
- `react`: 18.3.1 (latest 18.x)
- `react-dom`: 18.3.1 (matches React version)
- `typescript`: ^5 (latest)

### 3D Graphics
- `@react-three/fiber`: ^8.17.10 (latest v8, requires React 18)
- `@react-three/drei`: ^9.117.0 (latest compatible)
- `three`: ^0.170.0 (latest stable Three.js)

### AI & Chat
- `ai`: ^5.0.93 (Vercel AI SDK - latest)
- `@ai-sdk/openai`: ^2.0.67 (latest)
- `@ai-sdk/react`: ^2.0.93 (latest)
- `openai`: ^4.104.0 (latest)

### Authentication
- `@hypery/auth`: * (workspace package)

### UI Components (shadcn/ui via Radix)
- `@radix-ui/react-dialog`: ^1.1.15
- `@radix-ui/react-dropdown-menu`: ^2.1.16
- `@radix-ui/react-hover-card`: ^1.1.15
- `@radix-ui/react-label`: ^2.1.8
- `@radix-ui/react-scroll-area`: ^1.2.10
- `@radix-ui/react-select`: ^2.2.6
- `@radix-ui/react-separator`: ^1.1.8
- `@radix-ui/react-slot`: ^1.2.4
- `@radix-ui/react-tooltip`: ^1.2.8

### Utilities
- `clsx`: ^2.1.1
- `tailwind-merge`: ^3.4.0
- `class-variance-authority`: ^0.7.1
- `cmdk`: ^1.1.1
- `lucide-react`: ^0.541.0

### Dev Dependencies
- `@tailwindcss/postcss`: ^4 (latest Tailwind v4)
- `tailwindcss`: ^4 (latest)
- `@types/react`: ^18 (matches React 18)
- `@types/react-dom`: ^18 (matches React 18)
- `@types/three`: ^0.170.0 (matches Three.js)
- `eslint`: ^9 (latest)
- `eslint-config-next`: 16.0.3 (matches Next.js)

## Upgrading to React 19 (Future)

When React Three Fiber v9 is released with React 19 support:

1. Update package.json:
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "@react-three/fiber": "^9.0.0",
  "@react-three/drei": "^10.0.0",
  "@types/react": "^19",
  "@types/react-dom": "^19"
}
```

2. Run:
```bash
npm install
```

3. Test thoroughly - React 19 has breaking changes!

## Known Issues

### Dependency Warnings

- `npm warn deprecated three-mesh-bvh@0.7.8` - This is a transitive dependency from `@react-three/drei`. It's deprecated but doesn't affect functionality. Will be fixed when drei updates.

### Peer Dependency Notes

All packages use proper semantic versioning with caret (`^`) ranges to allow patch and minor updates automatically.

## Updating Packages

To check for updates:

```bash
npx npm-check-updates
```

To update all to latest compatible:

```bash
npx npm-check-updates -u
npm install
```

To update specific package:

```bash
npm update @react-three/fiber
```

## Security

Run security audits regularly:

```bash
npm audit
npm audit fix
```

Currently: **0 vulnerabilities** ✅

## Bundle Size

Approximate sizes after build:
- React Three Fiber: ~150KB
- Three.js: ~600KB
- Vercel AI SDK: ~50KB
- Radix UI: ~100KB
- Total JS: ~1.2MB (uncompressed)

After gzip compression: ~350KB

## Performance Tips

1. **Tree-shaking**: All packages support tree-shaking
2. **Dynamic imports**: Scene.tsx is dynamically imported
3. **Code splitting**: Next.js automatic code splitting
4. **CDN caching**: Deploy on Vercel for optimal edge caching

## License Compliance

All dependencies use permissive licenses:
- MIT License: Most packages
- Apache-2.0: Some Google packages
- ISC: Some utilities

No GPL or restrictive licenses! ✅

---

Last updated: November 22, 2025

