import { Client, xrpToDrops, dropsToXrp } from "xrpl";
import React, { useEffect, useState } from "react";
import './index.css';

function App() {
  const [balance, setBalance] = useState(0);
  const [wallet, setWallet] = useState("");
  const [client] = useState(new Client("wss://s.altnet.rippletest.net:51233"));
  const [paymentButtonText, setPaymentButtonText] = useState(
    "Wait for the wallet to be funded..."
  );
  const [statusText, setStatusText] = useState("");
  const [logs, setLogs] = useState([]); // New state variable for logs

  useEffect(() => {
    console.log("start connection");
    client.connect().then(() => {
      console.log("connected");
      console.log("funding wallet");

      client.fundWallet().then((fund_result) => {
        console.log(fund_result);
        setBalance(fund_result.balance);
        setWallet(fund_result.wallet);
        setPaymentButtonText("Send a 22 XRP Payment!");
      });
    });
  }, []);

  async function sendPayment() {
    console.log("Creating a payment transaction");
    setLogs((prevLogs) => [...prevLogs, "Creating a payment transaction"]); // Add to logs
    setStatusText("Sending a payment for 22 XRP...");
    const tx = {
      TransactionType: "Payment",
      Account: wallet.address,
      Amount: xrpToDrops("22"),
      Destination: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe"
    };

    // Submit the transaction --------------------------------------------
    console.log("Submitting the transaction (Takes 3-5 seconds)");
    const submitted_tx = await client.submitAndWait(tx, {
      autofill: true, // Adds in fields that can be automatically set like fee and last_ledger_sequence
      wallet: wallet
    });

    // Check transaction results 
    console.log(
      "Transaction result:",
      submitted_tx.result.meta.TransactionResult
    );
    setLogs((prevLogs) => [...prevLogs, `Transaction result: ${submitted_tx.result.meta.TransactionResult}`]); // Add to logs
    setStatusText("Sent! (See logs for full details)");

    // Look up the new account balances by sending a request to the ledger
    const account_info = await client.request({
      command: "account_info",
      account: wallet.address
    });

    // See https://xrpl.org/account_info.html#account_info ---------------
    const balance = account_info.result.account_data.Balance;
    console.log(`New account balance: ${balance} drops`);
    setLogs((prevLogs) => [...prevLogs, `New account balance: ${balance} drops`]); // Add to logs
    setBalance(dropsToXrp(balance));
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl text-green-600 font-bold text-center">XRP Wallet</h1>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <p className="text-lg font-bold">The new wallet currently has {balance} XRP</p>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={sendPayment}>
          {paymentButtonText}
        </button>
        <p className="text-gray-500 p-4 ">Transaction History .....</p>
        <pre className="bg-gray-100 p-4 rounded-lg">
          {logs.map((log, index) => (
            <p key={index}>{log}</p>
          ))}
        </pre>
      </div>
    </div>
  );
}
export default App;
