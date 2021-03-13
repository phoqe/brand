# brand

The missing CLI for Firebase apps.

## Installation

TODO

## Setup

### Service Account

Set `GOOGLE_APPLICATION_CREDENTIAL` to the path of your Service Account Key. You can generate one in Firebase Console under Project Settings. For example:

```sh
export GOOGLE_APPLICATION_CREDENTIAL=path/to/serviceAccountKey.json
```

### Locale

You can set the default locale of Brand. The locale is used in command output and fake user data, e.g., first and last name. You can set the default locale using:

```sh
export DEFAULT_LOCALE=en
```

Brand supports the following locales for command output:

- `en` (default)
- `sv`

Faker, the library for fake user data, supports these [locales](https://github.com/Marak/Faker.js#localization).

## Usage

Brand is available through `brand` in the terminal. For example:

```sh
brand --help
```

Here’s how you would disable a user with the email `lon_legros56@gmail.com`:

```sh
brand disable lon_legros56@gmail.com
```

You can supply an email, phone number, or UID for these arguments for commands using the `id` or `ids` argument. For example, when disabling multiple users:

```sh
brand disable emilia.kilback35@yahoo.com +46762332652 IfqcusddgdPlsXqwiNLq9cestmo1
```

If automatic ID resolution fails, you can use the ”forcing options“ `--email` or `--phone-number`:

```sh
brand disable --email valerie.lueilwitz@hotmail.com
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
