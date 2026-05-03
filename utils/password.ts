import crypto from "node:crypto";

const SALT_BYTES = 16;
const KEY_LENGTH = 64;
const DIGEST = "hex";

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_BYTES).toString(DIGEST);

    crypto.scrypt(password.normalize(), salt, KEY_LENGTH, (error, hash) => {
      if (error) {
        return reject(error);
      }

      resolve(`${salt}:${hash.toString(DIGEST)}`);
    });
  });
}

export function comparePassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, originalHash] = passwordHash.split(":");
    if (!salt || !originalHash) {
      return reject(
        new Error(
          "The stored password hash is not in the expected format 'salt:hash'.",
        ),
      );
    }

    crypto.scrypt(password.normalize(), salt, KEY_LENGTH, (error, newHash) => {
      if (error) {
        return reject(error);
      }

      const originalHashBuffer = Buffer.from(originalHash, DIGEST);

      try {
        const areEqual = crypto.timingSafeEqual(newHash, originalHashBuffer);
        resolve(areEqual);
      } catch {
        resolve(false);
      }
    });
  });
}
