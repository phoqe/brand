const admin = require("firebase-admin");
const { program } = require("commander");
const { I18n } = require("i18n");
const path = require("path");
const inquirer = require("inquirer");
const faker = require("faker");
const package = require("./package.json");

require("dotenv").config();

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const auth = require("./auth");

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

/**
 * Shorthand function for exiting the program with an error.
 *
 * @param {admin.FirebaseError} reason The reason object provided from a Firebase operation.
 */
function error(message) {
  if (message) {
    console.log(message);
  }

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

program
  .command("revoke <ids...>")
  .aliases(["prevent"])
  .description("revokes refresh tokens for the user", {
    ids: "emails, phone numbers, and uids",
  })
  .action((ids) => {
    const uidReqs = [];

    ids.forEach((id) => {
      const req = auth.getUidById(id).catch((reason) => {
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

          const req = auth
            .revokeUser(uid)
            .then(() => {
              console.log(__("Revoked refresh tokens for user %s.", uid));
            })
            .catch((reason) => {
              console.log(
                __(
                  "Couldn't revoke refresh tokens for user %s: %s",
                  uid,
                  reason.message
                )
              );
            });

          toggleReqs.push(req);
        });

        Promise.all(toggleReqs)
          .then(() => {
            success();
          })
          .catch((reason) => {
            error(reason.message);
          });
      })
      .catch((reason) => {
        error(reason.message);
      });
  });

program
  .command("disable <ids...>")
  .aliases(["ban", "suspend"])
  .description("prevents the users from signing in", {
    ids: "emails, phone numbers, and uids",
  })
  .action((ids) => {
    const uidReqs = [];

    ids.forEach((id) => {
      const req = auth.getUidById(id).catch((reason) => {
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

          const req = auth
            .toggleUserAccess(uid, true)
            .then((user) => {
              console.log(__("Disabled user %s.", auth.presentableName(user)));
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
            error(reason.message);
          });
      })
      .catch((reason) => {
        error(reason.message);
      });
  });

program
  .command("enable <ids...>")
  .aliases(["unban"])
  .description("allows the users to sign in", {
    ids: "emails, phone numbers, and uids",
  })
  .action((ids) => {
    const uidReqs = [];

    ids.forEach((id) => {
      const req = auth.getUidById(id).catch((reason) => {
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

          const req = auth
            .toggleUserAccess(uid, false)
            .then((user) => {
              console.log(__("Enabled user %s.", auth.presentableName(user)));
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
            error(reason.message);
          });
      })
      .catch((reason) => {
        error(reason.message);
      });
  });

program
  .command("delete <ids...>")
  .aliases(["remove"])
  .description("deletes users permanently from the app", {
    ids: "emails, phone numbers, or uids",
  })
  .action((ids) => {
    const uidReqs = [];

    ids.forEach((id) => {
      const req = auth.getUidById(id).catch((reason) => {
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

          const req = auth
            .deleteUser(uid)
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
            error(reason.message);
          });
      })
      .catch((reason) => {
        error(reason.message);
      });
  });

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
  .action((ids, options) => {
    const getReqs = [];

    ids.forEach((id) => {
      const req = auth.getUserById(id).catch((reason) => {
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
        error(reason.message);
      });
  });

program
  .command("update <id>")
  .aliases(["change"])
  .description("updates the user's data", {
    id: "email, phone number, or uid",
  })
  .action((id) => {
    auth
      .getUserById(id)
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
            auth
              .updateUser(user.uid, newUser)
              .then((user) => {
                success(__("Updated user %s.", auth.presentableName(user)));
              })
              .catch((reason) => {
                error(reason.message);
              });
          })
          .catch((reason) => {
            console.log(
              __(
                "Couldn't update user %s: %s",
                auth.presentableName(user),
                reason.message
              )
            );
          });
      })
      .catch((reason) => {
        error(reason.message);
      });
  });

program
  .command("create")
  .aliases(["add", "new"])
  .description("creates a new user")
  .option("-f, --fake <number>", "use fake data for a number of users")
  .action((opts) => {
    if (opts.fake) {
      const createReqs = [];

      for (let index = 0; index < opts.fake; index++) {
        const req = auth
          .createFakeUser()
          .then((user) => {
            console.log(__("Created user %s.", auth.presentableName(user)));
          })
          .catch((reason) => {
            console.log(
              __(
                "Couldn't create fake user %s: %s",
                auth.presentableName(newUser),
                reason.message
              )
            );
          });

        createReqs.push(req);
      }

      Promise.all(createReqs)
        .then(() => {
          success();
        })
        .catch((reason) => {
          error(reason.message);
        });

      return;
    }

    inquirer
      .prompt([
        {
          type: "input",
          name: "uid",
        },
        {
          type: "input",
          name: "email",
        },
        {
          type: "confirm",
          name: "emailVerified",
          default: false,
        },
        {
          type: "input",
          name: "password",
        },
        {
          type: "input",
          name: "displayName",
        },
        {
          type: "input",
          name: "photoURL",
        },
        {
          type: "confirm",
          name: "disabled",
          default: false,
        },
      ])
      .then((newUser) => {
        auth
          .createUser(newUser)
          .then((user) => {
            success(__("Created user %s.", auth.presentableName(user)));
          })
          .catch((reason) => {
            error(reason.message);
          });
      })
      .catch((reason) => {
        console.log(
          __(
            "Couldn't update user %s: %s",
            auth.presentableName(user),
            reason.message
          )
        );
      });
  });

program.parse(process.argv);
