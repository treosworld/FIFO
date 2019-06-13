const route = require("express").Router();
const request = require("request");
const Big = require("big.js");
const db = require("../db");
const uuid = require("uuid/v4");
const Notify = require("../Notify");

var DepositTransactions = {
  head: null
};

var WithdrawalTransactions = {
  head: null
};

// An Array which maintains a list of Orders Pending for Execution (If there are any)
let TempOrderList = [];
let Matched_Amount = [];
let OrderPlacedAmount = 0;
// These Flag and counters ensure That one Transaction Starts Execution only
// After Previous Transaction has been Succesfully written to the Database
let AddBuyOrder_TransactionCount = 0;
let UpdateBuyOrder_TransactionCount = 0;
let DeleteBuyOrder_TransactionCount = 0;
let BuyOrderComplete = true;

let AddSellOrder_TransactionCount = 0;
let UpdateSellOrder_TransactionCount = 0;
let DeleteSellOrder_TransactionCount = 0;
let SellOrderComplete = true;

let TransferFundsFlag = 0;

// A function  to Generate UUID (Version 4)
function GenerateUUID() {
  return uuid();
}

function BuyDatabaseNode(
  OrderID,
  User_ID,
  amount,
  token,
  OrderTime,
  type,
  TokenAmount
) {
  this.OrderID = OrderID;
  this.User_ID = User_ID;
  this.amount = amount;
  this.token = token;
  this.type = type;
  this.date = OrderTime;
  var hours = this.date.getHours();
  var min = this.date.getMinutes();
  this.time = hours + " : " + min;
  this.TokenAmount = TokenAmount;
  this.next = null;
}

function SellDatabaseNode(OrderID, User_ID, amount, TROtype, token, OrderTime, type) {
  this.OrderID = OrderID;
  this.User_ID = User_ID;
  this.amount = amount;
  this.TROtype = TROtype;
  this.token = token;
  this.type = type;
  this.date = OrderTime;
  var hours = this.date.getHours();
  var min = this.date.getMinutes();
  this.time = hours + " : " + min;
  this.next = null;
}

function ReserveOrderNode(wallet_id, WalletAmount, TokenAccepted) {
  this.wallet_id = wallet_id;
  this.amount = WalletAmount;
  this.token = TokenAccepted;
  this.next = null;
}

var SellQueue = {
  front: null,
  rear: null
};

var BuyQueue = {
  front: null,
  rear: null
};

var ledger = {
  head: null
};

var ReserveWallet = {
  head: null
};

function CheckToExecuteTransaction() {
  console.log("Checking If next Transaction can be executed");
  if (
    BuyOrderComplete == true &&
    SellOrderComplete == true &&
    UpdateBuyOrder_TransactionCount == 0 &&
    DeleteBuyOrder_TransactionCount == 0 &&
    AddBuyOrder_TransactionCount == 0 &&
    UpdateSellOrder_TransactionCount == 0 &&
    DeleteSellOrder_TransactionCount == 0 &&
    AddSellOrder_TransactionCount == 0 &&
    TransferFundsFlag == 0
  ) {
    console.log("Yes, Next Transaction can be executed (If any)");
    return true;
  } else {
    console.log("Next Transaction Cannot be Executed at the Moment");
    return false;
  }
}

function ExecuteNextTransaction() {
  if (TempOrderList.length != 0) {
    if (TempOrderList[0].type == "Buy") {
      console.log("Executing next Buy Order transaction");
      ExecuteBuyOrder(
        TempOrderList[0].User_ID,
        TempOrderList[0].amount,
        TempOrderList[0].token,
        TempOrderList[0].CurrencyAmount
      );
    } else {
      console.log("Executing next Sell Order Transaction");
      ExecuteSellOrder(
        TempOrderList[0].User_ID,
        TempOrderList[0].amount,
        TempOrderList[0].token,
        TempOrderList[0].SoldToken
      );
    }
    TempOrderList.shift();
  } else console.log("No more transactions to execute");
}

function AddSellOrder(OrderID, User_ID, Amount, SoldToken, token, CurrentTime) {
  AddSellOrder_TransactionCount += 1;
  console.log(
    "INC AddSellOrder_TransactionCount : " + AddSellOrder_TransactionCount
  );
  tokenString = token.join();
  db.AddSellOrder(OrderID, User_ID, Amount, SoldToken, tokenString, CurrentTime)
    .then(() => {
      AddSellOrder_TransactionCount -= 1;
      OrderPlacedAmount = Amount;
      console.log("OrderPlacedAmount : " + OrderPlacedAmount);
      console.log(
        "DEC AddSellOrder_TransactionCount : " + AddSellOrder_TransactionCount
      );
    })
    .catch(err => {
      AddSellOrder_TransactionCount -= 1;
      OrderPlacedAmount = 0;
      console.log(
        "DEC AddSellOrder_TransactionCount : " + AddSellOrder_TransactionCount
      );
      console.log(err);
    });
}

function SellBid(OrderID, User_ID, amount, token, SoldToken) {
  return new Promise(function(resolve, reject) {
    console.log("Matching this Sell Order with Buy Queue");
    Matched_Amount = [];
    var AmountLeft = MatchSellOrder(User_ID, amount, token, SoldToken);
    console.log("AmountLeft : " + AmountLeft);
    if (AmountLeft !== 0) {
      var CurrentTime = new Date();
      console.log("Adding new Sell Order in Sell Queue");
      AddSellOrder(OrderID, User_ID, AmountLeft, SoldToken, token, CurrentTime);
    }
    console.log("All Traversed");
    let Interval = setInterval(() => {
      if (
        UpdateBuyOrder_TransactionCount == 0 &&
        DeleteBuyOrder_TransactionCount == 0 &&
        AddSellOrder_TransactionCount == 0 &&
        TransferFundsFlag == 0
      ) {
        console.log("Sell Order Execution Complete");
        SellOrderComplete = true;
        clearInterval(Interval);
        resolve();
      }
    }, 20);
  });
}

