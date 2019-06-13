const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "myuser",
  password: "mypass",
  database: "TRO_db"
});

connection.query(
  `CREATE TABLE IF NOT EXISTS treos_config_v2 (
    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    option_name varchar(50) NOT NULL,
    option_value varchar(250) NOT NULL,
    description varchar(250) NOT NULL,
    date datetime NOT NULL
  )`,
  function(err, results) {
    if (err) {
      console.error(err);
    } else {
      console.log("Treos_Config table created successfully");
    }
  }
);

connection.query(
  `CREATE TABLE IF NOT EXISTS treos_profile_token_balance (
    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    profile_id int(11) NOT NULL,
    token varchar(15) NOT NULL,
    balance double(255,8) NOT NULL
  )`,
  function(err, results) {
    if (err) {
      console.error(err);
    } else {
      console.log("Treos Profile Token Balance table created successfully");
    }
  }
);

connection.query(
  `CREATE TABLE IF NOT EXISTS treos_fifo_escrow_balance (
    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    profile_id int(11) NOT NULL,
    token varchar(15) NOT NULL,
    balance double(255,8) NOT NULL
  )`,
  function(err, results) {
    if (err) {
      console.error(err);
    } else {
      console.log("Treos FIFO Escrow Balance table created successfully");
    }
  }
);

connection.query(
  `CREATE TABLE IF NOT EXISTS treos_BuyOrderBook (
        Id INTEGER AUTO_INCREMENT NOT NULL PRIMARY KEY,
        OrderID VARCHAR(36) NOT NULL UNIQUE,
        User_ID INTEGER NOT NULL,
        TRO DOUBLE NOT NULL,
        Token VARCHAR(5) NOT NULL,
        Token_Amount DOUBLE NOT NULL,
        Time datetime NOT NULL
    )`,
  function(err, results) {
    if (err) {
      console.error(err);
    } else {
      console.log("Buy Order Book created successfully");
    }
  }
);

connection.query(
  `CREATE TABLE IF NOT EXISTS treos_SellOrderBook (
        Id INTEGER AUTO_INCREMENT NOT NULL PRIMARY KEY,
        OrderID VARCHAR(36) NOT NULL UNIQUE,
        User_ID INTEGER NOT NULL,
        TRO DOUBLE NOT NULL, 
        Type VARCHAR(20) NOT NULL,
        Token VARCHAR(50) NOT NULL,
        Time datetime NOT NULL
    )`,
  function(err, results) {
    if (err) {
      console.error(err);
    } else {
      console.log("Sell Order Book created successfully");
    }
  }
);

connection.query(
  `CREATE TABLE IF NOT EXISTS treos_SalesLedger (
        Id INTEGER AUTO_INCREMENT PRIMARY KEY,
        User_ID INTEGER NOT NULL,
        TYPE VARCHAR(5) NOT NULL,
        MatchedUserID INTEGER NOT NULL,
        TRO DOUBLE NOT NULL,
        SellTokenType VARCHAR(20) NOT NULL,
        Token VARCHAR(5) NOT NULL,
        tokenAmount DOUBLE NOT NULL,
        TransactionHash VARCHAR(100) NOT NULL,
        Time datetime NOT NULL
    )`,
  function(err, results) {
    if (err) {
      console.error(err);
    } else {
      console.log("Sales Ledger created successfully");
    }
  }
);

connection.query(
  `CREATE TABLE IF NOT EXISTS treos_ReserveWallet (
        Id INTEGER AUTO_INCREMENT NOT NULL PRIMARY KEY,
        Wallet_ID INTEGER NOT NULL UNIQUE,
        CompanyAddress VARCHAR(100) NOT NULL UNIQUE,
        TRO DOUBLE NOT NULL,
        TokenAccepted VARCHAR(50) NOT NULL
    )`,
  function(err, results) {
    if (err) {
      console.error(err);
    } else {
      console.log("Reserve Wallet created successfully");
    }
  }
);

