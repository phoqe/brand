const admin = require("firebase-admin");
const { program } = require("commander");
const { I18n } = require("i18n");
const path = require("path");
const package = require("./package.json");

require("dotenv").config();

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const auth = admin.auth();

new I18n({
  locales: ["en", "sv"],
  directory: path.join(__dirname, "locales"),
  defaultLocale: process.env.DEFAULT_LOCALE,
  register: global,
});

program.name(package.name);
program.version(package.version);
program.description(package.description);

/**
 * Returns whether or not the user is using an email in their input.
 * This method should not be used for validation, only convenience.
 *
 * @param {string} input The input from the user.
 * @return {boolean} Whether the input passed the regular expression.
 */
function isEmail(input) {
  const expr = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

  return expr.test(input);
}

/**
 * Returns whether the user has inputted a phone number.
 * This method should not be used for validation, only convenience.
 *
 * @param {string} input The input from the user.
 * @returns {boolean} Whether the input is a phone number.
 */
function isPhoneNumber(input) {
  const expr = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;

  return expr.test(input);
}

/**
 * Shorthand function for exiting the program with an error.
 *
 * @param {object} reason The reason object provided from a Firebase operation.
 */
function error(reason) {
  console.log(reason.message);
  process.exit(1);
}

/**
 * Shorthand function for exiting the program successfully.
 *
 * @param {string} message The message to display to the user upon exit.
 */
function success(message) {
  console.log(message);
  process.exit(0);
}

/**
 * Convenience helper for retrieving a presentable name of a given user.
 *
 * The name is chosen based on availability in the following order:
 *
 * 1. `displayName`
 * 2. `email`
 * 3. `uid`
 *
 * @param {object} user The user record from which to determine the presentable name.
 * @returns {String} The presentable name.
 */
function presentableName(user) {
  return user.displayName || user.email || user.uid;
}

/**
 * Toggles the `disabled` property on a Firebase user.
 *
 * @param {string} uid The UID of the user.
 * @param {boolean} disabled Whether to disable the user.
 * @returns {Promise<admin.auth.UserRecord>} A promise contaning the user record.
 */
function toggleUserAccess(uid, disabled) {
  return new Promise((resolve, reject) => {
    auth
      .updateUser(uid, { disabled })
      .then((user) => {
        resolve(user);
      })
      .catch((reason) => {
        reject(reason);
      });
  });
}

/**
 * Deletes the requested user.
 *
 * @param {string} uid The UID of the user to delete.
 * @returns {Promise<void>} An empty promise.
 */
function deleteUser(uid) {
  return new Promise((resolve, reject) => {
    auth
      .deleteUser(uid)
      .then(() => {
        resolve();
      })
      .catch((reason) => {
        reject(reason);
      });
  });
}

/**
 * Retreives a user's UID from a phone number or email.
 *
 * @param {string} id The identifier of the user.
 * @returns {Promise<string>} A promise with the UID of the user.
 */
function getUidById(id) {
  return new Promise((resolve, reject) => {
    if (isEmail(id)) {
      auth
        .getUserByEmail(id)
        .then((user) => {
          resolve(user.uid);
        })
        .catch((reason) => {
          reject(reason);
        });
    } else if (isPhoneNumber(id)) {
      auth
        .getUserByPhoneNumber(id)
        .then((user) => {
          resolve(user.uid);
        })
        .catch((reason) => {
          reject(reason);
        });
    } else {
      resolve(id);
    }
  });
}

program
  .command("disable <id>")
  .aliases(["ban", "suspend"])
  .description("prevents the user from signing in", {
    id: "email, phone number, and uid",
  })
  .action((id) => {
    getUidById(id)
      .then((uid) => {
        toggleUserAccess(uid, true)
          .then((user) => {
            success(__("Disabled user %s.", presentableName(user)));
          })
          .catch((reason) => {
            error(reason);
          });
      })
      .catch((reason) => {
        error(reason);
      });
  });

program
  .command("enable <id>")
  .aliases(["unban"])
  .description("allows the user to sign in", {
    id: "email, phone number, or uid",
  })
  .action((id) => {
    getUidById(id)
      .then((uid) => {
        toggleUserAccess(uid, false)
          .then((user) => {
            success(__("Enabled user %s.", presentableName(user)));
          })
          .catch((reason) => {
            error(reason);
          });
      })
      .catch((reason) => {
        error(reason);
      });
  });

program
  .command("delete <id>")
  .aliases(["remove"])
  .description("deletes a user permanently from the app", {
    id: "email, phone number, or uid",
  })
  .action((id) => {
    getUidById(id)
      .then((uid) => {
        deleteUser(uid)
          .then(() => {
            success(__("Deleted user %s.", uid));
          })
          .catch((reason) => {
            error(reason);
          });
      })
      .catch((reason) => {
        error(reason);
      });
  });

program.parse(process.argv);
