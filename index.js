const express = require('express');
const app = express();
const cors = require("cors");
const { Web3 } = require("web3");
require('dotenv').config("web3");
const path = require('path'); // Added for correct ABI path resolution

// Assuming ABI.json is in the same directory as your server.js file
const ABI = require('./ABI.json');

app.use(cors());
app.use(express.json()); // Parses incoming JSON requests

// Assuming your local Ethereum node is running on port 7545
const API_KEY = process.env.API_KEY;
const port = process.env.PORT || 3000;
const web3 = new Web3(`https://eth-sepolia.g.alchemy.com/v2/${API_KEY}`);
const contractAddress = "0xA2f0Ad121f545cdE8612AE4E2EE8d82489183111";
const contract = new web3.eth.Contract(ABI, contractAddress);

// Gender verification with case-insensitive comparison
const genderVerification = (gender) => {
  const normalizedGender = gender.toLowerCase();
  return normalizedGender === "male" || normalizedGender === "female" || normalizedGender === "others";
};

// Party clash status check using contract call
const partyClashStatus = async (party) => {
  try {
    const candidateInfo = await contract.methods.candidateList().call();
    return candidateInfo.some((candidate) => candidate.party === party);
  } catch (error) {
    console.error("Error while fetching candidate list:", error);
    // Handle errors appropriately, e.g., return an error message or status code
  }
};

// Voter verification endpoint
app.post("/api/voter-verification", (req, res) => {
  const { gender } = req.body;
  console.log(gender);
  const status = genderVerification(gender);

  if (status) {
    res.status(200).json({ message: "Registration successful" });
  } else {
    res.status(403).json({ message: "Invalid gender" });
  }
});

// Voting time validity check
app.post("/api/time-bound", (req, res) => {
  const { stime, etime } = req.body;
  const timeDifference = etime - stime;
  console.log(timeDifference);
  if (timeDifference <= 86400 && timeDifference > 0) { // Ensure positive time difference
    res.status(200).json({ message: "Voting timer started" });
  } else {
    res.status(403).json({ message: "Voting time must be between 1 to 24 hours" });
  }
});

// Candidate verification endpoint
app.post("/api/candidate-verification", async (req, res) => {
  const { gender, party } = req.body;
  console.log(gender, party);

  const partyStatus = await partyClashStatus(party);
  const genderStatus = genderVerification(gender);

  if (genderStatus && !partyStatus) { // Use logical NOT for clarity
    res.status(200).json({ message: "Registration successful" });
  } else {
    res.status(403).json({ message: "Invalid party or gender" });
  }
});

// Error handling middleware (optional but recommended)
app.use((err, req, res, next) => {
  if (err) {
    console.error(err.stack); // Log the error details for debugging
    res.status(500).json({ message: "Internal server error" }); // Send a generic error message to the client
  } else {
    next();
  }
});

app.listen(port, () => {
  console.log(`Server is running at pport ${port}`);
});
