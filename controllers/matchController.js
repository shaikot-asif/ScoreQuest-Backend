const mongoose = require("mongoose");
const Match = require("../models/match.js");
const User = require("../models/User.js");
const Squad = require("../models/squad.js");
const Player = require("../models/Player.js");
const client = require("../utils/redisClient.js");

const checkForExistingMatches = async (requestedTeam, date) => {
  const dateToDateString = new Date(date).toDateString();

  const matches = await Match.find({
    // status: { $in: ["pending", "accepted"] },
    $or: [
      { "teams.requestingTeam.userId": requestedTeam },
      { "teams.requestedTeam.userId": requestedTeam },
    ],
  });

  const hasMatchValue = matches.map((item, index) => {
    let date = new Date(item.date.toDateString());

    return date.toDateString() === dateToDateString ? true : false;
  });

  return hasMatchValue.includes(true);
};

const addANewMatch = async (req, res, next) => {
  try {
    const matchValues = req.body;

    const requestingTeam = matchValues.teams.requestingTeam.userId;
    const requestingTeamName = matchValues.teams.requestingTeam.name;
    const requestedTeam = matchValues.teams.requestedTeam.userId;
    const requestedTeamName = matchValues.teams.requestedTeam.name;

    const date = matchValues.date;
    const requestingTeamSquad = matchValues.squads.requestingTeamSquad.squadId;
    const venue = matchValues.venue;

    const requestedTeamHasMatch = await checkForExistingMatches(
      requestedTeam,
      date
    );

    const dateToDateString = new Date(date);

    const todayDate = new Date();

    dateToDateString.setHours(0, 0, 0, 0);
    todayDate.setHours(0, 0, 0, 0);

    if (todayDate > dateToDateString) {
      const error = new Error("Invalid Date, please add a valid date");
      error.statusCode = 406;
      return next(error);
    }

    const requestingUser = await User.findById({ _id: requestingTeam });
    const requestedUser = await User.findById({ _id: requestedTeam });
    const squad = await Squad.findById({ _id: requestingTeamSquad });

    if (!requestingUser || !requestedUser) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }

    if (!squad) {
      const error = new Error("squad not found");
      error.statusCode = 404;
      return next(error);
    }

    if (requestedTeamHasMatch) {
      const error = new Error("They have a match on this day");
      error.statusCode = 400;
      return next(error);
    }

    const match = new Match({
      date,
      teams: {
        requestingTeam: { userId: requestingTeam, name: requestingTeamName },
        requestedTeam: { userId: requestedTeam, name: requestedTeamName },
      },
      squads: {
        requestingTeamSquad: { squadId: requestingTeamSquad },
      },
      score: {
        requestingTeam: { userId: requestingTeam },
        requestedTeam: { userId: requestedTeam },
      },
      venue,
    });

    await match.save();

    res.status(201).json(match);
  } catch (e) {
    next(e);
  }
};

const getMatchByRequestingTeamId = async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      let error = new Error("User ID is required");
      error.statusCode = 400;
      return next(error);
    }

    const requestingTeamMatches = await Match.find({
      "teams.requestingTeam.userId": userId,
    });

    // if (!requestingTeamMatches.length) {
    //   let error = new Error("There are no matches");
    //   error.statusCode = 404;
    //   next(error);
    // } else

    res.status(200).json(requestingTeamMatches);
  } catch (e) {
    console.error(e);
    return next(e);
  }
};

const getMatchByRequestedTeamId = async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      let error = new Error("User ID is required");
      error.statusCode = 400;
      return next(error);
    }

    const requestedTeam = await Match.find({
      "teams.requestedTeam.userId": userId,
    });

    // if (!requestedTeam.length) {
    //   let error = new Error("There are no match");
    //   error.statusCode = 404;
    //   return next(error);
    // }

    res.status(200).json(requestedTeam);
  } catch (e) {
    next(e);
  }
};

const cancelMatchByRequestingUser = async (req, res, next) => {
  try {
    const { matchId } = req.query;
    const match = await Match.findById(matchId);
    console.log(matchId, "matchId");
    if (!match) {
      let error = new Error("There are no match found");
      error.statusCode = 404;
      return next(error);
    }

    if (match.status === "pending" || match.status === "rejected") {
      await match.deleteOne();
      res.json({ message: "match deleted successfully" });
    } else {
      res.json({
        user: match.teams.requestedTeam.name,
        message: "Already Accepted this match",
      });
    }
  } catch (e) {
    next(e);
  }
};

