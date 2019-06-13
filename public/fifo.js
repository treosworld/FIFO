let LoggedinUserId = JSON.parse(localStorage["UserId"]);
let fuel_store_max;
let fuel_store_interval_in_hours;
let SellOrderExecuting = false;
let TempSellOrderQueue = [];
let BuyOrderExecuting = false;
let TempBuyOrderQueue = [];
let SellQueue;
let BuyQueue;
let ledger;
let TimerInterval;
let DepositTransactions;
let WithdrawalTransactions;
let WalletsPagePreferencesStringArray = [];
let WalletsPagePreferencesString = null;
let WalletsPagePreferences = [
  {
    key: "FuelStore",
    value: "1"
  },
  {
    key: "Transactions",
    value: "1"
  },
  {
    key: "Charts",
    value: "1"
  },
  {
    key: "BuyGCR",
    value: "1"
  },
  {
    key: "BTC",
    value: "1"
  },
  {
    key: "ETH",
    value: "1"
  },
  {
    key: "LTC",
    value: "1"
  },
  {
    key: "BCH",
    value: "1"
  },
  {
    key: "GCR",
    value: "1"
  }
];
let SellOrderBookOfUser;
let MarkedOrders = [];
let OrderIdArray = [];

$(function() {
  $.get("/api/TreosConfig", function(TreosConfigurations) {
    for (TreosConfiguration of TreosConfigurations) {
      if (`${TreosConfiguration.option_name}` == "fuel_store_max")
        fuel_store_max = parseFloat(`${TreosConfiguration.option_value}`);
      if (`${TreosConfiguration.option_name}` == "fuel_store_interval_in_hours")
        fuel_store_interval_in_hours = parseFloat(
          `${TreosConfiguration.option_value}`
        );
    }
    $.post("api/getTimer", { User_ID: parseInt(LoggedinUserId) }, function(
      data
    ) {
      TimerMaxTime = fuel_store_interval_in_hours * 3600;
      if (data.seconds < TimerMaxTime) {
        $("#SellTroControls").hide();
        $("#timer").show();
        $(".TreosLogoTimer").show();
        setCoolOffPeriodTimer(TimerMaxTime - data.seconds);
      } else $("#SellTroControls").show();
    });
  });
});

function formattimer(seconds) {
  var h = Math.floor(seconds / 3600),
    m = Math.floor(seconds / 60) % 60,
    s = seconds % 60;
  if (h < 10) h = "0" + h;
  if (m < 10) m = "0" + m;
  if (s < 10) s = "0" + s;
  return h + ":" + m + ":" + s;
}

function setCoolOffPeriodTimer(DataTakenFromDatabase) {
  if (DataTakenFromDatabase == null) {
    var timer = fuel_store_interval_in_hours * 3600;
  } else {
    var timer = DataTakenFromDatabase;
  }
  
  let TotalTimer = fuel_store_interval_in_hours * 3600;
  let TimeLeft = timer;
  let LogoPercentage = parseFloat(((TimeLeft/TotalTimer)*100).toFixed(2));
  if(LogoPercentage>100) LogoPercentage = 100;
  else if(LogoPercentage<0) LogoPercentage = 0;
  $("#GreyedLogo").css("height", `${LogoPercentage}%`);
  $(".TreosLogoTimer").css("top", "0");
  setTimeout(() => {
  $("#GreyedLogo").css("height", "0");
  $("#GreyedLogo").css("transition", `${TimeLeft}s linear`);
     setTimeout(() => {
        $(".TreosLogoTimer").css("top", "300px");
        $(".TreosLogoTimer").css("transition", "5s");
          setTimeout(() => {
              $(".TreosLogoTimer").hide();
          }, 5000);
     }, (TimeLeft*1000)-2000);
  }, 100);

  TimerInterval = setInterval(() => {
    timer--;
    if (timer < 0) {
      $("#timer").hide();
      $("#SellTroControls").show();
      clearInterval(TimerInterval);
      return;
    } else {
      $("#timer").html("You may place another sell order in : "+formattimer(timer));
    }
  }, 1000);
}

function ExecuteNextSellOrder() {
  ExecuteSellOrder(
    TempSellOrderQueue[0].User_ID,
    TempSellOrderQueue[0].SellOrderValue,
    TempSellOrderQueue[0].Submittedtoken
  );
  TempSellOrderQueue.shift();
}

