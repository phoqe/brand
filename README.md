# brand

The missing CLI for Firebase apps.

## Installation

### Service Account

Set `GOOGLE_APPLICATION_CREDENTIAL` to the path of your Service Account key.

### Locale

You can set the locale of Brand with the `DEFAULT_LOCALE` environment variable. The locale will only affect the output of the commands, not your Firebase app.

Supported locales:

- `en` (default)
- `sv`

### Usage

```sh
brand --help
```

## Roadmap

- Analytics
  - PDF
  - Charts
- Dashboard
  - Firebase-like
- Database Structure Support
  - Automatic Exploration
- Advanced Email Sending

## License

MIT