const rejectMatchByRequestedUser = async (req, res, next) => {
  try {
    const { matchId, note } = req.body;

    const removeRequestedUserId = new mongoose.Types.ObjectId();

    console.log(matchId, "matchId", note);

    const match = await Match.findById(matchId);
    if (!match) {
      let error = new Error("There are no Match found");
      error.statusCode = 404;
      return next(error);
    }

    match.teams.requestedTeam.userId = removeRequestedUserId;
    match.status = "rejected";
    match.note = note || "";

    await match.save();
    res.json({ message: "Rejected Match", match });
  } catch (error) {
    return next(error);
  }
};

const acceptMatchByRequestedUser = async (req, res, next) => {
  try {
    const { matchId, squadId } = req.body;

    const match = await Match.findById(matchId);
    const squad = await Squad.findById(squadId);

    console.log("matchId", match, "squadId:", squad);

    if (!match || !squad) {
      const error = new Error("There are no match found or squadId not found");
      error.statusCode = 404;
      return next(error);
    }

    match.squads.requestedTeamSquad.squadId = squadId;
    match.status = "accepted";

    await match.save();

    res.json({ message: "Match Accepted Successfully", match });
  } catch (error) {
    return next(error);
  }
};

const updateOverAndTosWinner = async (req, res, next) => {
  try {
    const { matchId, tossWinnerId, tossLooserId, inningsType, overs } =
      req.body;

    const match = await Match.findById(matchId);
    if (!match) {
      const error = new Error("There are no match found");
      error.statusCode = 404;
      return next(error);
    }

    if (overs) {
      match.totalOvers = overs;
    }

    if (tossWinnerId) {
      match.toss.tossWinner = tossWinnerId;
      match.tossLoserInfo.tossLoser = tossLooserId;
    }

    if (inningsType) {
      match.toss.inningsType = inningsType;

      if (inningsType === "Bowl") {
        match.tossLoserInfo.inningsType = "Bat";
        match.battingUser.userId = tossLooserId;
        match.bowlingUser.userId = tossWinnerId;
      } else if (inningsType === "Bat") {
        match.tossLoserInfo.inningsType = "Bowl";
        match.battingUser.userId = tossWinnerId;
        match.bowlingUser.userId = tossLooserId;
      } else {
        const error = new Error("Please add a valid innings type, bat/bowl");
        error.statsCode = 406;
        return next(error);
      }
    }

    await match.save();

    res.json({ message: "Update successfully", match });
  } catch (e) {
    return next(e);
  }
};

