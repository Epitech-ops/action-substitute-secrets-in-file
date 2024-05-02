
const core = require('@actions/core');

const fs = require("fs");

const getFileContents = path => fs.readFileSync(path).toString();

const escape = string => string.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

function replaceStrings(content, pattern, token, values) {
  console.log('************');
  console.log("Substituting tokens matching", pattern);
  const regexPattern = new RegExp(escape(pattern).replace(token, "(.*)"), "gm");
  const matches = [...content.matchAll(regexPattern)]
    .map(m => ({
        target: m[0],
        token: m[1]
    }))
    .reduce((acc, next) =>
        acc.find(a => a.target === next.target) ? acc : [...acc, next],
        []);
  console.log("Found", matches.length, "matching patterns: ", matches.map(m => m.token).join(", "));
  const missing = matches.filter(m => values[token][m.token] === undefined).map(m => m.target);
  if (missing.length)
    console.warn("Missing", missing.length, "replacements for: ", missing.join(", "));
  const ok = matches.filter(m => values[token][m.token] !== undefined).map(m => m.target);
  console.log("Replacing", ok.length, "patterns: ", ok.join(", "));
  const result = matches
    .filter(m => values[token][m.token] !== undefined)
    .reduce((acc, next) =>
        acc.replace(new RegExp(escape(next.target), "gm"), values[token][next.token]),
        fileContents);
  return result;
}

const file = core.getInput("file", { required: true });
const output = core.getInput("output", { required: false }) || file;
const tokenPatterns = core.getInput("tokenPatterns", { required: true });
const valuesJson = core.getInput("valuesJson", { required: true });
const valuesDefault = core.getInput("valuesDefault", { required: false }) || null;

let fileContents = getFileContents(file);

const values = JSON.parse(valuesJson);

for (const [token, pattern] of Object.entries(JSON.parse(tokenPatterns))) {
  fileContents = replaceStrings(fileContents, pattern, token, values);
}

if (valuesDefault !== null) {
  const defaultValues = JSON.parse(valuesDefault);
  for (const [token, pattern] of Object.entries(JSON.parse(tokenPatterns))) {
    fileContents = replaceStrings(fileContents, pattern, token, defaultValues);
  }
}

console.log('************');
console.log("Writing content to file", output);
fs.writeFileSync(output, fileContents);

console.log('************');
console.log("Finished substituting");