function ExecuteSellOrder(User_ID, SellOrderValue, Submittedtoken) {
  SellOrderExecuting = true;
  $.post(
    "api/CheckBalanceOfUserForSellOrder",
    { User_ID: User_ID, OrderAmount: SellOrderValue },
    function(data) {
      console.log("First Callback Function");
      console.log(data);
      if (data.Status == true) {
        $("#SellTroControls").hide();
        $("#timer").show();
        $(".TreosLogoTimer").show();
        setCoolOffPeriodTimer(null);
        $.notify("Sell Order Submitted", {
          position: "right bottom",
          className: "info"
        });
        if (data.TRO_UBI != 0) {
          $.post(
            "/api/SellBid",
            {
              User_ID: User_ID,
              amount: parseFloat(data.TRO_UBI),
              token: Submittedtoken,
              SoldToken: "TRO"
            },
            function(ReceivedData) {
              console.log("Second Callback Function");
              if (ReceivedData.OrderExecutedFlag === true) {
                for (Amount of ReceivedData.ExecutedOrders) {
                  $.notify(`Sell Order of ${Amount} TRO Executed`, {
                    position: "right bottom",
                    className: "success"
                  });
                }
                if (ReceivedData.OrderPlacedAmount != 0) {
                  $.notify(
                    `Sell Order of ${
                      ReceivedData.OrderPlacedAmount
                    } TRO Placed`,
                    {
                      position: "right bottom",
                      className: "info"
                    }
                  );
                }
                if (data.TRO != 0) {
                  $.post(
                    "/api/SellBid",
                    {
                      User_ID: User_ID,
                      amount: parseFloat(data.TRO),
                      token: Submittedtoken,
                      SoldToken: "TRO_SPENDABLE"
                    },
                    function(ReceivedData) {
                      console.log("Second Callback Function");
                      if (ReceivedData.OrderExecutedFlag === true) {
                        for (Amount of ReceivedData.ExecutedOrders) {
                          $.notify(`Sell Order of ${Amount} TRO Executed`, {
                            position: "right bottom",
                            className: "success"
                          });
                        }
                        if (ReceivedData.OrderPlacedAmount != 0) {
                          $.notify(
                            `Sell Order of ${
                              ReceivedData.OrderPlacedAmount
                            } TRO Placed`,
                            {
                              position: "right bottom",
                              className: "info"
                            }
                          );
                        }
                      } else {
                        console.log("Error occured");
                        $.notify(
                          "Error Occured during Execution, " + ReceivedData.msg,
                          {
                            position: "right bottom",
                            className: "error"
                          }
                        );
                      }
                      SellOrderExecuting = false;
                      GetSellOrderBookOfUser();
                    }
                  );
                }
                SellOrderExecuting = false;
                GetSellOrderBookOfUser();
              } else {
                $.post(
                  "api/Rollback",
                  {
                    User_ID: User_ID,
                    amount: parseFloat(data.TRO),
                    token: "TRO_SPENDABLE"
                  },
                  function(msg) {
                    $.notify("Error Occured during Execution, " + msg.msg, {
                      position: "right bottom",
                      className: "error"
                    });
                  }
                );
                console.log("Error occured");
                console.log("Timer Reset");
                $("#timer").hide();
                $("#SellTroControls").show();
                clearInterval(TimerInterval);
                console.log("Checking and Executing Next Sell Order");
                if (TempSellOrderQueue.length != 0) ExecuteNextSellOrder();
              }
              SellOrderExecuting = false;
              GetSellOrderBookOfUser();
            }
          );
        } else {
          $.post(
            "/api/SellBid",
            {
              User_ID: User_ID,
              amount: parseFloat(data.TRO),
              token: Submittedtoken,
              SoldToken: "TRO_SPENDABLE"
            },
            function(ReceivedData) {
              console.log("Second Callback Function");
              if (ReceivedData.OrderExecutedFlag === true) {
                for (Amount of ReceivedData.ExecutedOrders) {
                  $.notify(`Sell Order of ${Amount} TRO Executed`, {
                    position: "right bottom",
                    className: "success"
                  });
                }
                if (ReceivedData.OrderPlacedAmount != 0) {
                  $.notify(
                    `Sell Order of ${
                      ReceivedData.OrderPlacedAmount
                    } TRO Placed`,
                    {
                      position: "right bottom",
                      className: "info"
                    }
                  );
                }
              } else {
                console.log("Error occured");
                $.notify("Error Occured during Execution", {
                  position: "right bottom",
                  className: "error"
                });
                console.log("Timer Reset");
                $("#timer").hide();
                $("#SellTroControls").show();
                clearInterval(TimerInterval);
                console.log("Checking and Executing Next Sell Order");
                if (TempSellOrderQueue.length != 0) ExecuteNextSellOrder();
              }
              SellOrderExecuting = false;
              GetSellOrderBookOfUser();
            }
          );
        }
      } else {
        SellOrderExecuting = false;
        $.notify("Insufficient Funds", {
          position: "right bottom",
          className: "error"
        });
        if (TempSellOrderQueue.length != 0) ExecuteNextSellOrder();
      }
    }
  );
}