const updateMatch = async (req, res, next) => {
  try {
    const { matchId, selectedBatterId, selectedBowlerId, perBallOccurs } =
      req.body;

    const match = await Match.findById(matchId);
    if (!match) {
      const error = new Error("Match not found");
      error.statusCode = 406;
      return next(error);
    }

    const getBatting = match.battingUser.userId.toString();

    const battingTeam =
      match.score.requestingTeam.userId.toString() === getBatting
        ? "requestingTeam"
        : match.score.requestedTeam.userId.toString() === getBatting
        ? "requestedTeam"
        : "something is Wrong";

    const bowlingTeam =
      battingTeam === "requestingTeam" ? "requestedTeam" : "requestingTeam";

    if (match) {
      const cacheMatch = await client.get(`match:${matchId}`);
      const Match = JSON.parse(cacheMatch);
      if (match && !Match) {
        console.log("cached successfully");
        await client.set(`match:${matchId}`, JSON.stringify(match));
      }
    }

    const cacheMatch = await client.get(`match:${matchId}`);
    const cacheDataParse = JSON.parse(cacheMatch);

    const batting = cacheDataParse.score[battingTeam];
    const bowling = cacheDataParse.score[bowlingTeam];

    // Function for batting player check

    function foundBattingPlayerStats(playerId) {
      const hasPlayerStats = batting.playerStats.map((item, index) => {
        return item.playerId === playerId ? true : false;
      });

      return hasPlayerStats.includes(true);
    }
    // Function for bowling player check
    function foundBowlingPlayerStats(playerId) {
      const hasPlayerStats = bowling.playerStats.map((item, index) => {
        return item.playerId === playerId ? true : false;
      });

      return hasPlayerStats.includes(true);
    }

    //function for all player stats (return object)

    function playerObj({
      playerId,
      runs,
      playBalls,
      wicketTaken,
      throwBall,
      givenRun,
      givenWide,
      givenNo,
      catchKeeperId,
      runOutThrowerId,
      wicketKeeperId,
      BowlerId,
      outType,
      out,
    }) {
      const playerObj = {
        playerId: playerId,
        runs: runs || 0,
        playBalls: playBalls || 0,
        wicketTaken: {
          totalWickets: wicketTaken || 0,
        },
        overs: {
          ball: throwBall || 0,
          givenRun: givenRun || 0,
          extra: {
            wideBall: givenWide || 0,
            noBall: givenNo || 0,
          },
        },
        out: {
          catchKeeper: catchKeeperId || null,
          runOut: runOutThrowerId || null,
          stumpPingOut: wicketKeeperId || null,
          outTaken: BowlerId || null,
          outType: outType || "",
          out: out || false,
        },
      };

      return playerObj;
    }

    //Dot One To Six

    async function DotOneToSix({ run }) {
      batting.totalOvers += 1;
      batting.totalRuns += run;
      if (foundBattingPlayerStats(selectedBatterId)) {
        batting.playerStats.map((item) => {
          if (item.playerId === selectedBatterId) {
            item.playBalls += 1;
            item.runs += run;
          }
        });
      } else {
        const playerInit = playerObj({
          playerId: selectedBatterId,
          playBalls: 1,
          runs: run,
        });
        batting.playerStats.push(playerInit);
      }

      if (foundBowlingPlayerStats(selectedBowlerId)) {
        bowling.playerStats.map((item) => {
          if (item.playerId === selectedBowlerId) {
            item.overs.ball += 1;
            item.overs.givenRun += run;
          }
        });
      } else {
        const playerInit = playerObj({
          playerId: selectedBowlerId,
          throwBall: 1,
          givenRun: run,
        });
        bowling.playerStats.push(playerInit);
      }
      await client.set(`match:${matchId}`, JSON.stringify(cacheDataParse));
    }

    //bye leg bye

    async function byeLegBye() {
      batting.totalRuns += perBallOccurs.byeRun || 0;
      batting.extraRun[perBallOccurs.ballOccurs] += perBallOccurs.byeRun || 0;
      batting.totalOvers += 1;

      if (foundBattingPlayerStats(selectedBatterId)) {
        batting.playerStats.map((item) => {
          if (item.playerId === selectedBatterId) {
            item.playBalls += 1;
          }
        });
      } else {
        const playerInit = playerObj({
          playerId: selectedBatterId,
          playBalls: 1,
        });
        batting.playerStats.push(playerInit);
      }

      if (foundBowlingPlayerStats(selectedBowlerId)) {
        bowling.playerStats.map((item) => {
          if (item.playerId === selectedBowlerId) {
            item.overs.ball += 1;
          }
        });
      } else {
        const playerInit = playerObj({
          playerId: selectedBowlerId,
          throwBall: 1,
        });
        bowling.playerStats.push(playerInit);
      }
      await client.set(`match:${matchId}`, JSON.stringify(cacheDataParse));
    }

    async function out({ caught = false, runOut = false, stumped = false }) {
      batting.totalWickets += 1;
      batting.totalOvers += 1;

      if (foundBattingPlayerStats(selectedBatterId)) {
        batting.playerStats.map((item) => {
          if (item.playerId === selectedBatterId) {
            item.out.out = true;
            item.out.outType = perBallOccurs.ballOccurs;
            item.out.outTaken = selectedBowlerId;
            item.overs.ball += 1;

            if (caught) {
              item.out.catchKeeper = perBallOccurs.catchKeeperId;
            } else if (runOut) {
              item.out.runOut = perBallOccurs.runOutThrowerId;
            } else if (stumped) {
              item.out.stumpPingOut = perBallOccurs.wicketKeeperId;
            }
          }
        });
      } else {
        const playerInit = playerObj({
          playerId: selectedBatterId,
          out: true,
          outType: perBallOccurs.ballOccurs,
          playBalls: 1,
          BowlerId: selectedBowlerId,
          catchKeeperId: perBallOccurs.catchKeeperId || null,
          runOutThrowerId: perBallOccurs.runOutThrowerId || null,
          wicketKeeperId: perBallOccurs.wicketKeeperId || null,
        });
        batting.playerStats.push(playerInit);
      }

      if (foundBowlingPlayerStats(selectedBowlerId)) {
        bowling.playerStats.map((item) => {
          if (item.playerId === selectedBowlerId) {
            if (!runOut) {
              item.wicketTaken.totalWickets += 1;
            }
            item.overs.ball += 1;
          }
        });
      } else {
        const wt = runOut ? 0 : 1;
        const playerInit = playerObj({
          playerId: selectedBowlerId,
          wicketTaken: wt,
          throwBall: 1,
        });
        bowling.playerStats.push(playerInit);
      }

      await client.set(`match:${matchId}`, JSON.stringify(cacheDataParse));
    }

    switch (perBallOccurs.ballOccurs) {
      case "Dot":
        DotOneToSix({ run: 0 });
        break;
      case "1":
        DotOneToSix({ run: 1 });
        break;
      case "2":
        DotOneToSix({ run: 2 });
        break;
      case "3":
        DotOneToSix({ run: 3 });
        break;
      case "4":
        DotOneToSix({ run: 4 });
        break;
      case "6":
        DotOneToSix({ run: 6 });
        break;
      case "wide":
        let runs = 1 + (perBallOccurs.wideBye || 0);
        batting.totalRuns += runs;
        batting.extraRun.bye += perBallOccurs.wideBye || 0;

        if (foundBowlingPlayerStats(selectedBowlerId)) {
          bowling.playerStats.map((item) => {
            if (item.playerId === selectedBowlerId) {
              item.overs.givenRun += 1;
              item.overs.extra.wideBall += 1;
            }
          });
        } else {
          const playerInit = playerObj({
            playerId: selectedBowlerId,
            givenRun: 1,
            givenWide: 1,
          });
          bowling.playerStats.push(playerInit);
        }
        await client.set(`match:${matchId}`, JSON.stringify(cacheDataParse));
        break;

      case "noBall":
        let noBallRuns =
          1 + (perBallOccurs.batterScore || 0) + (perBallOccurs.byeScore || 0);
        batting.totalRuns += noBallRuns;
        batting.extraRun.noBall += 1;
        batting.extraRun.bye += perBallOccurs.byeScore || 0;

        if (foundBattingPlayerStats(selectedBatterId)) {
          batting.playerStats.map((item) => {
            if (item.playerId === selectedBatterId) {
              item.playBalls += 1;
              item.runs += perBallOccurs.batterScore || 0;
            }
          });
        } else {
          const playerInit = playerObj({
            playerId: selectedBatterId,
            playBalls: 1,
            runs: perBallOccurs.batterScore || 0,
          });
          batting.playerStats.push(playerInit);
        }

        if (foundBowlingPlayerStats(selectedBowlerId)) {
          bowling.playerStats.map((item) => {
            if (item.playerId === selectedBowlerId) {
              const batterScore = (perBallOccurs.batterScore || 0) + 1;
              console.log(batterScore, "batterScore + 1", perBallOccurs);
              item.overs.givenRun += batterScore;
              item.overs.extra.noBall += 1;
            }
          });
        } else {
          const playerInit = playerObj({
            playerId: selectedBowlerId,
            givenRun: (perBallOccurs.batterScore || 0) + 1,
            givenNo: 1,
          });
          bowling.playerStats.push(playerInit);
        }
        await client.set(`match:${matchId}`, JSON.stringify(cacheDataParse));
        break;

      case "bye":
        byeLegBye();
        break;

      case "legBye":
        byeLegBye();
        break;

      case "bowled":
        out({ caught: false });
        break;

      case "caught":
        out({ caught: true });
        break;
      case "lbw":
        out({ caught: false });
        break;
      case "runOut":
        out({ runOut: true });
        break;
      case "stumped":
        out({ stumped: true });
        break;

      default:
        const error = new Error("Please give a valid ball");
        error.statusCode = 406;
        return next(error);
    }

    if (perBallOccurs.over === 6) {
      match.score = cacheDataParse.score;
      await match.save();
    }

    if (
      (batting.totalOvers / 6 === cacheDataParse.totalOvers ||
        batting.totalWickets === 10) &&
      cacheDataParse.inningsCount === 1
    ) {
      cacheDataParse.inningsCount += 1;
      match.inningsCount = cacheDataParse.inningsCount;
      const getBowling = match.bowlingUser.userId.toString();

      cacheDataParse.battingUser = getBowling;
      cacheDataParse.bowlingUser = getBatting;
      match.battingUser = cacheDataParse.battingUser;
      match.bowlingUser = cacheDataParse.bowlingUser;
      await match.save();
      await client.del(`match:${matchId}`);
    }

    res.json({ message: "match from update", cacheDataParse });
  } catch (err) {
    return next(err);
  }
};

const getMatchDetails = async (req, res, next) => {
  try {
    const { matchId } = req.query;

    console.log(matchId, "matchID");

    const redisMatch = await client.get(`match:${matchId}`);
    const parseMatch = JSON.parse(redisMatch);

    if (parseMatch) {
      res.status(200).json({ message: "successful", parseMatch });
    } else {
      const match = await Match.findById(matchId);

      if (!match) {
        const error = new Error("There are no match");
        error.statusCode = 404;
        next(error);
      }
      await client.set(`match:${matchId}`, match);

      res.status(200).send(match);
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = {
  addANewMatch,
  getMatchByRequestingTeamId,
  getMatchByRequestedTeamId,
  cancelMatchByRequestingUser,
  rejectMatchByRequestedUser,
  acceptMatchByRequestedUser,
  updateOverAndTosWinner,
  updateMatch,
  getMatchDetails,
};