function AddBuyOrder(
  OrderID,
  User_ID,
  Amount,
  token,
  tokenAmount,
  CurrentTime
) {
  AddBuyOrder_TransactionCount += 1;
  console.log(
    "INC AddBuyOrder_TransactionCount : " + AddBuyOrder_TransactionCount
  );
  tokenString = token.join();
  db.AddBuyOrder(
    OrderID,
    User_ID,
    Amount,
    tokenString,
    tokenAmount,
    CurrentTime
  )
    .then(() => {
      AddBuyOrder_TransactionCount -= 1;
      OrderPlacedAmount = Amount;
      console.log("OrderPlacedAmount : " + OrderPlacedAmount);
      console.log(
        "DEC AddBuyOrder_TransactionCount : " + AddBuyOrder_TransactionCount
      );
    })
    .catch(err => {
      AddBuyOrder_TransactionCount -= 1;
      OrderPlacedAmount = 0;
      console.log(
        "DEC AddBuyOrder_TransactionCount : " + AddBuyOrder_TransactionCount
      );
      console.log(err);
    });
}

function BuyBid(OrderID, User_ID, amount, token, CurrencyAmount) {
  return new Promise(function(resolve, reject) {
    let Multiplier = parseFloat(Big(CurrencyAmount).div(Big(amount)));
    console.log("Matching this Buy Order with Sell Queue");
    Matched_Amount = [];
    var AmountLeft = MatchBuyOrder(User_ID, amount, token, Multiplier);
    if (AmountLeft !== 0) {
      console.log("Matching left Buy Order with Reserve Orders");
      AmountLeft = MatchReserveOrder(User_ID, AmountLeft, token, Multiplier);
    }
    if (AmountLeft !== 0) {
      var CurrentTime = new Date();
      console.log("Adding new Buy Order in Database");
      console.log("test 1");
      var ConvertedValue = parseFloat(Big(Multiplier).times(Big(AmountLeft)));
      console.log("test 2");
      console.log("ConvertedValue : " + ConvertedValue);
      AddBuyOrder(
        OrderID,
        User_ID,
        AmountLeft,
        token,
        ConvertedValue,
        CurrentTime
      );
      console.log("All Traversed");
    }
    let Interval = setInterval(() => {
      if (
        UpdateSellOrder_TransactionCount == 0 &&
        DeleteSellOrder_TransactionCount == 0 &&
        AddBuyOrder_TransactionCount == 0 &&
        TransferFundsFlag == 0
      ) {
        console.log("Buy Order Execution Complete");
        BuyOrderComplete = true;
        clearInterval(Interval);
        resolve();
      }
    }, 20);
  });
}

function AddNewTransaction(User_ID, matchedUser_ID, Amount, tkn, type, SoldToken, TokenAmount) {
  Matched_Amount.push(Amount);
  console.log("Adding new Transaction in SalesLedger");
  var CurrentTime = new Date();
  console.log("Adding new Transaction in SalesLedger Database");
  var Hash = GenerateUUID();
  db.UpdateSalesLedger(
    User_ID,
    type,
    matchedUser_ID,
    Amount,
    SoldToken,
    tkn,
    TokenAmount,
    Hash,
    CurrentTime
  );
}

function UpdateBuyOrderBook(OrderID, Amount) {
  console.log("Updating Buy OrderBook");
  UpdateBuyOrder_TransactionCount += 1;
  console.log(
    "INC UpdateBuyOrder_TransactionCount : " + UpdateBuyOrder_TransactionCount
  );
  db.UpdateBuyOrderBook(OrderID, Amount)
    .then(() => {
      UpdateBuyOrder_TransactionCount -= 1;
      console.log(
        "DEC UpdateBuyOrder_TransactionCount : " +
          UpdateBuyOrder_TransactionCount
      );
    })
    .catch(err => {
      UpdateBuyOrder_TransactionCount -= 1;
      console.log(
        "DEC UpdateBuyOrder_TransactionCount : " +
          UpdateBuyOrder_TransactionCount
      );
      console.log(err);
    });
}

function DeleteBuyOrder(OrderID) {
  console.log("Deleting Buy Order");
  DeleteBuyOrder_TransactionCount += 1;
  console.log(
    "INC DeleteBuyOrder_TransactionCount : " + DeleteBuyOrder_TransactionCount
  );
  db.DeleteBuyOrder(OrderID)
    .then(() => {
      DeleteBuyOrder_TransactionCount -= 1;
      console.log(
        "INC DeleteBuyOrder_TransactionCount : " +
          DeleteBuyOrder_TransactionCount
      );
    })
    .catch(err => {
      DeleteBuyOrder_TransactionCount -= 1;
      console.log(
        "INC DeleteBuyOrder_TransactionCount : " +
          DeleteBuyOrder_TransactionCount
      );
      console.log(err);
    });
}

function PerformBuyOrderTransactions(
  User_ID,
  matchedUser_ID,
  Amount,
  token,
  type,
  UpdateDatabase,
  OrderID,
  OrderAmount,
  TokenValue,
  SoldToken
) {
  if (Amount != 0) {
    console.log("Performing Actual Deposit & Withdrawal of Funds");
    var SenderId = User_ID;
    var ReceiverId = matchedUser_ID;
    TransferFundsFlag += 1;
    console.log("TransferFundsFlag : " + TransferFundsFlag);
    db.TransferFunds(
      parseFloat(Amount),
      SenderId,
      ReceiverId,
      token,
      TokenValue,
      SoldToken
    )
      .then(() => {
        TransferFundsFlag -= 1;
        console.log("TransferFundsFlag : " + TransferFundsFlag);
        AddNewTransaction(User_ID, matchedUser_ID, Amount, token, type, SoldToken, TokenValue);
        if (OrderAmount) {
          UpdateDatabase(OrderID, OrderAmount);
        } else UpdateDatabase(OrderID);
      })
      .catch(err => {
        TransferFundsFlag -= 1;
        console.log("TransferFundsFlag : " + TransferFundsFlag);
        console.log(err);
      });
  }
}

function UpdateSellOrderBook(OrderID, Amount) {
  console.log("Update Sell Queue");
  UpdateSellOrder_TransactionCount += 1;
  console.log(
    "INC UpdateSellOrder_TransactionCount : " + UpdateSellOrder_TransactionCount
  );
  db.UpdateSellOrderBook(OrderID, Amount)
    .then(() => {
      UpdateSellOrder_TransactionCount -= 1;
      console.log(
        "DEC UpdateSellOrder_TransactionCount : " +
          UpdateSellOrder_TransactionCount
      );
    })
    .catch(err => {
      UpdateSellOrder_TransactionCount -= 1;
      console.log(
        "DEC UpdateSellOrder_TransactionCount : " +
          UpdateSellOrder_TransactionCount
      );
      console.log(err);
    });
}

