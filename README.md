# brand

Brand is the missing CLI for apps using Firebase as its backend. I’ve used it for personal projects and decided to make it open-source. One useful feature is to create multiple fake accounts quickly and editing users with barely any setup.

## Installation

### Clone and develop

You can clone Brand and use it from its directory if you want to add more features specific to your needs. Simply use:

```sh
git clone https://github.com/phoqe/brand.git
```

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

The locales in use by Faker, the fake user data library, can be found [here](https://github.com/Marak/Faker.js#localization).

Brand supports the following locales for command output:

- `en` (default)
- `sv`

If Brand doesn’t support the locale, it will default to `en`.

## Usage

Brand is available through `brand` in the terminal. For example:

```sh
brand --help
```

Here’s how you would disable a user with the email `lon_legros56@gmail.com`:

```sh
brand disable lon_legros56@gmail.com
```

You can supply an email, phone number, or UID for commands using the `id` or `ids` argument. For example, when disabling multiple users:

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
- Custom Claims

## License

MIT
