const express = require("express");

const router = express.Router();
const { authGuard } = require("../middleware/authMiddleware");

const {
  addANewMatch,
  getMatchByRequestingTeamId,
  getMatchByRequestedTeamId,
  cancelMatchByRequestingUser,
  rejectMatchByRequestedUser,
  acceptMatchByRequestedUser,
  updateOverAndTosWinner,
  updateMatch,
  getMatchDetails,
  // getCachedMatch,
} = require("../controllers/matchController.js");

router.post("/addMatch", authGuard, addANewMatch);
router.get("/requestingTeam", authGuard, getMatchByRequestingTeamId);
router.get("/requestedTeam", authGuard, getMatchByRequestedTeamId);
router.get("/getMatchDetails", getMatchDetails);
// router.get("/getCachedMatch", getCachedMatch);
router.put(
  "/rejectMatchByRequestedUser",
  authGuard,
  rejectMatchByRequestedUser
);
router.put(
  "/acceptMatchByRequestedUser",
  authGuard,
  acceptMatchByRequestedUser
);
router.put("/updateOverAndTosWinner", authGuard, updateOverAndTosWinner);
router.put("/updateMatch", updateMatch);
router.delete(
  "/cancelMatchByRequestingUser",
  authGuard,
  cancelMatchByRequestingUser
);

module.exports = router;