function DeleteSellOrder(OrderID) {
  console.log("DeleteSellOrder in Sell Queue");
  DeleteSellOrder_TransactionCount += 1;
  console.log(
    "INC DeleteSellOrder_TransactionCount : " + DeleteSellOrder_TransactionCount
  );
  db.DeleteSellOrder(OrderID)
    .then(() => {
      DeleteSellOrder_TransactionCount -= 1;
      console.log(
        "DEC DeleteSellOrder_TransactionCount : " +
          DeleteSellOrder_TransactionCount
      );
    })
    .catch(err => {
      DeleteSellOrder_TransactionCount -= 1;
      console.log(
        "DEC DeleteSellOrder_TransactionCount : " +
          DeleteSellOrder_TransactionCount
      );
      console.log(err);
    });
}

function PerformSellOrderTransactions(
  User_ID,
  matchedUser_ID,
  Amount,
  token,
  type,
  UpdateDatabase,
  OrderID,
  OrderAmount,
  TokenAmount,
  SoldToken
) {
  console.log(SoldToken);
  if (Amount != 0) {
    console.log("Perform Transaction of Sell Order");
    var SenderId = matchedUser_ID;
    var ReceiverId = User_ID;
    TransferFundsFlag += 1;
    console.log("TransferFundsFlag : " + TransferFundsFlag);
    db.TransferFunds(
      parseFloat(Amount),
      SenderId,
      ReceiverId,
      token,
      TokenAmount,
      SoldToken
    )
      .then(() => {
        TransferFundsFlag -= 1;
        console.log("TransferFundsFlag : " + TransferFundsFlag);
        AddNewTransaction(User_ID, matchedUser_ID, Amount, token, type, SoldToken,TokenAmount);
        if (OrderAmount) {
          UpdateDatabase(OrderID, OrderAmount);
        } else UpdateDatabase(OrderID);
      })
      .catch(err => {
        TransferFundsFlag -= 1;
        console.log("TransferFundsFlag : " + TransferFundsFlag);
        console.log(err);
      });
  }
}

function PerformReserveOrderTransaction(
  User_ID,
  matchedUser_ID,
  Amount,
  token,
  PreviousBalance,
  NewBalance,
  TokenValue
) {
  if (Amount != 0) {
    console.log("Performing Actual Reserve Order Transactions");
    var SenderId = User_ID;
    var ReceiverId = matchedUser_ID;
    TransferFundsFlag += 1;
    console.log("TransferFundsFlag : " + TransferFundsFlag);
    db.TransferFundsFromReserveWallet(
      parseFloat(Amount),
      SenderId,
      ReceiverId,
      token,
      TokenValue
    )
      .then(() => {
        TransferFundsFlag -= 1;
        console.log("TransferFundsFlag : " + TransferFundsFlag);
        AddNewTransaction(User_ID, matchedUser_ID, Amount, token, "Buy", "TRO", TokenValue);
        ReserveWalletNotification(
          matchedUser_ID,
          User_ID,
          PreviousBalance,
          NewBalance
        );
      })
      .catch(err => {
        TransferFundsFlag -= 1;
        console.log("TransferFundsFlag : " + TransferFundsFlag);
        console.log(err);
      });
  }
}

function ReserveOrderBid(wallet_id, WalletAmount, TokenAccepted) {
  var newReserveOrder = new ReserveOrderNode(
    wallet_id,
    WalletAmount,
    TokenAccepted
  );
  if (ReserveWallet.head == null) {
    ReserveWallet.head = newReserveOrder;
  } else {
    var ReserveWalletHead = ReserveWallet.head;
    while (ReserveWalletHead.next) {
      ReserveWalletHead = ReserveWalletHead.next;
    }
    ReserveWalletHead.next = newReserveOrder;
  }
}

function MatchBuyOrder(User_ID, amount, token, Multiplier) {
  if (SellQueue.front) {
    console.log("Matching Buy order with Sell Queue");
    var head = SellQueue.front;
    var flag = 0;
    var matchedToken;
    for (var i = 0; i < head.token.length; i++) {
      for (var j = 0; j < token.length; j++) {
        if (head.token[i] === token[j]) {
          matchedToken = token[j];
          flag = 1;
          break;
        }
      }
    }
    if (flag == 1) {
      if (parseFloat(head.amount) <= parseFloat(amount)) {
        amount = parseFloat(Big(amount).minus(head.amount));
        SellQueue.front = SellQueue.front.next;
        PerformBuyOrderTransactions(
          User_ID,
          head.User_ID,
          parseFloat(head.amount),
          matchedToken,
          head.type,
          DeleteSellOrder,
          head.OrderID,
          null,
          parseFloat(Big(Multiplier).times(Big(head.amount))),
          head.TROtype
        );
      } else {
        head.amount = parseFloat(Big(head.amount).minus(amount));
        PerformBuyOrderTransactions(
          User_ID,
          head.User_ID,
          parseFloat(amount),
          matchedToken,
          head.type,
          UpdateSellOrderBook,
          head.OrderID,
          head.amount,
          parseFloat(Big(Multiplier).times(Big(amount))),
          head.TROtype
        );
        amount = 0;
      }
    }

    while (head.next && amount != 0) {
      flag = 0;
      for (var i = 0; i < head.next.token.length; i++) {
        for (var j = 0; j < token.length; j++) {
          if (head.next.token[i] === token[j]) {
            matchedToken = token[j];
            flag = 1;
            break;
          }
        }
      }
      if (flag == 1) {
        if (parseFloat(head.next.amount) <= parseFloat(amount)) {
          amount = parseFloat(Big(amount).minus(head.next.amount));
          PerformBuyOrderTransactions(
            User_ID,
            head.next.User_ID,
            parseFloat(head.next.amount),
            matchedToken,
            head.next.type,
            DeleteSellOrder,
            head.next.OrderID,
            null,
            parseFloat(Big(Multiplier).times(Big(head.next.amount))),
            head.next.TROtype
          );
          head.next.amount = 0;
        } else {
          head.next.amount = parseFloat(Big(head.next.amount).minus(amount));
          PerformBuyOrderTransactions(
            User_ID,
            head.next.User_ID,
            parseFloat(amount),
            matchedToken,
            head.next.type,
            UpdateSellOrderBook,
            head.next.OrderID,
            head.next.amount,
            parseFloat(Big(Multiplier).times(Big(amount))),
            head.next.TROtype
          );
          amount = 0;
        }
      }
      head = head.next;
    }
  }
  return amount;
}

