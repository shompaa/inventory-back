import { db } from "../../database/config.js";
import bcrypt from "bcrypt";
import createHttpError from "http-errors";

export const findUsers = async ({ limit }) => {
  try {
    const ref = db.ref("/users");
    const snapshot = await ref.orderByKey().limitToFirst(limit).once("value");
    const users = snapshot.val();

    const usersWithId = Object.entries(users).map(([id, user]) => {
      const { password, ...userWithoutPassword } = user;
      return { ...userWithoutPassword, id };
    });

    return {
      data: usersWithId,
      total: usersWithId.length,
    };
  } catch (error) {
    throw error;
  }
};

export const findUserById = async (id) => {
  try {
    const ref = db.ref(`/users/${id}`);
    const snapshot = await ref.once("value");
    const user = snapshot.val();

    if (user) {
      const { password, ...userWithoutPassword } = user;
      return { id, ...userWithoutPassword };
    } else {
      throw new createHttpError(404, "User not found");
    }
  } catch (error) {
    throw error;
  }
};

export const findUserByEmail = async (email) => {
  try {
    const ref = db.ref("/users");
    const snapshot = await ref
      .orderByChild("email")
      .equalTo(email)
      .once("value");
    const users = snapshot.val();

    if (users) {
      const userId = Object.keys(users)[0];
      return { id: userId, ...users[userId] };
    } else {
      throw new createHttpError(404, "User not found");
    }
  } catch (error) {
    throw error;
  }
};
export const createUser = async (user) => {
  try {
    const { email, password } = user;
    user.role = user.role || "SELLER";

    const usersRef = db.ref("/users");
    const snapshot = await usersRef
      .orderByChild("email")
      .equalTo(email)
      .once("value");
    const existingUser = snapshot.val();

    if (existingUser) {
      throw new createHttpError(409, `${email} already exists`);
    }

    const salt = bcrypt.genSaltSync();
    const hashedPassword = bcrypt.hashSync(password, salt);
    const newUser = { ...user, password: hashedPassword };

    const newUserRef = usersRef.push();
    await newUserRef.set(newUser);

    return { ...newUser, id: newUserRef.key };
  } catch (error) {
    throw error;
  }
};

export const editUser = async (id, user) => {
  try {
    const { password, ...params } = user;
    const userRef = db.ref("/users/" + id);
    const snapshot = await userRef.once("value");
    const existingUser = snapshot.val();

    if (!existingUser) {
      throw new Error("User not found");
    }

    if (params.email && existingUser.email !== params.email) {
      const snapshot = await db
        .ref("/users")
        .orderByChild("email")
        .equalTo(params.email)
        .once("value");
      if (snapshot.exists()) {
        throw new Error("Email already exists");
      }
    }

    if (params.rut && existingUser.rut !== params.rut) {
      const snapshot = await db
        .ref("/users")
        .orderByChild("rut")
        .equalTo(params.rut)
        .once("value");
      if (snapshot.exists()) {
        throw new Error("RUT already exists");
      }
    }

    const updates = {
      ...params,
      name: params.name || existingUser.name,
      lastName: params.lastName || existingUser.lastName,
    };

    await userRef.update(updates);

    const updatedSnapshot = await userRef.once("value");
    return { id, ...updatedSnapshot.val() };
  } catch (error) {
    throw error;
  }
};

export const removeUser = async (id) => {
  try {
    const userRef = db.ref("/users/" + id);
    const snapshot = await userRef.once("value");
    const user = snapshot.val();

    if (!user) {
      throw new Error("User not found");
    }

    await userRef.update({
      disabled: true,
      deletedAt: Date.now(),
    });

    const updatedSnapshot = await userRef.once("value");
    return { id, ...updatedSnapshot.val() };
  } catch (error) {
    throw error;
  }
};
