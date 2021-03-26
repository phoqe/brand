const admin = require("firebase-admin");
const { program } = require("commander");
const { I18n } = require("i18n");
const faker = require("faker");
const package = require("./package.json");

require("dotenv").config();

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const actions = require("./actions");

const i18n = new I18n({
  staticCatalog: {
    sv: require("./locales/sv.json"),
    en: require("./locales/en.json"),
  },
  defaultLocale: process.env.DEFAULT_LOCALE,
  register: global,
});

faker.locale = i18n.getLocale();

program.name(package.name);
program.version(package.version);
program.description(package.description);

program.option("-e, --email", "only use email as id");
program.option("-p, --phone-number", "only use phone number as id");

program
  .command("revoke <ids...>")
  .aliases(["prevent"])
  .description("revokes refresh tokens for the users", {
    ids: "emails, phone numbers, and uids",
  })
  .action((ids) => actions.revoke(ids));

program
  .command("disable <ids...>")
  .aliases(["ban", "suspend"])
  .description("prevents the users from signing in", {
    ids: "emails, phone numbers, and uids",
  })
  .action((ids) => actions.disable(ids));

program
  .command("enable <ids...>")
  .aliases(["unban"])
  .description("allows the users to sign in", {
    ids: "emails, phone numbers, and uids",
  })
  .action((ids) => actions.enable(ids));

program
  .command("delete <ids...>")
  .aliases(["remove"])
  .description("deletes users permanently from the app", {
    ids: "emails, phone numbers, or uids",
  })
  .action((ids) => actions.delete(ids));

program
  .command("get <ids...>")
  .aliases(["fetch", "retrieve"])
  .description("retrieves info for each user", {
    ids: "emails, phone numbers, or uids",
  })
  .option(
    "-d --detailed",
    "include custom claims, creation and last sign-in time"
  )
  .action((ids, opts) => actions.get(ids, opts));

program
  .command("update <id>")
  .aliases(["change"])
  .description("updates the user's data", {
    id: "email, phone number, or uid",
  })
  .action((id) => actions.update(id));

program
  .command("create")
  .aliases(["add", "new"])
  .description("creates a new user")
  .option("-f, --fake <number>", "use fake data for a number of users")
  .action((opts) => actions.create(opts));

program.parse(process.argv);