connection.query(
  `CREATE TABLE IF NOT EXISTS treos_user_layout_preferences (
        user_layout_id INTEGER AUTO_INCREMENT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        treos_layout_id INTEGER NOT NULL,
        settings VARCHAR(100) NOT NULL DEFAULT 'Default',
        is_default tinyint(1) NOT NULL DEFAULT '0',
        is_active tinyint(1) NOT NULL DEFAULT '0',
        FOREIGN KEY (treos_layout_id) REFERENCES treos_layout(layout_id)
    )`,
  function(err, results) {
    if (err) {
      console.error(err);
    } else {
      console.log("Treos User Layout Preference table created successfully");
    }
  }
);

connection.query(
  `CREATE TABLE IF NOT EXISTS treos_layout (
        layout_id int(11) PRIMARY KEY,
        page_type VARCHAR(256) NOT NULL
    )`,
  function(err, results) {
    if (err) {
      console.error(err);
    } else {
      console.log("Treos Layout table created successfully");
    }
  }
);

connection.query(
  `CREATE TABLE IF NOT EXISTS treos_sell_order_Timer (
        User_ID INTEGER NOT NULL PRIMARY KEY,
        Time datetime NOT NULL
    )`,
  function(err, results) {
    if (err) {
      console.error(err);
    } else {
      console.log("Treos Sell Order Timer table created successfully");
    }
  }
);

connection.query(
  `CREATE TABLE IF NOT EXISTS treos_deposit (
    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    address_to varchar(250) NOT NULL,
    address_from varchar(100) NOT NULL,
    date datetime NOT NULL,
    member_id int(11) NOT NULL,
    currency varchar(10) NOT NULL,
    amount double(255,8) NOT NULL,
    status varchar(50) NOT NULL,
    txn_reference varchar(100) NOT NULL,
    fee double(255,8) NOT NULL,
    balance_credited int(11) NOT NULL,
    reference varchar(100) NOT NULL
  )`,
  function(err, results) {
    if (err) {
      console.error(err);
    } else {
      console.log("Treos_Deposit table created successfully");
    }
  }
);

connection.query(
  `CREATE TABLE IF NOT EXISTS treos_deposit_address (
    id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    date datetime NOT NULL,
    member_id int(11) NOT NULL,
    address varchar(250) NOT NULL,
    used int(11) NOT NULL,
    reference varchar(100) NOT NULL,
    token varchar(20) NOT NULL
  )`,
  function(err, results) {
    if (err) {
      console.error(err);
    } else {
      console.log("Treos Deposit Address table created successfully");
    }
  }
);

connection.query(
  `CREATE TABLE IF NOT EXISTS treos_withdrawal (
        id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        member_id int(11) NOT NULL,
        date datetime NOT NULL,
        address_to varchar(100) NOT NULL,
        currency varchar(10) NOT NULL,
        amount double(255,8) NOT NULL,
        status varchar(50) NOT NULL,
        fee double(255,8) NOT NULL,
        txn_reference varchar(250) NOT NULL
      )`,
  function(err, results) {
    if (err) {
      console.error(err);
    } else {
      console.log("Treos_Withdrawal table created successfully");
    }
  }
);

// Layout ID 1 Assigned to Wallets

// connection.query(
//   `INSERT INTO treos_layout VALUES (1,"Wallets");`
//   ,function(err, results) {
//     if (err) {
//       console.error(err);
//     } else {
//       console.log("Treos_user_layout_preferences table created successfully");
//     }
//   }
// )