$(function() {
  let SellSubmitButton = $("#Sell-Order-Submit");
  let SellOrderValueBox = $("#Sell-Order-Value-Box");
  SellSubmitButton.click(function() {
    let User_ID = LoggedinUserId;
    let SellOrderValue = SellOrderValueBox.val();
    if (SellOrderValue < 0.000001 || SellOrderValue > fuel_store_max) {
      $("#error-msg1").text(
        "Enter amount between 0.000001 and " + fuel_store_max
      );
      setTimeout(() => {
        $("#error-msg1").text("");
      }, 5000);
    } else {
      let Submittedtoken = [];
      if ($("#All-Tokens").is(":checked")) {
        Submittedtoken = ["BTC", "BCH", "ETH", "EOS", "LTC"];
      } else {
        $.each($("input[name='Specific-Token-Value']:checked"), function() {
          Submittedtoken.push($(this).val());
        });
      }
      if (TempSellOrderQueue.length == 0 && SellOrderExecuting == false) {
        console.log("Executing First Sell Order");
        ExecuteSellOrder(User_ID, SellOrderValue, Submittedtoken);
      } else {
        TempSellOrderQueue.push({
          User_ID: User_ID,
          SellOrderValue: SellOrderValue,
          Submittedtoken: Submittedtoken
        });
        console.log("Found Multiple Clicks, Pushing order onto Stack");
      }
    }
  });
});

function ExecuteNextBuyOrder() {
  ExecuteBuyOrder(
    TempBuyOrderQueue[0].User_ID,
    TempBuyOrderQueue[0].BuyOrderValue,
    TempBuyOrderQueue[0].Submittedtoken
  );
  TempBuyOrderQueue.shift();
}

function ExecuteBuyOrder(User_ID, BuyOrderValue, Submittedtoken) {
  BuyOrderExecuting = true;
  $.post(
    "api/CheckBalanceOfUserForBuyOrder",
    { User_ID: User_ID, Token: Submittedtoken[0], TroAmount: BuyOrderValue },
    function(data) {
      console.log("Inside First Callback Function");
      if (data.Status == true) {
        console.log("Order Submitted, Balance Freezed");
        $.notify("Buy Order Submitted", {
          position: "right bottom",
          className: "info",
          showAnimation: "slideDown"
        });
        $.post(
          "/api/BuyBid",
          {
            User_ID: User_ID,
            amount: BuyOrderValue,
            token: Submittedtoken,
            CurrencyAmount: data.CurrencyAmount
          },
          function(ReceivedData) {
            console.log("Inside Second Callback Function");
            if (ReceivedData.OrderExecutedFlag === true) {
              for (Amount of ReceivedData.ExecutedOrders) {
                $.notify(`Buy Order of ${Amount} TRO Executed`, {
                  position: "right bottom",
                  className: "success"
                });
              }
              if (ReceivedData.OrderPlacedAmount != 0) {
                $.notify(
                  `Buy Order of ${ReceivedData.OrderPlacedAmount} TRO Placed`,
                  {
                    position: "right bottom",
                    className: "info"
                  }
                );
              }
            } else {
              $.notify("Error Occured During Execution", {
                position: "right bottom",
                className: "error",
                showAnimation: "slideDown"
              });
            }
            BuyOrderExecuting = false;
            GetSellOrderBookOfUser(); 
            console.log("Checking and Executing Next Buy Order");
            if (TempBuyOrderQueue.length != 0) ExecuteNextBuyOrder();
          }
        );
      } else {
        BuyOrderExecuting = false;
        if (data.balance == false) {
          $.notify("Insufficient Balance", {
            position: "right bottom",
            className: "error"
          });
        } else {
          $.notify("Error Occured", {
            position: "right bottom",
            className: "error"
          });
        }

        if (TempBuyOrderQueue.length != 0) ExecuteNextBuyOrder();
      }
    }
  );
}

$(function() {
  let BuySubmitButton = $("#Buy-Order-Submit");
  let BuyOrderValueBox = $("#Buy-Order-Value-Box");
  BuySubmitButton.click(function() {
    let User_ID = LoggedinUserId;
    let BuyOrderValue = BuyOrderValueBox.val();
    if (BuyOrderValue < 0.000001) {
      $("#error-msg2").text("Enter amount Greater than 0.000001");
      setTimeout(() => {
        $("#error-msg2").text("");
      }, 5000);
    } else {
      let Submittedtoken = [];
      Submittedtoken.push($("input[name='Buy-Order-Option']:checked").val());
      if (TempBuyOrderQueue.length == 0 && BuyOrderExecuting == false) {
        console.log("Executing First Buy Order");
        ExecuteBuyOrder(User_ID, BuyOrderValue, Submittedtoken);
      } else {
        TempBuyOrderQueue.push({
          User_ID: User_ID,
          BuyOrderValue: BuyOrderValue,
          Submittedtoken: Submittedtoken
        });
        console.log("Multiple Clicks .... \n Pushing Orders onto Stack");
      }
    }
  });
});

function PrintSellOrderBookOfUser() {
  var Time;
  $("#Sell-Order-Book-div").empty();
  for (Order of SellOrderBookOfUser) {
    Time = new Date(Order.Time);
    Time = Time.toString().slice(0, 25);
    $(`#Sell-Order-Book-div`).append(
      `<tr id='${Order.OrderID}'><td>` +
        Order.TRO +
        "</td><td>" +
        Order.Token +
        "</td><td>" +
        Time +
        "</td></tr>"
    );
  }
}