function MatchSellOrder(User_ID, amount, token, SoldToken) {
  if (BuyQueue.front) {
    console.log("Matching Sell Order with Buy Queue");
    var head = BuyQueue.front;
    var flag = 0;
    var matchedToken;
    for (var i = 0; i < head.token.length; i++) {
      for (var j = 0; j < token.length; j++) {
        if (head.token[i] === token[j]) {
          matchedToken = token[j];
          flag = 1;
          break;
        }
      }
    }
    if (flag == 1) {
      if (parseFloat(head.amount) <= parseFloat(amount)) {
        amount = parseFloat(Big(amount).minus(head.amount));
        PerformSellOrderTransactions(
          User_ID,
          head.User_ID,
          parseFloat(head.amount),
          matchedToken,
          head.type,
          DeleteBuyOrder,
          head.OrderID,
          null,
          parseFloat(head.TokenAmount),
          SoldToken
        );
        BuyQueue.front = BuyQueue.front.next;
      } else {
        let Multiplier = parseFloat(
          Big(head.TokenAmount).div(Big(head.amount))
        );
        head.amount = parseFloat(Big(head.amount).minus(amount));
        PerformSellOrderTransactions(
          User_ID,
          head.User_ID,
          parseFloat(amount),
          matchedToken,
          head.type,
          UpdateBuyOrderBook,
          head.OrderID,
          head.amount,
          parseFloat(Big(Multiplier).times(Big(amount))),
          SoldToken
        );
        amount = 0;
      }
    }

    while (head.next && amount != 0) {
      flag = 0;
      for (var i = 0; i < head.next.token.length; i++) {
        for (var j = 0; j < token.length; j++) {
          if (head.next.token[i] === token[j]) {
            matchedToken = token[j];
            flag = 1;
            break;
          }
        }
      }
      if (flag == 1) {
        if (parseFloat(head.next.amount) <= parseFloat(amount)) {
          amount = parseFloat(Big(amount).minus(head.next.amount));
          PerformSellOrderTransactions(
            User_ID,
            head.next.User_ID,
            parseFloat(head.next.amount),
            matchedToken,
            head.next.type,
            DeleteBuyOrder,
            head.next.OrderID,
            null,
            parseFloat(head.next.TokenAmount),
            SoldToken
          );
          head.next.amount = 0;
        } else {
          let Multiplier = parseFloat(
            Big(head.next.TokenAmount).div(Big(head.next.amount))
          );
          head.next.amount = parseFloat(Big(head.next.amount).minus(amount));
          PerformSellOrderTransactions(
            User_ID,
            head.next.User_ID,
            parseFloat(amount),
            matchedToken,
            head.next.type,
            UpdateBuyOrderBook,
            head.next.OrderID,
            head.next.amount,
            parseFloat(Big(Multiplier).times(Big(amount))),
            SoldToken
          );
          amount = 0;
        }
      }
      head = head.next;
    }
  }
  return amount;
}

function MatchReserveOrder(User_ID, amount, token, Multiplier) {
  if (ReserveWallet.head) {
    let head = ReserveWallet.head;
    if (ReserveWallet.head.amount !== 0) {
      var flag = 0;
      var matchedToken;
      for (var i = 0; i < head.token.length; i++) {
        for (var j = 0; j < token.length; j++) {
          if (head.token[i] === token[j]) {
            matchedToken = token[j];
            flag = 1;
            break;
          }
        }
      }
      if (flag == 1) {
        if (parseFloat(head.amount) <= parseFloat(amount)) {
          amount = parseFloat(Big(amount).minus(Big(head.amount)));
          PerformReserveOrderTransaction(
            User_ID,
            head.wallet_id,
            parseFloat(head.amount),
            matchedToken,
            parseFloat(head.amount),
            0,
            parseFloat(Big(Multiplier).times(Big(head.amount)))
          );
          head.amount = 0;
        } else {
          head.amount = parseFloat(Big(head.amount).minus(Big(amount)));
          PerformReserveOrderTransaction(
            User_ID,
            head.wallet_id,
            parseFloat(amount),
            matchedToken,
            parseFloat(Big(head.amount).plus(Big(amount))),
            head.amount,
            parseFloat(Big(Multiplier).times(Big(amount)))
          );
          amount = 0;
        }
      }
    }
    while (head.next && head.next.amount !== 0 && amount !== 0) {
      flag = 0;
      for (var i = 0; i < head.next.token.length; i++) {
        for (var j = 0; j < token.length; j++) {
          if (head.next.token[i] === token[j]) {
            matchedToken = token[j];
            flag = 1;
            break;
          }
        }
      }
      if (flag == 1) {
        if (parseFloat(head.next.amount) <= parseFloat(amount)) {
          amount = parseFloat(Big(amount).minus(Big(head.next.amount)));
          PerformReserveOrderTransaction(
            User_ID,
            head.next.wallet_id,
            parseFloat(head.next.amount),
            matchedToken,
            parseFloat(head.next.amount),
            0,
            parseFloat(Big(Multiplier).times(Big(head.next.amount)))
          );
          head.next.amount = 0;
        } else {
          head.next.amount = parseFloat(
            Big(head.next.amount).minus(Big(amount))
          );
          PerformReserveOrderTransaction(
            User_ID,
            head.next.wallet_id,
            parseFloat(amount),
            matchedToken,
            parseFloat(Big(head.next.amount).plus(Big(amount))),
            head.next.amount,
            parseFloat(Big(Multiplier).times(Big(amount)))
          );
          amount = 0;
        }
      }
      head = head.next;
    }
  }
  return amount;
}

function ReserveWalletNotification(
  Wallet_ID,
  User_ID,
  PreviousBalance,
  NewBalance
) {
  var AmountUsed = parseFloat(Big(PreviousBalance).minus(Big(NewBalance)));
  createAdminSystemNotification(AmountUsed);
  AdminEmailNotification(Wallet_ID, User_ID, PreviousBalance, NewBalance);
}

function createAdminSystemNotification(AmountUsed) {
  //TODO: send a notification to the Admin dashboard when a transaction occurs using the reserve wallet.
}

