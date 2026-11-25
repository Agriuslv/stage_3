// Tests for js/match.js – run: node tools/test_match.js
const M = require("../js/match.js");
let fail = 0;
function t(expected, spoken, want, note) {
  const r = M.check([].concat(expected), [].concat(spoken));
  const ok = r.ok === want;
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${want ? "accept" : "reject"}  score=${r.score.toFixed(2)}  "${spoken}"  ${note || ""}`);
}
// contractions and punctuation
t("No, I don’t think you can push the wall.", "no I do not think you can push the wall", true, "don't = do not");
t("Yes, I’m a healthy person.", "yes I am a healthy person", true);
t("You’re pushing your table.", "you are pushing your table", true);
t("No, I can’t build a house.", "No I cannot build a house", true, "can't = cannot");
t("No, I won’t be free on Sunday.", "no I will not be free on sunday", true);
t("Yes, it’s true.", "yes it is true", true);
// numbers
t("She gets up at 6 a.m.", "she gets up at six am", true, "six = 6");
t("An OK price for a new car is 20 000 Euros.", "an okay price for a new car is 20,000 euros", true);
// wildcards for own answers
t("I suggest you study...", "I suggest you study medicine", true, "... = own words");
t("The best bank in Latvia is...", "the best bank in Latvia is Swedbank", true);
t("I work at... at the moment.", "I work at a school at the moment", true);
// small recognition error tolerated
t("Yes, I can draw a picture of a cat.", "yes I can draw a picture of the cat", true, "1 small slip");
// meaning changes rejected
t("Yes, I can build a house.", "no I can build a house", false, "yes/no flipped");
t("No, I don’t work at a hospital.", "no I work at a hospital", false, "missing not");
t("Yes, I need to learn English.", "yes I need", false, "too short");
t("Yes, please.", "no thanks", false);
// grammar form wrong
t("Yes, I push the door to come into this room.", "yes I am pushing the door to come into this room", false, "wrong tense (2 words)");
// alternatives
t(["Yes, I have my own car.", "No, I don’t have my own car."], "no I don't have my own car", true, "second alternative");
console.log(fail ? `${fail} failed` : "all passed");
process.exit(fail ? 1 : 0);