function GetSellOrderBookOfUser() {
  $.post("/api/GetData", { UserID: LoggedinUserId }, OrderBook => {
    SellOrderBookOfUser = OrderBook;
    PrintSellOrderBookOfUser();
  });
}

$(function() {
  $.post("/api/GetData", { UserID: LoggedinUserId }, OrderBook => {
    SellOrderBookOfUser = OrderBook;
    PrintSellOrderBookOfUser();
    SetDefaultMarkers();
  });
});

$(function() {
  $('input[type="radio"]').click(function() {
    if ($(this).attr("id") == "Specific-Tokens") {
      $("#Specific-Tokens-Div").show();
      $("#Break").hide();
    } else {
      $("#Specific-Tokens-Div").hide();
      $("#Break").show();
    }
  });
});

for (WalletsPagePreference of WalletsPagePreferences) {
  var ObjString = JSON.stringify(WalletsPagePreference);
  WalletsPagePreferencesStringArray.push(ObjString);
}
WalletsPagePreferencesString = WalletsPagePreferencesStringArray.join("-");

function PrintDeposits() {
  var head = DepositTransactions.head;
  var Time;
  $("#Deposit-Transactions-div").empty();
  var x = 0;
  while (head) {
    Time = new Date(head.Time);
    Time = Time.toString().slice(0, 25);
    $(`#Deposit-Transactions-div`).append(
      `<tr id='Deposit-${x}'><td>` +
        Time +
        "</td><td>" +
        head.Token +
        `<img
        src="./img/` +
        head.Token +
        `.png"
        style="height:20px;width: auto;margin-left: 10px;"
      />` +
        "</td><td>" +
        head.Amount +
        "</td><td>" +
        head.Status +
        "</td><td>" +
        head.Reference +
        `<p class="float-right"><img id="${x}-Deposit-Clipboard"
        src="./img/` +
        `clipboard.png"
        style="height:20px;width: auto;margin-left: 10px;"
      /></p>` +
        "</td></tr>"
    );
    head = head.next;
    x++;
  }
}

function PrintWithdrawals() {
  var head = WithdrawalTransactions.head;
  var Time;
  $("#Withdrawal-Transactions-div").empty();
  var y = 0;
  while (head != null) {
    Time = new Date(head.Time);
    Time = Time.toString().slice(0, 25);
    $("#Withdrawal-Transactions-div").append(
      `<tr id='Withdrawal-${y}'><td>` +
        Time +
        "</td><td>" +
        head.Token +
        `<img
        src="./img/` +
        head.Token +
        `.png"
        style="height:20px;width: auto;margin-left: 10px;"
      />` +
        "</td><td>" +
        head.Amount +
        "</td><td>" +
        head.Status +
        "</td><td>" +
        head.Reference +
        `<p class="float-right"><img id="${y}-Withdrawal-Clipboard"
        src="./img/` +
        `clipboard.png"
        style="height:20px;width: auto;margin-left: 10px;"
      /></p>` +
        "</td></tr>"
    );
    head = head.next;
    y++;
  }
}

$(function() {
  $.post("api/GetDeposits", { LoggedinUserId: LoggedinUserId }, data => {
    DepositTransactions = data.DepositTransactions;
    PrintDeposits();
  });
  $.post("api/GetWithdrawals", { LoggedinUserId: LoggedinUserId }, data => {
    WithdrawalTransactions = data.WithdrawalTransactions;
    PrintWithdrawals();
  });
});

$(function() {
  $(`#Deposit-Transations-collapse`).on("click", "tr", function(e) {
    if ($(e.target).is("img")) {
    } else {
      var id = parseInt(
        $(this)
          .attr("id")
          .split("-")[1]
      );
      var count = 0;
      var head = DepositTransactions.head;
      while (head) {
        if (count === id) {
          break;
        }
        count++;
        head = head.next;
      }
      $("#Deposit-Transaction-Details").empty();
      $("#Deposit-Transaction-Details").append(
        `<p><strong>TOKEN : </strong><span style="color:rgb(74, 144, 226)">${
          head.Token
        }</span><img src="./img/` +
          `${head.Token}` +
          `.png"
          style="height:20px;width: auto;margin-left: 10px;"/></p>` +
          `<p><strong>AMOUNT : </strong><span style="color:rgb(74, 144, 226)">${
            head.Amount
          }</span></p>` +
          `<p><strong>STATUS : </strong><span style="color:rgb(74, 144, 226)">${
            head.Status
          }</span></p>` +
          `<p><strong>REFERENCE : </strong><span style="color:rgb(74, 144, 226)">${
            head.Reference
          }</span></p>` +
          `<p><strong>TIME : </strong><span style="color:rgb(74, 144, 226)">${
            head.Time
          }</span></p>` +
          `<p><strong>AMOUNT TRANSFERRED FROM : </strong><span style="color:rgb(74, 144, 226)">${
            head.address_from
          }</span></p>` +
          `<p><strong>AMOUNT TRANSFERRED TO : </strong><span style="color:rgb(74, 144, 226)">${
            head.address_to
          }</span></p>` +
          `<p><strong>FEES : </strong><span style="color:rgb(74, 144, 226)">${
            head.fee
          }</span></p>` +
          `<p><strong>BALANCE CREDITED : </strong><span style="color:rgb(74, 144, 226)">${
            head.balance_credited
          }</span></p>`
      );
      $("#Deposit-Transaction-Modal").modal("show");
    }
  });
});