function AdminEmailNotification(
  Wallet_ID,
  User_ID,
  PreviousBalance,
  NewBalance
) {
  Notify.SendAdminEmailNotification(
    Wallet_ID,
    User_ID,
    PreviousBalance,
    NewBalance
  );
}

function ExecuteBuyOrder(User_ID, amount, token, CurrencyAmount) {
  console.log("\nBuy Order Execution Starts");
  BuyOrderComplete = false;
  db.GetSellOrderBook()
    .then(Orders => {
      console.log("Sell Order Book Fetched from the Database");
      SellQueue.front = null;
      SellQueue.rear = null;
      for (Order of Orders) {
        var TokenArray = Order.Token.split(",");
        var NewSellOrder = new SellDatabaseNode(
          Order.OrderID,
          Order.User_ID,
          Order.TRO,
          Order.Type,
          TokenArray,
          Order.Time,
          "Buy"
        );
        if (SellQueue.rear === null || SellQueue.front === null) {
          SellQueue.front = SellQueue.rear = NewSellOrder;
        } else {
          SellQueue.rear.next = NewSellOrder;
          SellQueue.rear = NewSellOrder;
        }
      }

      db.GetReserveOrders()
        .then(ReserveOrders => {
          ReserveWallet.head = null;
          for (ReserveOrder of ReserveOrders) {
            var Wallet_ID = ReserveOrder.Wallet_ID;
            var TRO = ReserveOrder.TRO;
            var TROAmount = parseFloat(TRO);
            var TokenAccepted = ReserveOrder.TokenAccepted;
            var TokenAcceptedArray = TokenAccepted.split(",");
            ReserveOrderBid(Wallet_ID, TROAmount, TokenAcceptedArray);
          }

          var OrderID = GenerateUUID();
          console.log("Sending for Execution Of Buy Order");
          BuyBid(OrderID, User_ID, amount, token, CurrencyAmount)
            .then(() => {
              console.log("Buy order Successfully Executed");
              var Status = CheckToExecuteTransaction();
              if (Status == true) ExecuteNextTransaction();
            })
            .catch(err => {
              console.log("Error Occured during execution");
              console.log(err);
              db.RollbackTransaction(User_ID, CurrencyAmount, token)
            .then(() => {
              console.log("Balance Reversed");
            })
            .catch(() => {
              console.log("Unable to Reverse Balance, Contact Support");
              console.log("BALANCE NOT REVERSED, CONTACT SUPPORT, DETAILS : ");
              console.log("User_ID : " + User_ID);
              console.log("CurrencyAmount : " + CurrencyAmount);
              console.log("token : " + token);
            });
              BuyOrderComplete = true;
              var Status = CheckToExecuteTransaction();
              if (Status == true) ExecuteNextTransaction();
            });
        })
        .catch(err => {
          console.log(
            "Error Occured white fetching Reserve Order Book. Buy Order Execution Ended"
          );
          console.log(err);
          BuyOrderComplete = true;
          res.send({ OrderExecutedFlag: false });
          var Status = CheckToExecuteTransaction();
          if (Status == true) ExecuteNextTransaction();
        });
    })
    .catch(err => {
      console.log(
        "Error Occured in Fetching Sell order Book from Database, Buy Order Execution Ended"
      );
      BuyOrderComplete = true;
      console.log(err);
      var Status = CheckToExecuteTransaction();
      if (Status == true) ExecuteNextTransaction();
    });
}

route.post("/BuyBid/", (req, res) => {
  if (
    TempOrderList.length == 0 &&
    BuyOrderComplete == true &&
    SellOrderComplete == true &&
    UpdateSellOrder_TransactionCount == 0 &&
    DeleteSellOrder_TransactionCount == 0 &&
    AddSellOrder_TransactionCount == 0
  ) {
    console.log("\nExecuting First Buy Order");
    console.log("Buy Order Execution Starts");
    BuyOrderComplete = false;
    db.GetSellOrderBook()
      .then(Orders => {
        console.log("Sell Order Book Fetched from the Database");
        SellQueue.front = null;
        SellQueue.rear = null;
        for (Order of Orders) {
          var TokenArray = Order.Token.split(",");
          var NewSellOrder = new SellDatabaseNode(
            Order.OrderID,
            Order.User_ID,
            Order.TRO,
            Order.Type,
            TokenArray,
            Order.Time,
            "Buy"
          );
          if (SellQueue.rear === null || SellQueue.front === null) {
            SellQueue.front = SellQueue.rear = NewSellOrder;
          } else {
            SellQueue.rear.next = NewSellOrder;
            SellQueue.rear = NewSellOrder;
          }
        }

        db.GetReserveOrders()
          .then(ReserveOrders => {
            ReserveWallet.head = null;
            for (ReserveOrder of ReserveOrders) {
              var Wallet_ID = ReserveOrder.Wallet_ID;
              var TRO = ReserveOrder.TRO;
              var TROAmount = parseFloat(TRO);
              var TokenAccepted = ReserveOrder.TokenAccepted;
              var TokenAcceptedArray = TokenAccepted.split(",");
              ReserveOrderBid(Wallet_ID, TROAmount, TokenAcceptedArray);
            }

            var OrderID = GenerateUUID();
            console.log("Sending for Execution Of Buy Order");
            BuyBid(
              OrderID,
              req.body.User_ID,
              req.body.amount,
              req.body.token,
              req.body.CurrencyAmount
            )
              .then(() => {
                console.log(
                  "Buy order Successfully Executed, sending response to the Client"
                );
                console.log("OrderPlacedAmount : " + OrderPlacedAmount);
                res.send({
                  OrderExecutedFlag: true,
                  ExecutedOrders: Matched_Amount,
                  OrderPlacedAmount: OrderPlacedAmount
                });
                OrderPlacedAmount = 0;
                var Status = CheckToExecuteTransaction();
                if (Status == true) ExecuteNextTransaction();
              })
              .catch(err => {
                console.log("Error Occured");
                console.log(err);
                db.RollbackTransaction(
                  req.body.User_ID,
                  req.body.CurrencyAmount,
                  req.body.token
                )
                  .then(() => {
                    console.log("Balance Reversed Successfully")
                    res.send({ OrderExecutedFlag: false });
                  })
                  .catch(() => {
                    res.send({ OrderExecutedFlag: false });
                    console.log(
                      "BALANCE NOT REVERSED, CONTACT SUPPORT, DETAILS : "
                    );
                    console.log("User_ID : " + req.body.User_ID);
                    console.log("amount : " + req.body.CurrencyAmount);
                    console.log("token : " + req.body.token);
                  });
                BuyOrderComplete = true;
                var Status = CheckToExecuteTransaction();
                if (Status == true) ExecuteNextTransaction();
              });
          })
          .catch(err => {
            console.log(
              "Error Occured white fetching Reserve Order Book. Buy Order Execution Ended"
            );
            console.log(err);
            BuyOrderComplete = true;
            res.send({ OrderExecutedFlag: false });
            var Status = CheckToExecuteTransaction();
            if (Status == true) ExecuteNextTransaction();
          });
      })
      .catch(err => {
        console.log(
          "Error Occured white fetching SellOrderBook, Buy Order Execution Ended"
        );
        console.log(err);
        BuyOrderComplete = true;
        res.send({ OrderExecutedFlag: false });
        var Status = CheckToExecuteTransaction();
        if (Status == true) ExecuteNextTransaction();
      });
  } else {
    console.log("| -- Pushing the Buy Order onto Temporary Stack -- |");
    TempOrderList.push({
      User_ID: req.body.User_ID,
      amount: req.body.amount,
      token: req.body.token,
      CurrencyAmount: req.body.CurrencyAmount,
      type: "Buy"
    });
    res.send({
      OrderExecutedFlag: true,
      ExecutedOrders: [],
      OrderPlacedAmount: 0
    });
  }
});

