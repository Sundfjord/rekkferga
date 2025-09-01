# Translation System

This directory contains translation files for the Fergo app.

## Files

- `en.json` - English translations
- `no.json` - Norwegian (Bokmål) translations
- `nn.json` - Norwegian (Nynorsk) translations

## Usage

### In Components

```typescript
import { t } from '../utils/i18n';

// Use translation keys
<Text>{t('settings')}</Text>
<Text>{t('loading')}</Text>
```

### Adding New Translations

1. **Add the key to all language files** (en.json, no.json, nn.json)
2. **Use the key in your component** with `t('keyName')`

### Example

```json
// en.json
{
  "newFeature": "New Feature"
}

// no.json
{
  "newFeature": "Ny funksjon"
}

// nn.json
{
  "newFeature": "Ny funksjon"
}
```

```typescript
// In component
<Text>{t("newFeature")}</Text>
```

## Language Switching

The app automatically saves the selected language in AsyncStorage and loads it on startup. Users can change languages through the Drawer component.

## Fallback System

The translation system includes intelligent fallbacks:

1. **Nynorsk (nn)**: Falls back to Bokmål (no), then English (en), then key name
2. **Other languages**: Fall back to English (en), then key name

This means you only need to define Nynorsk-specific translations in `nn.json`. All other strings will automatically use the Bokmål version.

### Example Fallback Chain for Nynorsk:

```
nn.json → no.json → en.json → key name
```

### Debug Fallback Behavior:

```typescript
import { debugTranslation } from "../utils/i18n";

// Check what's happening with a translation
const debug = debugTranslation("settings");
console.log(debug);
// Output: { current: undefined, fallback: "Innstillinger", final: "Innstillinger" }
```
