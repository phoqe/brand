const admin = require("firebase-admin");
const { program } = require("commander");
const { I18n } = require("i18n");
const path = require("path");
const inquirer = require("inquirer");

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
 * @param {admin.FirebaseError} reason The reason object provided from a Firebase operation.
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
function success(message = null) {
  if (message) {
    console.log(message);
  }

  process.exit(0);
}

/**
 * Convenience helper for retrieving a presentable name of a given user.
 *
 * The name is chosen based on availability in the following order:
 *
 * 1. `displayName`
 * 2. `email`
 * 3. `phoneNumber`
 * 4. `uid`
 *
 * @param {admin.auth.UserRecord} user The user record from which to determine the presentable name.
 * @returns {string} The presentable name.
 */
function presentableName(user) {
  return user.displayName || user.email || user.phoneNumber || user.uid;
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

/**
 * Retreives a user record from a phone number or email.
 *
 * @param {string} id The identifier of the user.
 * @returns {Promise<admin.auth.UserRecord>} A promise with the user record.
 */
function getUserById(id) {
  return new Promise((resolve, reject) => {
    if (isEmail(id)) {
      auth
        .getUserByEmail(id)
        .then((user) => {
          resolve(user);
        })
        .catch((reason) => {
          reject(reason);
        });
    } else if (isPhoneNumber(id)) {
      auth
        .getUserByPhoneNumber(id)
        .then((user) => {
          resolve(user);
        })
        .catch((reason) => {
          reject(reason);
        });
    } else {
      auth
        .getUser(id)
        .then((user) => {
          resolve(user);
        })
        .catch((reason) => {
          reject(reason);
        });
    }
  });
}

/**
 * Updates a user with new properites.
 *
 * @param {string} uid The UID of the user to update.
 * @param {object} newUser An object consisting of properties for the new user.
 * @returns {Promise<admin.auth.UserRecord>} A promise containing the updated user record.
 */
function updateUser(uid, newUser) {
  return new Promise((resolve, reject) => {
    const email = newUser.email || undefined;
    const emailVerified = newUser.emailVerified || undefined;
    const displayName = newUser.displayName || undefined;
    const phoneNumber = newUser.phoneNumber || undefined;
    const photoURL = newUser.photoURL || undefined;
    const disabled = newUser.disabled || undefined;

    auth
      .updateUser(uid, {
        email,
        emailVerified,
        displayName,
        phoneNumber,
        photoURL,
        disabled,
      })
      .then((user) => {
        resolve(user);
      })
      .catch((reason) => {
        reject(reason);
      });
  });
}

program
  .command("disable <ids>")
  .aliases(["ban", "suspend"])
  .description("prevents the users from signing in", {
    ids: "comma-separated emails, phone numbers, and uids",
  })
  .action((ids) => {
    const uidReqs = [];

    ids.split(",").forEach((id) => {
      const req = getUidById(id).catch((reason) => {
        console.log(__("Couldn't fetch UID for ID %s: %s", id, reason.message));
      });

      uidReqs.push(req);
    });

    Promise.all(uidReqs)
      .then((uids) => {
        const toggleReqs = [];

        uids.forEach((uid) => {
          if (!uid) {
            return;
          }

          const req = toggleUserAccess(uid, true)
            .then((user) => {
              console.log(__("Disabled user %s.", presentableName(user)));
            })
            .catch((reason) => {
              console.log(
                __("Couldn't disable user %s: %s", uid, reason.message)
              );
            });

          toggleReqs.push(req);
        });

        Promise.all(toggleReqs)
          .then(() => {
            success();
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
  .command("enable <ids>")
  .aliases(["unban"])
  .description("allows the users to sign in", {
    ids: "comma-separated emails, phone numbers, and uids",
  })
  .action((ids) => {
    const uidReqs = [];

    ids.split(",").forEach((id) => {
      const req = getUidById(id).catch((reason) => {
        console.log(__("Couldn't fetch UID for ID %s: %s", id, reason.message));
      });

      uidReqs.push(req);
    });

    Promise.all(uidReqs)
      .then((uids) => {
        const toggleReqs = [];

        uids.forEach((uid) => {
          if (!uid) {
            return;
          }

          const req = toggleUserAccess(uid, false)
            .then((user) => {
              console.log(__("Enabled user %s.", presentableName(user)));
            })
            .catch((reason) => {
              console.log(
                __("Couldn't enable user %s: %s", uid, reason.message)
              );
            });

          toggleReqs.push(req);
        });

        Promise.all(toggleReqs)
          .then(() => {
            success();
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
  .command("delete <ids>")
  .aliases(["remove"])
  .description("deletes users permanently from the app", {
    ids: "comma-separated emails, phone numbers, or uids",
  })
  .action((ids) => {
    const uidReqs = [];

    ids.split(",").forEach((id) => {
      const req = getUidById(id).catch((reason) => {
        console.log(__("Couldn't fetch UID for ID %s: %s", id, reason.message));
      });

      uidReqs.push(req);
    });

    Promise.all(uidReqs)
      .then((uids) => {
        const toggleReqs = [];

        uids.forEach((uid) => {
          if (!uid) {
            return;
          }

          const req = deleteUser(uid)
            .then(() => {
              console.log(__("Deleted user %s.", uid));
            })
            .catch((reason) => {
              console.log(
                __("Couldn't delete user %s: %s", uid, reason.message)
              );
            });

          toggleReqs.push(req);
        });

        Promise.all(toggleReqs)
          .then(() => {
            success();
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
  .command("get <ids>")
  .aliases(["fetch", "retrieve"])
  .description("retrieves info for each user", {
    ids: "comma-separated emails, phone numbers, or uids",
  })
  .option(
    "-d --detailed",
    "include custom claims, creation and last sign-in time"
  )
  .action((ids, options) => {
    const getReqs = [];

    ids.split(",").forEach((id) => {
      const req = getUserById(id).catch((reason) => {
        console.log(
          __("Couldn't fetch user for ID %s: %s", id, reason.message)
        );
      });

      getReqs.push(req);
    });

    Promise.all(getReqs)
      .then((users) => {
        const tableData = [];

        users.forEach((user) => {
          if (!user) {
            return;
          }

          let userData = {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            displayName: user.displayName,
            phoneNumber: user.phoneNumber,
            disabled: user.disabled,
          };

          if (options.detailed) {
            userData = {
              ...userData,
              customClaims: user.customClaims,
              creationTime: user.metadata.creationTime,
              lastSignInTime: user.metadata.lastSignInTime,
            };
          }

          tableData.push(userData);
        });

        if (tableData.length) {
          console.table(tableData);
        }

        success();
      })
      .catch((reason) => {
        error(reason);
      });
  });

program
  .command("update <id>")
  .aliases(["change"])
  .description("updates the user's data", {
    ids: "email, phone number, or uid",
  })
  .action((id) => {
    getUserById(id)
      .then((user) => {
        inquirer
          .prompt([
            {
              type: "input",
              name: "email",
              default: user.email,
            },
            {
              type: "confirm",
              name: "emailVerified",
              default: user.emailVerified,
            },
            {
              type: "input",
              name: "displayName",
              default: user.displayName,
            },
            {
              type: "input",
              name: "phoneNumber",
              default: user.phoneNumber,
            },
            {
              type: "input",
              name: "photoURL",
              default: user.photoURL,
            },
            {
              type: "confirm",
              name: "disabled",
              default: user.disabled,
            },
          ])
          .then((newUser) => {
            updateUser(user.uid, newUser)
              .then((user) => {
                success(__("Updated user %s.", presentableName(user)));
              })
              .catch((reason) => {
                error(reason);
              });
          })
          .catch((reason) => {
            console.log(
              __(
                "Couldn't update user %s: %s",
                presentableName(user),
                reason.message
              )
            );
          });
      })
      .catch((reason) => {
        error(reason);
      });
  });

program.parse(process.argv);