function ExecuteSellOrder(User_ID, amount, token, SoldToken) {
  console.log("\nSell Order Started Execution");
  SellOrderComplete = false;
  db.GetBuyOrderBook()
    .then(Orders => {
      console.log("Buy order Book Fetched Successfully");
      BuyQueue.front = null;
      BuyQueue.rear = null;
      for (Order of Orders) {
        var TokenArray = Order.Token.split(",");
        var NewBuyOrder = new BuyDatabaseNode(
          Order.OrderID,
          Order.User_ID,
          Order.TRO,
          TokenArray,
          Order.Time,
          "Sell",
          Order.Token_Amount
        );
        if (BuyQueue.rear === null || BuyQueue.front === null) {
          BuyQueue.front = BuyQueue.rear = NewBuyOrder;
        } else {
          BuyQueue.rear.next = NewBuyOrder;
          BuyQueue.rear = NewBuyOrder;
        }
      }
      var OrderID = GenerateUUID();
      SellBid(OrderID, User_ID, amount, token, SoldToken)
        .then(() => {
          db.UpdateSellOrderTimer(User_ID);
          SellOrderComplete = true;
          var Status = CheckToExecuteTransaction();
          if (Status == true) ExecuteNextTransaction();
        })
        .catch(err => {
          db.RollbackTransaction(User_ID, amount, SoldToken)
            .then(() => {
              console.log("Balance Reversed");
            })
            .catch(() => {
              console.log("Unable to Reverse Balance, Contact Support");
              console.log("BALANCE NOT REVERSED, CONTACT SUPPORT, DETAILS : ");
              console.log("User_ID : " + User_ID);
              console.log("amount : " + amount);
              console.log("token : " + SoldToken);
            });
          console.log(err);
          SellOrderComplete = true;
          var Status = CheckToExecuteTransaction();
          if (Status == true) ExecuteNextTransaction();
        });
    })
    .catch(err => {
      console.log("Error Occured, Can't Proceed with Sell order Execution");
      SellOrderComplete = true;
      console.log(err);
      var Status = CheckToExecuteTransaction();
      if (Status == true) ExecuteNextTransaction();
    });
}

route.post("/SellBid/", (req, res) => {
  if (
    TempOrderList.length == 0 &&
    SellOrderComplete == true &&
    BuyOrderComplete == true &&
    UpdateBuyOrder_TransactionCount == 0 &&
    DeleteBuyOrder_TransactionCount == 0 &&
    AddBuyOrder_TransactionCount == 0
  ) {
    console.log("\nExecuting First Sell Order");
    SellOrderComplete = false;
    db.GetBuyOrderBook()
      .then(Orders => {
        console.log("Buy OrderBook fetched Successfully");
        BuyQueue.front = null;
        BuyQueue.rear = null;
        for (Order of Orders) {
          var TokenArray = Order.Token.split(",");
          var NewBuyOrder = new BuyDatabaseNode(
            Order.OrderID,
            Order.User_ID,
            Order.TRO,
            TokenArray,
            Order.Time,
            "Sell",
            Order.Token_Amount
          );
          if (BuyQueue.rear === null || BuyQueue.front === null) {
            BuyQueue.front = BuyQueue.rear = NewBuyOrder;
          } else {
            BuyQueue.rear.next = NewBuyOrder;
            BuyQueue.rear = NewBuyOrder;
          }
        }
        var OrderID = GenerateUUID();
        console.log("Sending Order for Execution");
        SellBid(OrderID, req.body.User_ID, req.body.amount, req.body.token, req.body.SoldToken)
          .then(() => {
            console.log("Order Complete, Sending Response to Client");
            db.UpdateSellOrderTimer(req.body.User_ID);
            console.log("OrderPlacedAmount : " + OrderPlacedAmount);
            res.send({
              OrderExecutedFlag: true,
              ExecutedOrders: Matched_Amount,
              OrderPlacedAmount: OrderPlacedAmount
            });
            OrderPlacedAmount = 0;
            var Status = CheckToExecuteTransaction();
            if (Status == true) ExecuteNextTransaction();
          })
          .catch(err => {
            db.RollbackTransaction(
              req.body.User_ID,
              req.body.amount,
              req.body.SoldToken
            )
              .then(() => {
                res.send({ OrderExecutedFlag: false, msg: "Balance Reversed" });
              })
              .catch(() => {
                res.send({
                  OrderExecutedFlag: false,
                  msg: "Unable to Reverse Balance, Contact Support"
                });
                console.log(
                  "BALANCE NOT REVERSED, CONTACT SUPPORT, DETAILS : "
                );
                console.log("User_ID : " + req.body.User_ID);
                console.log("amount : " + req.body.amount);
                console.log("token : " + req.body.SoldToken);
              });
            console.log("Error Occured");
            console.log(err);
            SellOrderComplete = true;
            var Status = CheckToExecuteTransaction();
            if (Status == true) ExecuteNextTransaction();
          });
      })
      .catch(err => {
        console.log(
          "Error Occured in Fetching Database, Cant Proceed with Sell Order Execution"
        );
        console.log(err);
        SellOrderComplete = true;
        res.send({ OrderExecutedFlag: false });
        var Status = CheckToExecuteTransaction();
        if (Status == true) ExecuteNextTransaction();
      });
  } else {
    console.log("| -- Order Pushed to Temporary Order List -- |");
    TempOrderList.push({
      User_ID: req.body.User_ID,
      amount: req.body.amount,
      token: req.body.token,
      type: "Sell",
      SoldToken: req.body.SoldToken
    });
    res.send({
      OrderExecutedFlag: true,
      ExecutedOrders: [],
      OrderPlacedAmount: 0
    });
  }
});