$(function() {
  $(`#Withdrawal-Transations-collapse`).on("click", "tr", function(e) {
    if ($(e.target).is("img")) {
    } else {
      var id = parseInt(
        $(this)
          .attr("id")
          .split("-")[1]
      );
      var count = 0;
      var head = WithdrawalTransactions.head;
      while (head) {
        if (count === id) {
          break;
        }
        count++;
        head = head.next;
      }
      $("#Withdrawal-Transaction-Details").empty();
      $("#Withdrawal-Transaction-Details").append(
        `<p><strong>TOKEN : </strong><span style="color:rgb(74, 144, 226)">${
          head.Token
        }</span><img src="./img/` +
          `${head.Token}` +
          `.png"
          style="height:20px;width: auto;margin-left: 10px;"/></p>` +
          `<p><strong>AMOUNT : </strong><span style="color:rgb(74, 144, 226)">${
            head.Amount
          }</span></p>` +
          `<p><strong>STATUS : </strong><span style="color:rgb(74, 144, 226)">${
            head.Status
          }</span></p>` +
          `<p><strong>REFERENCE : </strong><span style="color:rgb(74, 144, 226)">${
            head.Reference
          }</span></p>` +
          `<p><strong>TIME : </strong><span style="color:rgb(74, 144, 226)">${
            head.Time
          }</span></p>` +
          `<p><strong>AMOUNT TRANSFERRED TO : </strong><span style="color:rgb(74, 144, 226)">${
            head.address_to
          }</span></p>` +
          `<p><strong>FEES : </strong><span style="color:rgb(74, 144, 226)">${
            head.fee
          }</span></p>`
      );
      $("#Withdrawal-Transaction-Modal").modal("show");
    }
  });
});

$(function() {
  $(`#Sell-Order-Book-collapse`).on("click", "tr", function(e) {
    
      var id = $(this).attr("id");
      let ClickedOrder;
      for(Order of SellOrderBookOfUser){
        if(Order.OrderID == id){
          ClickedOrder = Order;
          break;
        }
      }
      let Time = new Date(ClickedOrder.Time);
      Time = Time.toString().slice(0, 25);
      $("#Sell-Order-Details").empty();
      $("#Sell-Order-Details").append(
        `<p><strong>Order ID : </strong><span style="color:rgb(74, 144, 226)">${
          ClickedOrder.OrderID
        }</span></p>` +
          `<p><strong>AMOUNT : </strong><span style="color:rgb(74, 144, 226)">${
            ClickedOrder.TRO
          }</span></p>` +
          `<p><strong>Accepted Tokens : </strong><span style="color:rgb(74, 144, 226)">${
            ClickedOrder.Token
          }</span></p>` +
          `<p><strong>Time : </strong><span style="color:rgb(74, 144, 226)">${
            Time
          }</span></p>`
      );
      $("#Sell-Order-Modal").modal("show");
    
  });
});

function UpdateUserPreferenceInDatabase() {
  WalletsPagePreferencesStringArray = [];
  WalletsPagePreferencesString = null;
  for (WalletsPagePreference of WalletsPagePreferences) {
    var ObjString = JSON.stringify(WalletsPagePreference);
    WalletsPagePreferencesStringArray.push(ObjString);
  }
  WalletsPagePreferencesString = WalletsPagePreferencesStringArray.join("-");
  $.post(
    "api/UpdateNewPreferenceInDatabase",
    {
      LoggedinUserId: LoggedinUserId,
      Preference: WalletsPagePreferencesString
    },
    function() {
      console.log("Database Updated");
    }
  );
}

function HideThisWidgetInDatabase(CardName) {
  for (WalletsPagePreference of WalletsPagePreferences) {
    if (WalletsPagePreference.key == CardName) {
      WalletsPagePreference.value = "0";
    }
  }
  UpdateUserPreferenceInDatabase();
}

function ShowThisWidgetInDatabase(CardName) {
  for (WalletsPagePreference of WalletsPagePreferences) {
    if (WalletsPagePreference.key == CardName) {
      WalletsPagePreference.value = "1";
    }
  }
  UpdateUserPreferenceInDatabase();
}

function HideWallet(WalletName) {
  $(`.${WalletName}-Wallet`).hide();
  $("#Wallets-Panel").append(
    `<div id="${WalletName}-WalletPanel-logo-div"><img id="${WalletName}-WalletPanel-logo" class="WalletPanel-logos" data-trigger="hover" data-placement="left" data-content="${WalletName}" src="./img/${WalletName}.png"
      /></div>`
  );
  $('[data-trigger="hover"]').popover();
}

