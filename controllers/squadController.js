const Squad = require("../models/squad.js");
const Match = require("../models/match.js");

const addSquad = async (req, res, next) => {
  try {
    const { userId, selectedPlayer } = req.body;

    if (!userId || !selectedPlayer) {
      res.status(400).json({ message: "Invalid input" });
    }

    const squadLength = await Squad.find({ userId });

    if (squadLength.length >= 3) {
      let error = new Error("only 3 squad you can add");

      error.statusCode = 405;
      next(error);
    } else {
      const squad = new Squad({
        userId,
        selectedPlayer,
      });

      await squad.save();

      res.status(201).send(squad);
    }
  } catch (e) {
    next(e);
  }
};

const getSquad = async (req, res, next) => {
  try {
    const { userId } = req.query;

    const squad = await Squad.find({ userId });

    if (!squad) {
      res.status(404).json({ message: "squad not found" });
    }

    res.status(200).json(squad);
  } catch (e) {
    console.log(e);
  }
};

const deleteSquad = async (req, res, next) => {
  try {
    const { squadId } = req.query;
    const squad = await Squad.findById({ _id: squadId });

    const matches = await Match.find({
      status: { $in: ["pending", "accepted"] },
      $or: [
        { "squads.requestingTeamSquad.squadId": squadId },
        { "squads.requestedTeamSquad.squadId": squadId },
      ],
    });

    if (!squad) {
      let error = new Error("squad not found");
      error.statusCode = 404;
      return next(error);
    }

    if (matches.length > 0) {
      const error = new Error(
        "have a match to this squad, after complete the match you can delete this"
      );
      error.statusCode = 0;
      return next(error);
    } else {
      console.log("nothing ");
      await squad.deleteOne();
      res.status(200).json({ message: "delete successfully" });
    }
  } catch (e) {
    console.log(e);
  }
};

const getSquadBySquadId = async (req, res, next) => {
  try {
    const { squadId } = req.query;

    const squad = await Squad.findById(squadId);
    if (!squad) {
      let error = new Error("squad not found");
      error.statusCode = 404;
      next(error);
    }

    if (Array.isArray(squad)) {
      res.status(200).json(squad);
    } else if (squad !== null || squad !== undefined) {
      res.status(200).json([squad]);
    } else res.json({ message: "something went wrong" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addSquad,
  getSquad,
  deleteSquad,
  getSquadBySquadId,
};