route.post("/getData/", (req, res) => {
  db.GetSellOrdersOfUser(req.body.UserID)
    .then(OrderBook => {
      res.send(OrderBook);
    })
    .catch(err => res.send({ error: err }));
});

route.get("/TreosConfig/", (req, res) => {
  db.GetTreosConfiguration()
    .then(treos_config => res.send(treos_config))
    .catch(err => res.send({ error: err }));
});

route.post("/getTimer/", function(req, res) {
  db.GetSellOrderTimer(parseInt(req.body.User_ID))
    .then(data => {
      var LastSellOrderTime = new Date(data[0].Time).getTime();
      var CurrentTime = new Date().getTime();
      var miliseconds = parseInt(CurrentTime) - parseInt(LastSellOrderTime);
      var seconds = parseInt(miliseconds / 1000);
      res.send({ seconds: seconds });
    })
    .catch(err => res.send({ error: err }));
});

function DepositTransactionNode(
  UserID,
  Time,
  Token,
  Amount,
  Status,
  Reference,
  address_from,
  address_to,
  fee,
  balance_credited
) {
  this.UserID = UserID;
  this.Time = Time;
  this.Token = Token;
  this.Amount = Amount;
  this.Status = Status;
  this.Reference = Reference;
  this.address_from = address_from;
  this.address_to = address_to;
  this.fee = fee;
  this.balance_credited = balance_credited;
  this.next = null;
}

function WithdrawalTransactionNode(
  UserID,
  Time,
  Token,
  Amount,
  Status,
  Reference,
  address_to,
  fee
) {
  this.UserID = UserID;
  this.Time = Time;
  this.Token = Token;
  this.Amount = Amount;
  this.Status = Status;
  this.Reference = Reference;
  this.address_to = address_to;
  this.fee = fee;
  this.next = null;
}

function DepositTransaction(
  UserID,
  Time,
  Token,
  Amount,
  Status,
  Reference,
  address_from,
  address_to,
  fee,
  balance_credited
) {
  var newDepositTransaction = new DepositTransactionNode(
    UserID,
    Time,
    Token,
    Amount,
    Status,
    Reference,
    address_from,
    address_to,
    fee,
    balance_credited
  );
  if (DepositTransactions.head == null) {
    DepositTransactions.head = newDepositTransaction;
  } else {
    var DepositTransactionsHead = DepositTransactions.head;
    while (DepositTransactionsHead.next) {
      DepositTransactionsHead = DepositTransactionsHead.next;
    }
    DepositTransactionsHead.next = newDepositTransaction;
  }
}

function WithdrawalTransaction(
  UserID,
  Time,
  Token,
  Amount,
  Status,
  Reference,
  address_to,
  fee
) {
  var newWithdrawalTransaction = new WithdrawalTransactionNode(
    UserID,
    Time,
    Token,
    Amount,
    Status,
    Reference,
    address_to,
    fee
  );
  if (WithdrawalTransactions.head == null) {
    WithdrawalTransactions.head = newWithdrawalTransaction;
  } else {
    var WithdrawalTransactionsHead = WithdrawalTransactions.head;
    while (WithdrawalTransactionsHead.next) {
      WithdrawalTransactionsHead = WithdrawalTransactionsHead.next;
    }
    WithdrawalTransactionsHead.next = newWithdrawalTransaction;
  }
}

route.post("/GetDeposits/", (req, res) => {
  DepositTransactions.head = null;
  db.GetDeposits()
    .then(Deposits => {
      for (Deposit of Deposits) {
        if (Deposit.member_id == parseInt(req.body.LoggedinUserId)) {
          var UserID = Deposit.member_id;
          var Time = Deposit.date;
          var Token = Deposit.currency;
          var Amount = Deposit.amount;
          var Status = Deposit.status;
          var Reference = Deposit.txn_reference;
          var address_from = Deposit.address_from;
          var address_to = Deposit.address_to;
          var fee = Deposit.fee;
          var balance_credited = Deposit.balance_credited;
          DepositTransaction(
            UserID,
            Time,
            Token,
            Amount,
            Status,
            Reference,
            address_from,
            address_to,
            fee,
            balance_credited
          );
        }
      }
      res.send({ DepositTransactions: DepositTransactions });
    })
    .catch(err => res.send({ error: err }));
});

route.post("/GetWithdrawals/", (req, res) => {
  WithdrawalTransactions.head = null;
  db.GetWithdrawals()
    .then(Withdrawals => {
      for (Withdrawal of Withdrawals) {
        if (Withdrawal.member_id == parseInt(req.body.LoggedinUserId)) {
          var UserID = Withdrawal.member_id;
          var Time = Withdrawal.date;
          var Token = Withdrawal.currency;
          var Amount = Withdrawal.amount;
          var Status = Withdrawal.status;
          var Reference = Withdrawal.txn_reference;
          var address_to = Withdrawal.address_to;
          var fee = Withdrawal.fee;
          WithdrawalTransaction(
            UserID,
            Time,
            Token,
            Amount,
            Status,
            Reference,
            address_to,
            fee
          );
        }
      }
      res.send({ WithdrawalTransactions: WithdrawalTransactions });
    })
    .catch(err => res.send({ error: err }));
});

route.post("/GetWalletPageLayoutOfUser/", (req, res) => {
  db.GetUserPreferences(req.body.LoggedinUserId)
    .then(Preference => {
      res.send(Preference);
    })
    .catch(err => res.send({ error: err }));
});

