const Player = require("../models/Player.js");
const Squad = require("../models/squad.js");
const { fileRemover } = require("../utils/fileRemover.js");

const addPlayer = async (req, res, next) => {
  try {
    const { firstName, lastName, birthday, role, userId } = req.body;
    const avatar = req.file ? req.file.filename : "";

    let player = new Player({
      firstName,
      lastName,
      birthday,
      role,
      avatar,
      userId,
    });

    await player.save();

    return res.status(201).json({
      playerId: player._id,
      firstName: player.firstName,
      lastName: player.lastName,
      birthday: player.birthday,
      role: player.role,
      avatar: player.avatar,
      userId: player.userId,
    });
  } catch (error) {
    console.log(error);
    return res.json(error);
  }
};

const getAllPlayersByUserId = async (req, res, next) => {
  try {
    const { userId } = req.query;

    const players = await Player.find({ userId });

    if (!players) {
      return res.status(404).json({ message: "invalid user" });
    }

    res.status(200).send(players);
  } catch (error) {
    console.log(error);
  }
};

const getPlayerByPlayerId = async (req, res, next) => {
  try {
    const { playerId } = req.query;

    const player = await Player.findById(playerId);

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.send(player);
  } catch (error) {
    console.log(error);
  }
};

const updatePlayerById = async (req, res, next) => {
  try {
    const { firstName, lastName, birthday, role, playerId } = req.body;
    const avatar = req.file ? req.file.filename : "";

    let player = await Player.findById(playerId);

    if (!player) {
      throw new Error("player not found");
    }

    if (avatar) {
      fileRemover(player.avatar);
    }

    player.firstName = firstName || player.firstName;
    player.lastName = lastName || player.lastName;
    player.birthday = birthday || player.birthday;
    player.role = role || player.role;
    player.avatar = avatar || player.avatar;

    await player.save();

    console.log(firstName, lastName, birthday, role, playerId);

    return res.status(200).json({
      playerId: player._id,
      firstName: player.firstName,
      lastName: player.lastName,
      birthday: player.birthday,
      role: player.role,
      avatar: player.avatar,
      userId: player.userId,
    });
  } catch (error) {
    console.log(error);
  }
};

const deletePlayer = async (req, res, next) => {
  try {
    const { playerId, userId } = req.query;

    const player = await Player.findById({ _id: playerId });

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    const squad = await Squad.find({ userId: userId });
    if (!squad) {
      let error = new Error("squad not found");
      error.statusCode = 404;
      next(error);
    }

    console.log(squad, playerId, userId, "from remove");

    squad.map((item) => {
      const playerIdIndex = item.selectedPlayer.indexOf(playerId);

      if (playerIdIndex > -1) {
        item.selectedPlayer.splice(playerIdIndex, 1);
      }
      item.save();
    });

    await player.deleteOne();
    fileRemover(player.avatar);

    res.json({ message: "Player deleted successfully" });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  addPlayer,
  getAllPlayersByUserId,
  updatePlayerById,
  getPlayerByPlayerId,
  deletePlayer,
};
