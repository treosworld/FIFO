var nodemailer = require("nodemailer");
const Big = require("big.js");

function SendAdminEmailNotification(Wallet_ID, PreviousBalance, NewBalance) {
  let AmountUsed = Big(PreviousBalance).minus(Big(NewBalance));
  var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "upendra@treos.team",
      pass: "||--EmailPassword--||"
    }
  });

  var mailOptions = {
    from: "upendra@treos.team",
    to: "ryanvs@treos.team",
    subject: AmountUsed + " TRO used from Reserve Wallet",
    text:
      AmountUsed +
      " TRO used from Reserve Wallet\n" +
      "\nWallet ID : " +
      Wallet_ID +
      "\nPrevious Balance : " +
      PreviousBalance +
      "\nNew Balance : " +
      NewBalance +
      "\nAmount Used : " +
      AmountUsed
  };

  transporter.sendMail(mailOptions, function(err, info) {
    try {
      if (err) {
        throw err;
      } else {
        console.log("Email sent: " + info.response);
      }
    } catch (err) {
      console.log("Mail Not Sent");
      console.log(err);
    }
  });
}

exports = module.exports = {
  SendAdminEmailNotification
};