$(function() {
  $(".Close-Button").click(function() {
    var WalletName = $(this)
      .attr("id")
      .split("-")[0];
    HideWallet(WalletName);
    HideThisWidgetInDatabase(WalletName);
    CheckPanels();
  });
});

$(function() {
  $(".Widget-Close-Button").click(function() {
    var WidgetName = $(this)
      .attr("id")
      .split("-")[0];
    HideWidget(WidgetName);
    HideThisWidgetInDatabase(WidgetName);
    CheckPanels();
  });
});

function HideWidget(WidgetName) {
  $(`#${WidgetName}`).hide();
  $("#Left-Widget-Panel").append(
    `<div><img src="./img/${WidgetName}.png"
      id="${WidgetName}-LeftWidgetPanel-Widget" class="LeftWidgetPanel-Widgets" data-trigger="hover" data-placement="right" data-content="${WidgetName}"
      style="height:45px;width: auto;"
    /></div>`
  );
  $('[data-trigger="hover"]').popover();
}

$(function() {
  $(`#Wallets-Panel`).on("click", "img", function() {
    var WalletName = $(this)
      .attr("id")
      .split("-")[0];
    $(`.${WalletName}-Wallet`).show();
    $(this).hide();
    ShowThisWidgetInDatabase(WalletName);
    CheckPanels();
  });
});

$(function() {
  $(`#Left-Widget-Panel`).on("click", "img", function() {
    var WidgetName = $(this)
      .attr("id")
      .split("-")[0];
    $(`#${WidgetName}`).show();
    $(this).hide();
    ShowThisWidgetInDatabase(WidgetName);
    CheckPanels();
  });
});

$(function() {
  $("select.Deposit-Transaction-Filter-Dropdown").change(function() {
    var head = DepositTransactions.head;
    var selectedToken = $(this)
      .children("option:selected")
      .val();
    $("#Deposit-Transactions-div").empty();
    var x = 0;
    while (head) {
      if (selectedToken == "All") {
        $(`#Deposit-Transactions-div`).append(
          `<tr id='Deposit-${x}'><td>` +
            head.Time +
            "</td><td>" +
            head.Token +
            `<img
            src="./img/` +
            head.Token +
            `.png"
            style="height:20px;width: auto;margin-left: 10px;"
          />` +
            "</td><td>" +
            head.Amount +
            "</td><td>" +
            head.Status +
            "</td><td>" +
            head.Reference +
            `<p class="float-right"><img id="${x}-Deposit-Clipboard"
        src="./img/` +
            `clipboard.png"
        style="height:20px;width: auto;margin-left: 10px;"
      /></p>` +
            "</td></tr>"
        );
      } else if (head.Token === selectedToken) {
        $(`#Deposit-Transactions-div`).append(
          `<tr id='Deposit-${x}'><td>` +
            head.Time +
            "</td><td>" +
            head.Token +
            `<img
            src="./img/` +
            head.Token +
            `.png"
            style="height:20px;width: auto;margin-left: 10px;"
          />` +
            "</td><td>" +
            head.Amount +
            "</td><td>" +
            head.Status +
            "</td><td>" +
            head.Reference +
            `<p class="float-right"><img id="${x}-Deposit-Clipboard"
        src="./img/` +
            `clipboard.png"
        style="height:20px;width: auto;margin-left: 10px;"
      /></p>` +
            "</td></tr>"
        );
      }
      head = head.next;
      x++;
    }
  });
});

$(function() {
  $("select.Withdrawal-Transaction-Filter-Dropdown").change(function() {
    var head = WithdrawalTransactions.head;
    var selectedToken = $(this)
      .children("option:selected")
      .val();
    $("#Withdrawal-Transactions-div").empty();
    var x = 0;
    while (head) {
      if (selectedToken == "All") {
        $(`#Withdrawal-Transactions-div`).append(
          `<tr id='Withdrawal-${x}'><td>` +
            head.Time +
            "</td><td>" +
            head.Token +
            `<img
            src="./img/` +
            head.Token +
            `.png"
            style="height:20px;width: auto;margin-left: 10px;"
          />` +
            "</td><td>" +
            head.Amount +
            "</td><td>" +
            head.Status +
            "</td><td>" +
            head.Reference +
            `<p class="float-right"><img id="${x}-Withdrawal-Clipboard"
        src="./img/` +
            `clipboard.png"
        style="height:20px;width: auto;margin-left: 10px;"
      /></p>` +
            "</td></tr>"
        );
      } else if (head.Token === selectedToken) {
        $(`#Withdrawal-Transactions-div`).append(
          `<tr id='Withdrawal-${x}'><td>` +
            head.Time +
            "</td><td>" +
            head.Token +
            `<img
            src="./img/` +
            head.Token +
            `.png"
            style="height:20px;width: auto;margin-left: 10px;"
          />` +
            "</td><td>" +
            head.Amount +
            "</td><td>" +
            head.Status +
            "</td><td>" +
            head.Reference +
            `<p class="float-right"><img id="${x}-Withdrawal-Clipboard"
        src="./img/` +
            `clipboard.png"
        style="height:20px;width: auto;margin-left: 10px;"
      /></p>` +
            "</td></tr>"
        );
      }
      head = head.next;
      x++;
    }
  });
});

