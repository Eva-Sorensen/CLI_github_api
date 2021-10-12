"use strict";
const { Octokit } = require("@octokit/core");
const {
  paginateRest,
  composePaginateRest,
} = require("@octokit/plugin-paginate-rest");
const readline = require("readline");

const MyOctokit = Octokit.plugin(paginateRest);
const octokit = new MyOctokit();

const readLineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const USERNAME_REGEX_CONSTRAINTS = new RegExp(
  /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i,
  "gi"
);

const REPO_NAME_REGEX_CONSTRAINTS = new RegExp(/^[a-zA-Z0-9._-]+$/, "gi");

let selectedRepo = {
  owner: "",
  repo: "",
  per_page: 100,
};

function getRepoOwner() {
  return new Promise((resolve, reject) =>
    readLineInterface.question("Who is the repo owner? ", resolve)
  );
}

function getRepoName() {
  return new Promise((resolve, reject) =>
    readLineInterface.question("What is the repo name? ", resolve)
  );
}

async function start() {
  console.log("Welcome to Multitudes CLI! Let’s process some Github Data!");
  console.log();

  selectedRepo.owner = await getRepoOwner();
  while (!USERNAME_REGEX_CONSTRAINTS.test(selectedRepo.owner)) {
    console.log("Please enter a correct owner username.");
    selectedRepo.owner = await getRepoOwner();
  }

  console.log();

  selectedRepo.repo = await getRepoName();
  while (!REPO_NAME_REGEX_CONSTRAINTS.test(selectedRepo.repo)) {
    console.log("Please enter a correct repo name.\n");
    selectedRepo.repo = await getRepoName();
  }

  try {
    console.log(
      `Excellent! Querying ${selectedRepo.owner}/${selectedRepo.repo} for open PRs!`
    );

    const response = await octokit.paginate(
      "GET /repos/{owner}/{repo}/pulls",
      selectedRepo
    );

    const numOpenPullReq = response
      .map((pullReq) => pullReq.state)
      .reduce(
        (acc, pullReqState) => (pullReqState === "open" ? ++acc : acc),
        0
      );

    console.log(`# of open PR: ${numOpenPullReq}`);

    const rateLimit = await octokit.request("GET /rate_limit");

    console.log(rateLimit.data.rate.remaining);
  } catch (err) {
    console.error(err.status);
  }

  process.exit();
}

start();
