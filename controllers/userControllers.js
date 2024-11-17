const User = require("../models/User.js");
const { fileRemover } = require("../utils/fileRemover.js");

const registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    let user = await User.findOne({ $or: [{ email }, { phone }] });

    if (user) {
      //   throw new Error("User have already exist");
      return res.status(400).json({ message: "User have already exist" });
    }

    user = new User({
      name,
      email,
      phone,
      password,
    });

    await user.save();

    return res.status(201).json({
      id: user._id,
      avatar: user.avatar,
      name: user.name,
      email: user.email,
      phone: user.phone,
      admin: user.admin,
      token: await user.generateJWT(),
    });
  } catch (e) {
    console.log(e);
    return res.json(e);
  }
};

const login = async (req, res, next) => {
  try {
    const { valueType, value, password } = req.body;

    let user = await User.findOne({ [valueType]: value });
    console.log(user, "user");
    if (!user) {
      return res.status(404).json({ message: `${valueType} not found` });
    }
    if (await user.comparePassword(password)) {
      return res.status(201).json({
        id: user._id,
        avatar: user.avatar,
        name: user.name,
        email: user.email,
        phone: user.phone,
        admin: user.admin,
        token: await user.generateJWT(),
      });
    } else {
      return res.status(404).json({ message: "Invalid password" });
    }
  } catch (e) {
    console.log(e, "catch");
    next(e);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) - 1 || 0;
    const limit = parseInt(req.query.limit) || 2;
    const search = req.query.search || "";
    const { userId } = req.query;

    let filteredUser;
    if (!search) {
      filteredUser = await User.find({
        _id: { $ne: userId },
      })
        .skip(page * limit)
        .limit(limit);
    } else {
      filteredUser = await User.find({
        name: { $regex: search, $options: "i" },
        _id: { $ne: userId },
      });
    }

    let users = [];

    filteredUser.map((item) =>
      users.push({
        id: item._id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        avatar: item.avatar,
      })
    );

    console.log(users);

    res.status(200).json(users);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const { userId } = req.query;

    let user = await User.findById(userId);

    console.log(user, "userId");
    if (!user) {
      throw new Error("User not found");
    }

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { name, email, phone, currentPassword, newPassword, userId } =
      req.body;
    const avatar = req.file ? req.file.filename : "";

    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    if (avatar) {
      fileRemover(user.avatar);
    }

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.avatar = avatar || user.avatar;

    if (newPassword && currentPassword) {
      const isPasswordMatch = await user.comparePassword(currentPassword);

      if (!isPasswordMatch) {
        const error = new Error(
          "Password is not match, please enter correct password"
        );
        error.statusCode = 406;
        return next(error);
      } else user.password = newPassword;
    }

    const updateUser = await user.save();

    res.status(200).json({
      id: updateUser._id,
      name: updateUser.name,
      email: updateUser.email,
      phone: updateUser.phone,
      avatar: updateUser.avatar,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

module.exports = { registerUser, login, getAllUsers, getUser, updateUser };