$(function() {
  $(`#Deposit-Transations-collapse`).on("click", "img", function(e) {
    if ($(e.target).is("img")) {
      var id = parseInt(
        $(this)
          .attr("id")
          .split("-")[0]
      );
      var head = DepositTransactions.head;
      var x = 0;
      while (head) {
        if (x == id) {
          var dummy = document.createElement("input");
          document.body.appendChild(dummy);
          dummy.setAttribute("value", head.Reference);
          dummy.select();
          document.execCommand("copy");
          document.body.removeChild(dummy);
          window.alert("Reference ID Copied to Clipboard");
          break;
        }
        head = head.next;
        x++;
      }
    }
  });
});

$(function() {
  $(`#Withdrawal-Transations-collapse`).on("click", "img", function(e) {
    if ($(e.target).is("img")) {
      var id = parseInt(
        $(this)
          .attr("id")
          .split("-")[0]
      );
      var head = WithdrawalTransactions.head;
      var x = 0;
      while (head) {
        if (x == id) {
          var dummy = document.createElement("input");
          document.body.appendChild(dummy);
          dummy.setAttribute("value", head.Reference);
          dummy.select();
          document.execCommand("copy");
          document.body.removeChild(dummy);
          window.alert("Reference ID Copied to Clipboard");
          break;
        }
        head = head.next;
        x++;
      }
    }
  });
});

function SearchWallets() {
  var WalletWidgetSearchBox = document.getElementById("Wallet-Widget-Search");
  var WalletSearched = WalletWidgetSearchBox.value.toUpperCase();

  var WalletsPanel = document.getElementById("Wallets-Panel");
  var WalletsPanelArray = WalletsPanel.children;

  for (var i = 0; i < WalletsPanelArray.length; i++) {
    if (WalletsPanelArray[i].tagName == "DIV" && WalletSearched) {
      var WalletName = $(WalletsPanelArray[i])
        .attr("id")
        .split("-")[0];
      if (WalletName.toUpperCase().indexOf(WalletSearched) > -1) {
        $(WalletsPanelArray[i]).removeClass("HideWalletWidget");
      } else {
        $(WalletsPanelArray[i]).addClass("HideWalletWidget");
      }
    } else if (!WalletSearched) {
      $(WalletsPanelArray[i]).removeClass("HideWalletWidget");
    }
  }
}

$(function() {
  $("#BTC-Chart").hide();
  $("#ETH-Chart").hide();
  $("#LTC-Chart").hide();
  $("#BCH-Chart").hide();
  $("#EOS-Chart").hide();

  $("#Add-Chart-Button").click(function() {
    var SelectedChart = $(".Charts-Filter-Dropdown-Button")
      .text()
      .split(" ")[0];
    $(`#${SelectedChart}-Chart`).show();
  });

  $("#Reset-Charts").click(function() {
    $("#BTC-Chart").hide();
    $("#ETH-Chart").hide();
    $("#LTC-Chart").hide();
    $("#BCH-Chart").hide();
    $("#EOS-Chart").hide();
  });

  $("#Charts-dropdown a").click(function() {
    $(".Charts-Filter-Dropdown-Button").text($(this).text());
  });
});

function SearchCharts() {
  var SearchBox = document.getElementById("Charts-Search");
  var SearchedChart = SearchBox.value.toUpperCase();
  var ChartsDropdown = document.getElementById("Charts-dropdown");
  var ChartsDropdownArray = ChartsDropdown.children;
  for (var i = 0; i < ChartsDropdownArray.length; i++) {
    if (
      $(ChartsDropdownArray[i])
        .text()
        .toUpperCase()
        .indexOf(SearchedChart) > -1
    ) {
      $(ChartsDropdownArray[i]).removeClass("HideToken");
    } else {
      $(ChartsDropdownArray[i]).addClass("HideToken");
    }
  }
}

function UpdateUserPreferences() {
  var count = 0;
  for (Preference of WalletsPagePreferences) {
    if (Preference.value == "0" && count <= 3) {
      HideWidget(Preference.key);
    } else if (Preference.value == "0") {
      HideWallet(Preference.key);
    }
    count++;
  }
}

function HideLeftpanel() {
  $("#Left-Widget-Panel-Div").hide();
  $("#StuffOne").addClass("col-md-12");
}

function ShowLeftPanel() {
  $("#StuffOne").removeClass("col-md-12");
  $("#Left-Widget-Panel-Div").show();
}

function HideRightPanel() {
  $("#Wallets-Panel").hide();
  $(".StuffTwo").addClass("col-md-12");
}

function ShowRightpanel() {
  $(".StuffTwo").removeClass("col-md-12");
  $("#Wallets-Panel").show();
}