route.post("/FirstTimeUserPreference/", (req, res) => {
  db.FirstTimeUserPreference(req.body.LoggedinUserId, req.body.Preference)
    .then(() => {
      console.log("First Time User Preference Updated in Database");
    })
    .catch(err => res.send({ error: err }));
});

route.post("/UpdateNewPreferenceInDatabase/", (req, res) => {
  db.UpdateUserPreferences(req.body.LoggedinUserId, req.body.Preference)
    .then(() => {
      console.log("Preference Updated in Database");
    })
    .catch(err => res.send({ error: err }));
});

route.post("/GetAddressOfUser/", (req, res) => {
  db.GetDepositAddresses(req.body.UserID)
    .then(Addresses => {
      res.send(Addresses);
    })
    .catch(err => res.send({ error: err }));
});

route.post("/CheckBalanceOfUserForSellOrder/", (req, res) => {
  db.GetUserBalance(req.body.User_ID, "TRO")
    .then(dataOne => {
      if (dataOne.length != 0 && dataOne[0].balance != 0) {
        if (dataOne[0].balance >= req.body.OrderAmount) {
          db.PutBalanceInEscrow(
            req.body.User_ID,
            "TRO",
            req.body.OrderAmount
          )
            .then(() => {
              res.send({ Status: true, TRO_UBI: req.body.OrderAmount, TRO: 0 });
            })
            .catch(err => {
              console.log(err);
              res.send({ Status: false });
            });
        } else {
          db.GetUserBalance(req.body.User_ID, "TRO_SPENDABLE")
            .then(dataTwo => {
              if (dataTwo.length != 0) {
                if (
                  dataTwo[0].balance >=
                  parseFloat(
                    Big(req.body.OrderAmount).minus(Big(dataOne[0].balance))
                  )
                ) {
                  db.PutBalanceInEscrow(
                    req.body.User_ID,
                    "TRO",
                    dataOne[0].balance
                  )
                    .then(() => {
                      db.PutBalanceInEscrow(
                        req.body.User_ID,
                        "TRO_SPENDABLE",
                        parseFloat(
                          Big(req.body.OrderAmount).minus(
                            Big(dataOne[0].balance)
                          )
                        )
                      )
                        .then(() => {
                          res.send({
                            Status: true,
                            TRO_UBI: dataOne[0].balance,
                            TRO: parseFloat(
                              Big(req.body.OrderAmount).minus(
                                Big(dataOne[0].balance)
                              )
                            )
                          });
                        })
                        .catch(err => {
                          console.log(err);
                          res.send({ Status: false });
                        });
                    })
                    .catch(err => {
                      console.log(err);
                      res.send({ Status: false });
                    });
                } else {
                  res.send({ Status: false });
                }
              } else {
                res.send({ Status: false });
              }
            })
            .catch(err => {
              console.log(err);
              res.send({ Status: false });
            });
        }
      } else {
        db.GetUserBalance(req.body.User_ID, "TRO_SPENDABLE")
          .then(dataThree => {
            if (dataThree.length != 0) {
              if (dataThree[0].balance >= req.body.OrderAmount) {
                db.PutBalanceInEscrow(
                  req.body.User_ID,
                  "TRO_SPENDABLE",
                  req.body.OrderAmount
                )
                  .then(() => {
                    res.send({
                      Status: true,
                      TRO_UBI: 0,
                      TRO: req.body.OrderAmount
                    });
                  })
                  .catch(err => {
                    console.log(err);
                    res.send({ Status: false });
                  });
              } else {
                res.send({ Status: false });
              }
            } else {
              res.send({ Status: false });
            }
          })
          .catch(err => {
            console.log(err);
            res.send({ Status: false });
          });
      }
    })
    .catch(err => {
      console.log(err);
      res.send({ Status: false });
    });
});

route.post("/CheckBalanceOfUserForBuyOrder/", (req, res) => {
  request.post(
    {
      url: "http://localhost:3567/",
      body: { TROAmount: req.body.TroAmount, Token: req.body.Token },
      json: true
    },
    (error, response, Fetcheddata) => {
      if (Fetcheddata) {
        let ConvertedValue = Fetcheddata.SubmittedAmountValue;
        console.log("ConvertedValue : " + ConvertedValue);
        console.log("Token  : " + req.body.Token);
        db.GetUserBalance(req.body.User_ID, req.body.Token)
          .then(data => {
            console.log(data);
            if (data.length != 0) {
              console.log("data Found");
              if (data[0].balance >= ConvertedValue) {
                console.log("Sufficient Balance");
                db.PutBalanceInEscrow(
                  req.body.User_ID,
                  req.body.Token,
                  ConvertedValue
                )
                  .then(() => {
                    console.log("Balance Successfully Transfered to Escrow");
                    res.send({ Status: true, CurrencyAmount: ConvertedValue });
                  })
                  .catch(err => {
                    console.log("Error");
                    console.log(err);
                    res.send({ Status: false, balance: "EscrowError" });
                  });
              } else {
                res.send({ Status: false, balance: false });
              }
            } else res.send({ Status: false, balance: false });
          })
          .catch(err => {
            console.log(err);
            res.send({ Status: false, balance: "NotChecked" });
          });
      } else {
        console.log("Cannot fetch Conversion Rates");
        res.send({ Status: false, balance: "NotChecked" });
      }
    }
  );
});

route.post("/Rollback/", function(req, res) {
  db.RollbackTransaction(req.body.User_ID,req.body.amount,req.body.token)
    .then(() => {
      res.send({ msg: "Balance Reversed" });
    })
    .catch((err) => {
      res.send({ msg: "Unable to Reverse Balance, Contact Support" });
      console.log("BALANCE NOT REVERSED, CONTACT SUPPORT, DETAILS : ");
      console.log("User_ID : " + User_ID);
      console.log("amount : " + amount);
      console.log("token : " + token);
    });
});

route.post("/GetDataForTimeline/", (req, res) => {
  db.GetSellOrderBook()
    .then(OrderBook => {
      let OrderBookOfUser = [];
      let Counter = 1;
      for(Order of OrderBook){
        if(Order.User_ID == req.body.UserID){
          Order["OrderIndex"] = Counter;
          OrderBookOfUser.push(Order);
        }
        Counter++;
      }
      res.send({OrderBook:OrderBookOfUser, OrderBookLength : OrderBook.length});
    })
    .catch(err => res.send({ error: err }));
});

exports = module.exports = {
  route
};
