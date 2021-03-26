const admin = require("firebase-admin");
const { program } = require("commander");
const faker = require("faker");

const auth = admin.auth();

/**
 * Returns whether or not the user is using an email in their input.
 * This method should not be used for validation, only convenience.
 *
 * Use the global options `--email` or `--phone-number` if you have any trouble.
 *
 * @param {string} input The input from the user.
 * @return {boolean} Whether the input passed the regular expression.
 */
const isEmail = (input) => {
  const expr = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

  return expr.test(input);
};

/**
 * Returns whether the user has inputted a phone number.
 * This method should not be used for validation, only convenience.
 *
 * Use the global options `--email` or `--phone-number` if you have any trouble.
 *
 * @param {string} input The input from the user.
 * @returns {boolean} Whether the input is a phone number.
 */
const isPhoneNumber = (input) => {
  const expr = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;

  return expr.test(input);
};

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
exports.presentableName = (user) => {
  return user.displayName || user.email || user.phoneNumber || user.uid;
};

/**
 * Toggles the `disabled` property on a Firebase user.
 *
 * @param {string} uid The UID of the user.
 * @param {boolean} disabled Whether to disable the user.
 * @returns {Promise<admin.auth.UserRecord>} A promise contaning the user record.
 */
exports.toggleUserAccess = (uid, disabled) => {
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
};

/**
 * Deletes the requested user.
 *
 * @param {string} uid The UID of the user to delete.
 * @returns {Promise<void>} An empty promise.
 */
exports.deleteUser = (uid) => {
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
};

/**
 * Retreives a user's UID from a phone number or email.
 *
 * @param {string} id The identifier of the user.
 * @returns {Promise<string>} A promise with the UID of the user.
 */
exports.getUidById = (id) => {
  const opts = program.opts();

  return new Promise((resolve, reject) => {
    if (isEmail(id) || opts.email) {
      auth
        .getUserByEmail(id)
        .then((user) => {
          resolve(user.uid);
        })
        .catch((reason) => {
          reject(reason);
        });
    } else if (isPhoneNumber(id) || opts.phoneNumber) {
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
};

/**
 * Retreives a user record from a phone number or email.
 *
 * @param {string} id The identifier of the user.
 * @returns {Promise<admin.auth.UserRecord>} A promise with the user record.
 */
exports.getUserById = (id) => {
  const opts = program.opts();

  return new Promise((resolve, reject) => {
    if (isEmail(id) || opts.email) {
      auth
        .getUserByEmail(id)
        .then((user) => {
          resolve(user);
        })
        .catch((reason) => {
          reject(reason);
        });
    } else if (isPhoneNumber(id) || opts.phoneNumber) {
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
};

/**
 * Updates a user with new properites.
 *
 * @param {string} uid The UID of the user to update.
 * @param {object} newUser An object consisting of properties for the new user.
 * @returns {Promise<admin.auth.UserRecord>} A promise containing the updated user record.
 */
exports.updateUser = (uid, newUser) => {
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
};

/**
 * Creates a new user with the specified information.
 *
 * @param {object} newUser The new user to create.
 * @returns {Promise<admin.auth.UserRecord>} A promise containing the created user.
 */
exports.createUser = (newUser) => {
  return new Promise((resolve, reject) => {
    const uid = newUser.uid || undefined;
    const email = newUser.email || undefined;
    const emailVerified = newUser.emailVerified || undefined;
    const displayName = newUser.displayName || undefined;
    const phoneNumber = newUser.phoneNumber || undefined;
    const photoURL = newUser.photoURL || undefined;
    const disabled = newUser.disabled || undefined;

    auth
      .createUser({
        uid,
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
};

/**
 * Creates a new Firebase user using fake data from Faker.
 *
 * @returns {Promise<admin.auth.UserRecord>} A promise containing the fake users data record.
 */
exports.createFakeUser = () => {
  return new Promise((resolve, reject) => {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const email = faker.internet.email(firstName, lastName);
    const password = faker.internet.password();
    const displayName = faker.internet.userName(firstName, lastName);
    const photoUrl = faker.image.avatar();

    const newUser = {
      email: email,
      emailVerified: false,
      password: password,
      displayName: displayName,
      photoURL: photoUrl,
      disabled: false,
    };

    auth
      .createUser(newUser)
      .then((user) => {
        resolve(user);
      })
      .catch((reason) => {
        reject(reason);
      });
  });
};

/**
 * Revokes the user's refresh token. They may still have access to your app for one hour
 * since the last token has already been minted.
 *
 * @param {string} uid The UID of the user to revoke the refresh tokens from.
 * @returns {Promise<void>} A void promise.
 */
exports.revokeUser = (uid) => {
  return new Promise((resolve, reject) => {
    admin
      .auth()
      .revokeRefreshTokens(uid)
      .then(() => {
        resolve();
      })
      .catch((reason) => {
        reject(reason);
      });
  });
};
