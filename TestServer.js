const express = require("express");
const server = express();

server.use(express.json());
server.use(express.urlencoded({ extended: true }));

server.post("/", (req, res) => {
  var SubmittedAmountValue = 0;
  if (req.body.Token == "BTC") {
    SubmittedAmountValue = (parseFloat(req.body.TROAmount) * 41) / 5000;
  } else if (req.body.Token == "ETH") {
    SubmittedAmountValue = (parseFloat(req.body.TROAmount) * 41) / 170;
  } else if (req.body.Token == "LTC") {
    SubmittedAmountValue = (parseFloat(req.body.TROAmount) * 41) / 84;
  } else if (req.body.Token == "EOS") {
    SubmittedAmountValue = (parseFloat(req.body.TROAmount) * 41) / 5.3;
  } else if (req.body.Token == "BCH") {
    SubmittedAmountValue = (parseFloat(req.body.TROAmount) * 41) / 290;
  }
  res.send({ SubmittedAmountValue: SubmittedAmountValue });
});


server.listen(3567);
{
  console.log("Test Server Started on http://localhost:3567/");
}