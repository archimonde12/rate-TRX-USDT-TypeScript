const GRAPHQL_URL = "http://localhost:4001/";
let sendRequestProcess;
let start = document.getElementById("start");
let stop = document.getElementById("stop");
let send = document.getElementById("send");
let circle = document.getElementById("circle");
let request_number_value = document.getElementById("request_number_value");
let fixed_send = document.getElementById("fixed_send");

const sendRequestToServer = async () => {
  let res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: `
      query {
        getTRXUSDTrate{
        success
        message
        rate
        update_at
        create_at
        }
    }`,
    }),
  });
  const { data } = await res.json();
  console.log(data.getTRXUSDTrate.message);
  return data;
};

const startSendRequest = () => {
  circle.style.backgroundColor = "green";
  clearInterval(sendRequestProcess);
  sendRequestProcess = setInterval(sendRequestToServer, 100);
};

const stopSendRequest = () => {
  clearInterval(sendRequestProcess);
  circle.style.backgroundColor = "gray";
};

const startSendFixedRequest = () => {
  let fixed = request_number_value.value;
  for (let i = 0; i < fixed; i++) {
    sendRequestToServer();
  }
};

// let startSendRequest=setInterval(sendRequestToServer, 500);
start.onclick = startSendRequest;
send.onclick = sendRequestToServer;
stop.onclick = stopSendRequest;
fixed_send.onclick = startSendFixedRequest;
