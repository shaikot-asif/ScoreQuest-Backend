const { Schema, model, Types } = require("mongoose");

const PlayerStatSchema = new Schema(
  {
    playerId: { type: Types.ObjectId, ref: "Player", default: null },
    runs: { type: Number, default: 0 },
    playBalls: { type: Number, default: 0 },
    total4s: { type: Number, default: 0 },
    total6s: { type: Number, default: 0 },
    wicketTaken: {
      totalWickets: { type: Number, default: 0 },
    },
    overs: {
      ball: { type: Number, default: 0 },
      givenRun: { type: Number, default: 0 },
      extra: {
        wideBall: { type: Number, default: 0 },
        noBall: { type: Number, default: 0 },
      },
    },
    out: {
      catchKeeper: { type: Types.ObjectId, default: null },
      runOut: { type: Types.ObjectId, default: null },
      stumpPingOut: { type: Types.ObjectId, default: null },
      outTaken: { type: Types.ObjectId, default: null },
      outType: { type: String, default: "" },
      out: { type: Boolean, default: false },
    },
  },
  { _id: false }
);

const ScoreSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    playerStats: [PlayerStatSchema],
    totalRuns: { type: Number, default: 0 },
    extraRun: {
      legBye: { type: Number, default: 0 },
      wideBall: { type: Number, default: 0 },
      noBall: { type: Number, default: 0 },
      bye: { type: Number, default: 0 },
    },
    totalWickets: { type: Number, default: 0 },
    totalOvers: { type: Number, default: 0 },
  },
  { _id: false }
);

const TeamSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    name: { type: String, default: "", required: true },
  },
  { _id: false }
);

const SquadSchema = new Schema(
  {
    squadId: { type: Types.ObjectId, ref: "Squad" },
  },
  { _id: false }
);

const MatchSchema = new Schema(
  {
    date: { type: Date, required: true },
    teams: {
      requestingTeam: { type: TeamSchema, required: true },

      requestedTeam: { type: TeamSchema, required: true },
    },
    score: {
      requestingTeam: { type: ScoreSchema, default: {} },
      requestedTeam: { type: ScoreSchema, default: {} },
    },
    squads: {
      requestingTeamSquad: { type: SquadSchema, default: {} },
      requestedTeamSquad: { type: SquadSchema, default: {} },
    },
    totalOvers: { type: Number, default: 0 },
    toss: {
      tossWinner: { type: Types.ObjectId, ref: "User", default: null },
      inningsType: { type: String, enum: ["Bat", "Bowl"] },
    },
    tossLoserInfo: {
      tossLoser: { type: Types.ObjectId, ref: "User", default: null },
      inningsType: { type: String, enum: ["Bat", "Bowl"] },
    },

    inningsCount: { type: Number, default: 1 },
    battingUser: {
      userId: { type: Types.ObjectId, ref: "User", default: null },
    },
    bowlingUser: {
      userId: { type: Types.ObjectId, ref: "User", default: null },
    },
    totalWicketsToPlay: { type: Number, default: 11 },
    permissionRequestedScoreUpdate: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancel", "completed"],
      default: "pending",
    },
    note: { type: String, default: "" },
    venue: { type: String, default: "", required: true },
  },
  { timestamps: true }
);

const Match = model("Match", MatchSchema);

module.exports = Match;
