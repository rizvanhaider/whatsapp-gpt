require('dotenv').config();
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const { Client } = require("whatsapp-web.js");
const client = new Client({ puppeteer: { headless: true,args: ['--no-sandbox', '--disable-setuid-sandbox']} });

const { Configuration, OpenAIApi } = require("openai");

let CHAT_CONTEXT = "context/chat - " + new Date().getTime() + ".json";
let CONTACTS_FILE = "contacts.json";
let context = {};

const configuration = new Configuration({
    // replace your openai token below.
  apiKey: process.env.OPENAIA_API_KEY,
});

const openai = new OpenAIApi(configuration);

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.on("message", async (message) => {
  var msg = message;

  const contacts = await contactsToAutoRespond(CONTACTS_FILE);
  const isContact = contacts.filter((contact) => contact === message.from);
  if (message.from == isContact[0]) {
    try {
      console.log(message.from + " > " + message.body);

      askChatGPT(message.from, message.body).then(function (resp) {
        context[message.from] = context[message.from] + "\n" + resp;
        console.log("Replying: ", resp);
        client.sendMessage(
          msg.from,
          resp.replace("AI:", "").replace("Robot:", "")
        );
        savetoFile(CHAT_CONTEXT, context);
      },function(err){
        console.log("Error: ", err);
      });
    } catch (e) {
      console.log("ERR: ", e);
    }
  }
});

client.initialize();

async function askChatGPT(from, q) {
  context[from] === undefined
    ? (context[from] = "Human: " + q)
    : (context[from] = context[from] + "\n Human:" + q);
  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    temperature: 0.9,
    max_tokens: 150,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0.6,
    prompt: context[from],
    stop: [" Human:", " AI:"],
  });
  console.log("Q: ", context[from]);
  const resp = completion.data.choices[0].text;
  //   console.log(resp.toString());
  return resp;
}

function savetoFile(file, data) {
  fs.writeFile(file, JSON.stringify(data), (err) => {
    if (err) console.log("Error saving file: ", err);
  });
}

async function contactsToAutoRespond() {
  return new Promise((resolve, reject) => {
    fs.readFile("contacts.json", "utf8", (err, data) => {
      if (err) reject(err);
      else resolve(JSON.parse(data));
    });
  });
}
