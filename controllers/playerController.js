const Player = require("../models/Player.js");
const Squad = require("../models/squad.js");
const { fileRemover } = require("../utils/fileRemover.js");
const mergeSort = require("../utils/mergeSort.js");

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
    next(error);
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
    next(error);
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

const rankedPlayer = async (req, res, next) => {
  try {
    const player = await Player.find({ "statistics.playBalls": { $gte: 6 } });
    const bowlingPlayer = await Player.find({
      "statistics.totalBowlsThrough": { $gte: 6 },
    });

    function batterStatisticsCalculate(stats) {
      let battingAverage = stats.totalRun / stats.totalMatchPlay;

      let strikeRate = (stats.totalRun / stats.playBalls) * 100;

      const batterRank =
        battingAverage + strikeRate * 0.2 + stats.totalMatchPlay * 0.5;

      console.log(parseFloat(batterRank.toFixed(2)));
      return parseFloat(batterRank.toFixed(2)) || 0;
    }

    function bowlerStatisticsCalculate(stats) {
      let bowlingAverage = stats?.totalWicket
        ? parseFloat(
            parseInt(stats?.totalGivenRun) / parseInt(stats?.totalWicket)
          ).toFixed(2)
        : 0;

      let economyRate = stats?.totalBowlsThrough
        ? parseFloat(
            parseInt(stats?.totalGivenRun) /
              parseFloat(stats?.totalBowlsThrough / 6)
          ).toFixed(2)
        : 0;

      let bowlingRank =
        stats?.totalWicket * 10 +
        stats?.totalMatchPlay * 0.5 -
        economyRate * 2 -
        bowlingAverage * 0.5;

      return parseFloat(bowlingRank.toFixed(2)) || 0;
    }

    const sortedPlayerBatting = mergeSort(player, batterStatisticsCalculate);
    const sortedPlayerBowling = mergeSort(
      bowlingPlayer,
      bowlerStatisticsCalculate,
      (chg = true)
    );

    res.json({
      batterRank: sortedPlayerBatting,
      bowlerRank: sortedPlayerBowling,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  addPlayer,
  getAllPlayersByUserId,
  updatePlayerById,
  getPlayerByPlayerId,
  deletePlayer,
  rankedPlayer,
};
