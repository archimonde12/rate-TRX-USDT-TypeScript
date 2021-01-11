const GRAPHQL_URL = "http://localhost:4000/";
let sendRequestProcess;
let start = document.getElementById("start");
let stop = document.getElementById("stop");
let send = document.getElementById("send");
let circle = document.getElementById("circle");
let numberRequest= document.getElementById("numberRequest");
let numberResponse= document.getElementById("numberResponse");
let request_number_value = document.getElementById("request_number_value");
let fixed_send = document.getElementById("fixed_send");
let totalRequest=0;
let totalResponse = 0;

const sendRequestToServer = async () => {
  totalRequest++
  numberRequest.innerHTML=totalRequest
  let res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: `
      query{
        testRequest
      }
    `,
    }),
  });
  const { data } = await res.json();
  if (data.testRequest === "Response") {
    totalResponse++;
  }

  numberResponse.innerHTML=totalResponse

  console.log(data);
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
