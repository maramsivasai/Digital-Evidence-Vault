
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

// Convert a plain password into a secure hash
export const hashPassword = async (password) => {
    const hashedPassword = await bcrypt.hash(
        password,
        SALT_ROUNDS
    );

    return hashedPassword;
};

// Compare an entered password with its stored hash
export const comparePassword = async (
    enteredPassword,
    storedHash
) => {
    const isMatch = await bcrypt.compare(
        enteredPassword,
        storedHash
    );

    return isMatch;
};