function GetUserBalance(User_ID, token) {
  return new Promise(function(resolve, reject) {
    connection.query(
      `SELECT balance FROM treos_profile_token_balance WHERE ? AND ?`,
      [{ profile_id: User_ID }, { token: token }],
      function(err, rows, cols) {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

function GetTreosConfiguration() {
  return new Promise(function(resolve, reject) {
    connection.query(`SELECT * FROM treos_config_v2`, function(
      err,
      rows,
      cols
    ) {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function GetReserveOrders() {
  return new Promise(function(resolve, reject) {
    connection.query(`SELECT * FROM treos_ReserveWallet`, function(
      err,
      rows,
      cols
    ) {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function GetBuyOrderBook() {
  return new Promise(function(resolve, reject) {
    connection.query(`SELECT * FROM treos_BuyOrderBook`, function(
      err,
      rows,
      cols
    ) {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function UpdateBuyOrderBook(OrderID, Amount) {
  return new Promise(function(resolve, reject) {
    connection.beginTransaction(function(err, results) {
      if (err) {
        reject(err);
      } else {
        connection.query(
          `UPDATE treos_BuyOrderBook SET ? WHERE ?`,
          [{ TRO: Amount }, { OrderID: OrderID }],
          function(err, results) {
            if (err) {
              reject(err);
            } else {
              connection.commit(function(err) {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              });
            }
          }
        );
      }
    });
  });
}

function DeleteBuyOrder(OrderID) {
  return new Promise(function(resolve, reject) {
    connection.beginTransaction(function(err, results) {
      if (err) {
        reject(err);
      } else {
        connection.query(
          `DELETE FROM treos_BuyOrderBook WHERE ?`,
          [{ OrderID: OrderID }],
          function(err, results) {
            if (err) {
              reject(err);
            } else {
              connection.commit(function(err) {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              });
            }
          }
        );
      }
    });
  });
}

function GetSellOrderBook() {
  return new Promise(function(resolve, reject) {
    connection.query(`SELECT * FROM treos_SellOrderBook`, function(
      err,
      rows,
      cols
    ) {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function UpdateSellOrderBook(OrderID, Amount) {
  return new Promise(function(resolve, reject) {
    connection.beginTransaction(function(err, results) {
      if (err) {
        reject(err);
      } else {
        connection.query(
          `UPDATE treos_SellOrderBook SET ? WHERE ?`,
          [{ TRO: Amount }, { OrderID: OrderID }],
          function(err, results) {
            if (err) {
              reject(err);
            } else {
              connection.commit(function(err) {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              });
            }
          }
        );
      }
    });
  });
}

function DeleteSellOrder(OrderID) {
  return new Promise(function(resolve, reject) {
    connection.beginTransaction(function(err, results) {
      if (err) {
        reject(err);
      } else {
        connection.query(
          `DELETE FROM treos_SellOrderBook WHERE ?`,
          [{ OrderID: OrderID }],
          function(err, results) {
            if (err) {
              reject(err);
            } else {
              connection.commit(function(err) {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              });
            }
          }
        );
      }
    });
  });
}

function UpdateSalesLedger(
  User_ID,
  type,
  matchedUser_ID,
  amount,
  SellTokenType,
  token,
  tokenAmount,
  hash,
  date
) {
  connection.beginTransaction(function(err, results) {
    if (err) {
      reject(err);
    } else {
      connection.query(
        `INSERT INTO treos_SalesLedger (User_ID, TYPE, MatchedUserID, TRO, SellTokenType, Token, tokenAmount, TransactionHash, Time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          User_ID,
          type,
          matchedUser_ID,
          amount,
          SellTokenType,
          token,
          tokenAmount,
          hash,
          date
        ],
        function(err, results) {
          try {
            if (err) {
              throw err;
            } else {
              connection.commit(function(err) {
                try {
                  if (err) {
                    throw err;
                  } else {
                    console.log("Transaction Added to Ledger");
                  }
                } catch (err) {
                  console.log(err);
                }
              });
            }
          } catch (err) {
            console.log(err);
          }
        }
      );
    }
  });
}

function UpdateSellOrderTimer(User_ID) {
  var CurrentTime = new Date();
  connection.beginTransaction(function(err, results) {
    if (err) {
      reject(err);
    } else {
      connection.query(
        `INSERT INTO treos_sell_order_Timer (User_ID, Time) VALUES (?, ?) ON DUPLICATE KEY UPDATE Time=?`,
        [User_ID, CurrentTime, CurrentTime],
        function(err, rows, cols) {
          try {
            if (err) {
              throw err;
            } else {
              connection.commit(function(err) {
                try {
                  if (err) {
                    throw err;
                  } else {
                    console.log("Timer Updated");
                  }
                } catch (err) {
                  console.log(err);
                }
              });
            }
          } catch (err) {
            console.log(err);
          }
        }
      );
    }
  });
}

function GetSellOrderTimer(User_ID) {
  return new Promise(function(resolve, reject) {
    connection.query(
      `SELECT Time FROM treos_sell_order_Timer WHERE ?`,
      [{ User_ID: User_ID }],
      function(err, rows, cols) {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

function AddSellOrder(OrderID, User_ID, Amount, SoldToken, token, CurrentTime) {
  return new Promise(function(resolve, reject) {
    connection.beginTransaction(function(err, results) {
      if (err) {
        reject(err);
      } else {
        connection.query(
          `INSERT INTO treos_SellOrderBook (OrderID,User_ID,TRO,Type,Token,Time) VALUES (?,?,?,?,?,?)`,
          [OrderID, User_ID, Amount, SoldToken, token, CurrentTime],
          function(err, rows, cols) {
            if (err) {
              reject(err);
            } else {
              connection.commit(function(err) {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              });
            }
          }
        );
      }
    });
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
  return new Promise(function(resolve, reject) {
    connection.beginTransaction(function(err, results) {
      if (err) {
        reject(err);
      } else {
        connection.query(
          `INSERT INTO treos_BuyOrderBook (OrderID,User_ID,TRO,Token,Token_Amount,Time) VALUES (?,?,?,?,?,?)`,
          [OrderID, User_ID, Amount, token, tokenAmount, CurrentTime],
          function(err, rows, cols) {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              connection.commit(function(err) {
                if (err) {
                  reject();
                } else {
                  resolve();
                }
              });
            }
          }
        );
      }
    });
  });
}

function GetDeposits() {
  return new Promise(function(resolve, reject) {
    connection.query(`SELECT * FROM treos_deposit`, function(err, rows, cols) {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function GetDepositAddresses(UserID) {
  return new Promise(function(resolve, reject) {
    connection.query(
      `SELECT address,token FROM treos_deposit_address WHERE ?`,
      [{ member_id: UserID }],
      function(err, rows, cols) {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

function GetWithdrawals() {
  return new Promise(function(resolve, reject) {
    connection.query(`SELECT * FROM treos_withdrawal`, function(
      err,
      rows,
      cols
    ) {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function GetUserPreferences(UserID) {
  return new Promise(function(resolve, reject) {
    connection.query(
      `SELECT settings FROM treos_user_layout_preferences WHERE ? AND ? `,
      [{ user_id: UserID }, { treos_layout_id: 1 }],
      function(err, rows, cols) {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

function FirstTimeUserPreference(UserID, Preference) {
  return new Promise(function(resolve, reject) {
    connection.beginTransaction(function(err, results) {
      if (err) {
        reject(err);
      } else {
        connection.query(
          `INSERT INTO treos_user_layout_preferences (user_id,settings,is_default,is_active,treos_layout_id) VALUES (?,?,?,?,?)`,
          [UserID, Preference, 1, 1, 1],
          function(err, results) {
            if (err) {
              reject(err);
            } else {
              connection.commit(function(err) {
                if (err) {
                  reject();
                } else {
                  resolve();
                }
              });
            }
          }
        );
      }
    });
  });
}

function UpdateUserPreferences(UserID, Preference) {
  return new Promise(function(resolve, reject) {
    connection.beginTransaction(function(err, results) {
      if (err) {
        reject(err);
      } else {
        connection.query(
          `UPDATE treos_user_layout_preferences SET ? WHERE ? AND ?`,
          [
            { settings: Preference },
            { user_id: UserID },
            { treos_layout_id: 1 }
          ],
          function(err, results) {
            if (err) {
              reject(err);
            } else {
              connection.commit(function(err) {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              });
            }
          }
        );
      }
    });
  });
}

function PutBalanceInEscrow(User_ID, Token, Amount) {
  return new Promise(function(resolve, reject) {
    connection.beginTransaction(function(err, results) {
      if (err) {
        reject(err);
      } else {
        connection.query(
          `UPDATE treos_profile_token_balance SET balance = balance - ? WHERE ? AND ?`,
          [Amount, { profile_id: User_ID }, { token: Token }],
          function(err, results) {
            if (err) {
              connection.rollback(function() {
                console.log("Error Occured");
                reject(err);
              });
            } else {
              connection.query(
                `SELECT balance FROM treos_fifo_escrow_balance WHERE ? AND ? `,
                [{ profile_id: User_ID }, { token: Token }],
                function(err, rows, cols) {
                  if (err) {
                    connection.rollback(function() {
                      console.log("Error Occured");
                      reject(err);
                    });
                  } else {
                    if (rows.length == 0) {
                      connection.query(
                        `INSERT INTO treos_fifo_escrow_balance (profile_id,token,balance) VALUES (?,?,?)`,
                        [User_ID, Token, Amount],
                        function(err, results) {
                          if (err) {
                            connection.rollback(function() {
                              console.log("Error Occured");
                              reject(err);
                            });
                          } else {
                            connection.commit(function(err) {
                              if (err) {
                                connection.rollback(function() {
                                  console.log("Error Occured");
                                  reject(err);
                                });
                              } else {
                                resolve();
                              }
                            });
                          }
                        }
                      );
                    } else {
                      connection.query(
                        `UPDATE treos_fifo_escrow_balance SET balance = balance + ? WHERE ? AND ?`,
                        [Amount, { profile_id: User_ID }, { token: Token }],
                        function(err, results) {
                          if (err) {
                            connection.rollback(function() {
                              console.log("Error Occured");
                              reject(err);
                            });
                          } else {
                            connection.commit(function(err) {
                              if (err) {
                                connection.rollback(function() {
                                  console.log("Error Occured");
                                  reject(err);
                                });
                              } else {
                                resolve();
                              }
                            });
                          }
                        }
                      );
                    }
                  }
                }
              );
            }
          }
        );
      }
    });
  });
}

function GetSellOrdersOfUser(UserID) {
  return new Promise(function(resolve, reject) {
    connection.query(
      `SELECT TRO, Token, Time, OrderID FROM treos_SellOrderBook WHERE ?`,
      [{ User_ID: UserID }],
      function(err, rows, cols) {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

function TransferFunds(
  TroAmount,
  SenderId,
  ReceiverId,
  Token,
  ConvertedValue,
  SoldToken
) {
  return new Promise(function(resolve, reject) {
    console.log("|-- Transfering ... --|");
    connection.beginTransaction(function(err, results) {
      if (err) {
        reject(err);
      } else {
        connection.query(
          `UPDATE treos_fifo_escrow_balance SET balance = balance - ? WHERE ? AND ?`,
          [ConvertedValue, { profile_id: SenderId }, { token: Token }],
          function(err, results) {
            if (err) {
              connection.rollback(function() {
                console.log("Error Occured");
                reject(err);
              });
            } else {
              console.log("First Update Done");
              connection.query(
                `UPDATE treos_fifo_escrow_balance SET balance = balance - ? WHERE ? AND ?`,
                [TroAmount, { profile_id: ReceiverId }, { token: SoldToken }],
                function(err, results) {
                  if (err) {
                    connection.rollback(function() {
                      console.log("Error Occured");
                      reject(err);
                    });
                  } else {
                    console.log("Second Update Done");
                    var FirstPromise = new Promise(function(
                      Firstresolve,
                      Firstreject
                    ) {
                      connection.query(
                        `SELECT balance FROM treos_profile_token_balance WHERE ? AND ?`,
                        [{ profile_id: ReceiverId }, { token: Token }],
                        function(err, Firstrows, cols) {
                          if (err) {
                            connection.rollback(function() {
                              Firstreject(err);
                            });
                          } else {
                            if (Firstrows.length == 0) {
                              console.log("balance row not found");
                              connection.query(
                                `INSERT INTO treos_profile_token_balance (profile_id,token,balance) VALUES (?,?,?)`,
                                [
                                  ReceiverId,
                                  Token,
                                  ConvertedValue
                                ],
                                function(err, results) {
                                  if (err) {
                                    connection.rollback(function() {
                                      console.log("Error Occured");
                                      Firstreject(err);
                                    });
                                  } else {
                                    console.log("First Resolved");
                                    Firstresolve();
                                  }
                                }
                              );
                            } else {
                              console.log("Balance Found");
                              connection.query(
                                `UPDATE treos_profile_token_balance SET balance = balance + ? WHERE ? AND ?`,
                                [
                                  ConvertedValue,
                                  { profile_id: ReceiverId },
                                  { token: Token }
                                ],
                                function(err, results) {
                                  if (err) {
                                    connection.rollback(function() {
                                      console.log("Error Occured");
                                      Firstreject(err);
                                    });
                                  } else {
                                    console.log("First Resolved");
                                    Firstresolve();
                                  }
                                }
                              );
                            }
                          }
                        }
                      );
                    });
                    FirstPromise.then(() => {
                      var SecondPromise = new Promise(function(
                        SecondResolve,
                        SecondReject
                      ) {
                        connection.query(
                          `SELECT balance FROM treos_profile_token_balance WHERE ? AND ?`,
                          [
                            { profile_id: SenderId },
                            { token: "TRO_SPENDABLE" }
                          ],
                          function(err, secondRows, cols) {
                            if (err) {
                              connection.rollback(function() {
                                console.log("Error Occured");
                                SecondReject(err);
                              });
                            } else {
                              if (secondRows.length == 0) {
                                console.log("Balance Row not found");
                                connection.query(
                                  `INSERT INTO treos_profile_token_balance (profile_id,token,balance) VALUES (?,?,?)`,
                                  [
                                    SenderId,
                                    "TRO_SPENDABLE",
                                    TroAmount
                                  ],
                                  function(err, results) {
                                    if (err) {
                                      connection.rollback(function() {
                                        console.log("Error");
                                        SecondReject(err);
                                      });
                                    } else {
                                      console.log("Second Resolved");
                                      SecondResolve();
                                    }
                                  }
                                );
                              } else {
                                connection.query(
                                  `UPDATE treos_profile_token_balance SET balance = balance + ? WHERE ? AND ?`,
                                  [
                                    TroAmount,
                                    { profile_id: SenderId },
                                    { token: "TRO_SPENDABLE" }
                                  ],
                                  function(err, results) {
                                    if (err) {
                                      connection.rollback(function() {
                                        console.log("Error Occured");
                                        SecondReject(err);
                                      });
                                    } else {
                                      console.log("Resolved");
                                      SecondResolve();
                                    }
                                  }
                                );
                              }
                            }
                          }
                        );
                      });
                      SecondPromise.then(() => {
                        connection.commit(function(err) {
                          if (err) {
                            connection.rollback(function() {
                              console.log("Rollback Done");
                              reject(err);
                            });
                          } else {
                            console.log("Commit Successful");
                            resolve();
                          }
                        });
                      }).catch(() => {
                        connection.rollback(function() {
                          reject(err);
                        });
                      });
                    }).catch(() => {
                      connection.rollback(function() {
                        reject(err);
                      });
                    });
                  }
                }
              );
            }
          }
        );
      }
    });
  });
}

function TransferFundsFromReserveWallet(
  TroAmount,
  SenderId,
  ReceiverId,
  Token,
  ConvertedValue
) {
  return new Promise(function(resolve, reject) {
    connection.beginTransaction(function(err, results) {
      if (err) {
        reject(err);
      } else {
        connection.query(
          `UPDATE treos_fifo_escrow_balance SET balance = balance - ? WHERE ? AND ?`,
          [ConvertedValue, { profile_id: SenderId }, { token: Token }],
          function(err, results) {
            if (err) {
              connection.rollback(function() {
                reject(err);
              });
            } else {
              connection.query(
                `UPDATE treos_ReserveWallet SET TRO = TRO - ? WHERE ?`,
                [TroAmount, { Wallet_ID: ReceiverId }],
                function(err, results) {
                  if (err) {
                    connection.rollback(function() {
                      reject(err);
                    });
                  } else {
                    let FirstPromise = new Promise(function(
                      Firstresolve,
                      FirstReject
                    ) {
                      connection.query(
                        `SELECT balance FROM treos_profile_token_balance WHERE ? AND ?`,
                        [{ profile_id: ReceiverId }, { token: Token }],
                        function(err, FirstRows, FirstCols) {
                          if (err) {
                            connection.rollback(function() {
                              Firstreject(err);
                            });
                          } else {
                            if (FirstRows.length == 0) {
                              connection.query(
                                `INSERT INTO treos_profile_token_balance (profile_id,token,balance) VALUES (?,?,?)`,
                                [
                                  ReceiverId,
                                  Token,
                                  ConvertedValue
                                ],
                                function(err, results) {
                                  if (err) {
                                    connection.rollback(function() {
                                      FirstReject(err);
                                    });
                                  } else {
                                    Firstresolve();
                                  }
                                }
                              );
                            } else {
                              connection.query(
                                `UPDATE treos_profile_token_balance SET balance = balance + ? WHERE ? AND ?`,
                                [
                                  ConvertedValue,
                                  { profile_id: ReceiverId },
                                  { token: Token }
                                ],
                                function(err, results) {
                                  if (err) {
                                    connection.rollback(function() {
                                      FirstReject(err);
                                    });
                                  } else {
                                    Firstresolve();
                                  }
                                }
                              );
                            }
                          }
                        }
                      );
                    });

                    FirstPromise.then(() => {
                      var SecondPromise = new Promise(function(
                        SecondResolve,
                        SecondReject
                      ) {
                        connection.query(
                          `SELECT balance FROM treos_profile_token_balance WHERE ? AND ?`,
                          [
                            { profile_id: SenderId },
                            { token: "TRO_SPENDABLE" }
                          ],
                          function(err, SecondRows, SecondCols) {
                            if (err) {
                              connection.rollback(function() {
                                SecondReject(err);
                              });
                            } else {
                              if (SecondRows.length == 0) {
                                connection.query(
                                  `INSERT INTO treos_profile_token_balance (profile_id,token,balance) VALUES (?,?,?)`,
                                  [
                                    SenderId,
                                    "TRO_SPENDABLE",
                                    TroAmount
                                  ],
                                  function(err, results) {
                                    if (err) {
                                      connection.rollback(function() {
                                        SecondReject(err);
                                      });
                                    } else {
                                      SecondResolve();
                                    }
                                  }
                                );
                              } else {
                                connection.query(
                                  `UPDATE treos_profile_token_balance SET balance = balance + ? WHERE ? AND ?`,
                                  [
                                    TroAmount,
                                    { profile_id: SenderId },
                                    { token: "TRO_SPENDABLE" }
                                  ],
                                  function(err, results) {
                                    if (err) {
                                      connection.rollback(function() {
                                        SecondReject(err);
                                      });
                                    } else {
                                      SecondResolve();
                                    }
                                  }
                                );
                              }
                            }
                          }
                        );
                      });

                      SecondPromise.then(() => {
                        connection.commit(function(err) {
                          if (err) {
                            connection.rollback(function() {
                              reject(err);
                            });
                          } else {
                            resolve();
                          }
                        });
                      }).catch(() => {
                        connection.rollback(function() {
                          reject(err);
                        });
                      });
                    }).catch(() => {
                      connection.rollback(function() {
                        reject(err);
                      });
                    });
                  }
                }
              );
            }
          }
        );
      }
    });
  });
}

function RollbackTransaction(UserID, Amount, Token) {
  return new Promise(function(resolve, reject) {
    connection.beginTransaction(function(err, results) {
      if (err) {
        reject(err);
      } else {
        connection.query(
          `UPDATE treos_fifo_escrow_balance SET balance = balance - ? WHERE ? AND ?`,
          [Amount, { profile_id: UserID }, { token: Token }],
          function(err, results) {
            if (err) {
              connection.rollback(function() {
                reject(err);
              });
            } else {
              connection.query(
                `UPDATE treos_profile_token_balance SET balance = balance + ? WHERE ? AND ?`,
                [Amount, { profile_id: UserID }, { token: Token }],
                function(err, results) {
                  if (err) {
                    connection.rollback(function() {
                      reject(err);
                    });
                  } else {
                    connection.commit(function(err) {
                      if (err) {
                        connection.rollback(function() {
                          reject(err);
                        });
                      } else {
                        resolve();
                      }
                    });
                  }
                }
              );
            }
          }
        );
      }
    });
  });
}

exports = module.exports = {
  GetTreosConfiguration,
  GetUserBalance,
  GetBuyOrderBook,
  AddBuyOrder,
  UpdateBuyOrderBook,
  DeleteBuyOrder,
  GetSellOrderBook,
  AddSellOrder,
  UpdateSellOrderBook,
  DeleteSellOrder,
  UpdateSalesLedger,
  GetReserveOrders,
  UpdateSellOrderTimer,
  GetSellOrderTimer,
  GetDeposits,
  GetWithdrawals,
  GetUserPreferences,
  FirstTimeUserPreference,
  UpdateUserPreferences,
  GetDepositAddresses,
  PutBalanceInEscrow,
  TransferFunds,
  TransferFundsFromReserveWallet,
  GetSellOrdersOfUser,
  RollbackTransaction
};
