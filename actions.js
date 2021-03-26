const inquirer = require("inquirer");
const auth = require("./auth");

/**
 * Shorthand function for exiting the program with an error.
 *
 * @param {admin.FirebaseError} reason The reason object provided from a Firebase operation.
 */
const error = (message) => {
  if (message) {
    console.log(message);
  }

  process.exit(1);
};

/**
 * Shorthand function for exiting the program successfully.
 *
 * @param {string} message The message to display to the user upon exit.
 */
const success = (message = null) => {
  if (message) {
    console.log(message);
  }

  process.exit(0);
};

/**
 * Revokes refresh tokens for the users.
 *
 * @param {string[]} ids An array of IDs.
 */
exports.revoke = (ids) => {
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
};

/**
 * Prevents the users from signing in.
 *
 * @param {string} ids An array of IDs.
 */
exports.disable = (ids) => {
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
};

/**
 * Allows the user to sign in.
 *
 * @param {string} ids An array of IDs.
 */
exports.enable = (ids) => {
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
            console.log(__("Couldn't enable user %s: %s", uid, reason.message));
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
};

/**
 * Deletes users permanently from the app.
 *
 * @param {string} ids An array of IDs.
 */
exports.delete = (ids) => {
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
            console.log(__("Couldn't delete user %s: %s", uid, reason.message));
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
};

/**
 * Retrieves info for each user.
 *
 * @param {string} ids An array of IDs.
 * @param {object} opts An object of program options.
 */
exports.get = (ids, opts) => {
  const getReqs = [];

  ids.forEach((id) => {
    const req = auth.getUserById(id).catch((reason) => {
      console.log(__("Couldn't fetch user for ID %s: %s", id, reason.message));
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

        if (opts.detailed) {
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
};

/**
 * Updates the user's data.
 *
 * @param {string} id The ID of the user.
 */
exports.update = (id) => {
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
};

/**
 * Creates a new user.
 *
 * @param {object} opts An object of program options.
 */
exports.create = (opts) => {
  if (opts.fake) {
    const createReqs = [];

    for (let index = 0; index < opts.fake; index++) {
      const req = auth
        .createFakeUser()
        .then((user) => {
          console.log(__("Created user %s.", auth.presentableName(user)));
        })
        .catch((reason) => {
          console.log(__("Couldn't create fake user: %s", reason.message));
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
};
