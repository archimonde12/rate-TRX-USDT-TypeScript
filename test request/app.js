const GRAPHQL_URL = "http://localhost:4000/";
let sendRequestProcess;
let start = document.getElementById("start");
let stop = document.getElementById("stop");
let send = document.getElementById("send");
let circle = document.getElementById("circle");
let request_number_value = document.getElementById("request_number_value");
let fixed_send = document.getElementById("fixed_send");
let totalResponse = 0;

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
  if (data.getTRXUSDTrate.message === "server response!") {
    totalResponse++;
  }
  console.log(totalResponse);
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
    setTimeout(() => {
      console.log("Send Request");
      sendRequestToServer();
    }, Math.random() * 200 * i);
  }
};

// let startSendRequest=setInterval(sendRequestToServer, 500);
start.onclick = startSendRequest;
send.onclick = sendRequestToServer;
stop.onclick = stopSendRequest;
fixed_send.onclick = startSendFixedRequest;