function CheckPanels() {
  let HideLeftpanelFlag = true;
  let HideRightPanelFlag = true;
  for (var i = 0; i < 4; i++) {
    if (WalletsPagePreferences[i].value == "0") {
      HideLeftpanelFlag = false;
      break;
    }
  }
  for (var i = 4; i <= 8; i++) {
    if (WalletsPagePreferences[i].value == "0") {
      HideRightPanelFlag = false;
      break;
    }
  }
  if (HideLeftpanelFlag == true) HideLeftpanel();
  else ShowLeftPanel();
  if (HideRightPanelFlag == true) HideRightPanel();
  else ShowRightpanel();
}

$(function() {
  $.post(
    "api/GetWalletPageLayoutOfUser",
    { LoggedinUserId: LoggedinUserId },
    function(Layout) {
      if (Layout.length != 0) {
        WalletsPagePreferencesString = Layout[0].settings;
        WalletsPagePreferencesStringArray = WalletsPagePreferencesString.split(
          "-"
        );
        WalletsPagePreferences = [];
        for (WalletsPagePreference of WalletsPagePreferencesStringArray) {
          var PreferenceObj = JSON.parse(WalletsPagePreference);
          WalletsPagePreferences.push(PreferenceObj);
        }
        UpdateUserPreferences();
        CheckPanels();
      } else {
        $.post(
          "api/FirstTimeUserPreference",
          {
            LoggedinUserId: LoggedinUserId,
            Preference: WalletsPagePreferencesString
          },
          function() {
            console.log("First Default Preference Updated in Database");
          }
        );
      }
    }
  );
});

function SetMarker(OrderID){
  $("#line").append(
    `<span 
      id="${OrderID}-Marker-Div"
      class="marker-div" 
      style="left:95%;" 
      >
        <img src="./img/treos.png" 
          id="${OrderID}-marker" 
          class="marker"
          alt="Marker" 
          data-toggle="popover" 
          data-placement="top" 
          data-html = true
          data-content=""
        />
        <div id="${OrderID}-index" class="index" style="width: 50px;text-align:center;"></div>
    </span>`
  );
  MarkedOrders.push(Order.OrderID);
}

function SetDefaultMarkers() {
  $("#line").append(
    `<div id="0-circle" class="circle terminal" style="left:0%"></div>`
  );

  for(Order of SellOrderBookOfUser){
    var UniqueOrderId = Order.OrderID
    SetMarker(UniqueOrderId);
  }

  $("#line").append(
    `<div id="1-circle" class="circle terminal" style="left:100%"></div>`
  );
}

function UpdateMarkers(OrderBookLength) {
  console.log("Updating")
  for(OrderID of MarkedOrders){
    if(OrderIdArray.includes(OrderID)){
      for(Order of SellOrderBookOfUser){
        if(Order.OrderID == OrderID){
          var MarkerPosition = parseFloat(((Order.OrderIndex*100)/OrderBookLength).toFixed(2));
          if(MarkerPosition>95) MarkerPosition=95;
          else if(MarkerPosition<2) MarkerPosition=2;
          $(`#${OrderID}-Marker-Div`).css("left",`${MarkerPosition}%`);
          $(`#${OrderID}-index`).text(Order.OrderIndex);
          let Time = new Date(Order.Time);
          Time = Time.toString().slice(0, 25);
          $(`#${OrderID}-marker`).attr("data-content",`<div><p><strong>Order ID : </strong><span style="color:rgb(74, 144, 226)">${
            Order.OrderID
          }</span></p>` +
            `<p><strong>AMOUNT : </strong><span style="color:rgb(74, 144, 226)">${
              Order.TRO
            }</span></p>` +
            `<p><strong>Accepted Tokens : </strong><span style="color:rgb(74, 144, 226)">${
              Order.Token
            }</span></p>` +
            `<p><strong>Time : </strong><span style="color:rgb(74, 144, 226)">${
              Time
            }</span></p></div>`)
          break;
        }
      }
    }else{
      $(`#${OrderID}-Marker-Div`).css("left","2%");
      $(`#${OrderID}-index`).text("0");
    }
  }
  setTimeout(() => {
    for(OrderID of MarkedOrders){
      if($(`#${OrderID}-index`).text()=="0"){
        console.log("deleting")
        $(`#${OrderID}-Marker-Div`).remove();
      }
    }
  }, 5000);
}

$(function(){
  $("#CheckProgressButton").click(function(){
    $("#Timeline-Modal").modal("show");
    $('[data-toggle="popover"]').popover();
    $.post("/api/GetDataForTimeline", { UserID: LoggedinUserId }, data => {
      SellOrderBookOfUser = data.OrderBook;
      PrintSellOrderBookOfUser();
      OrderIdArray = [];
      for(Order of SellOrderBookOfUser){
        if(!MarkedOrders.includes(Order.OrderID)){
          SetMarker(Order.OrderID);
        }
        OrderIdArray.push(Order.OrderID);
      }
      setTimeout(() => {
        UpdateMarkers(data.OrderBookLength);
      }, 1000);
    });
  })

  $("#line").on("click","img",function() {
    $('.marker').not(this).popover('hide');
  });
})