const Squad = require("../models/squad.js");

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

    console.log(userId, "from squad controller");

    const squad = await Squad.find({ userId });

    console.log(squad);

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

    if (!squad) {
      let error = new Error("squad not found");
      error.statusCode = 404;
      return next(error);
    }

    await squad.deleteOne();
    res.status(200).json({ message: "delete successfully" });
  } catch (e) {
    console.log(e);
  }
};

const getSquadBySquadId = async (req, res, next) => {
  try {
    const { _id } = req.query;

    const squad = await Squad.findById(_id);

    if (!squad) {
      let error = new Error("squad not found");
      error.statusCode = 404;
      next(error);
    }

    res.status(200).json(squad);
  } catch (error) {
    next(error);
  }
};

module.exports = { addSquad, getSquad, deleteSquad, getSquadBySquadId };
