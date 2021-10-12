const Discord = require("discord.js")

const fetch = require("node-fetch")
const client = new Discord.Client()

const puppeteer = require('puppeteer')
const cron = require("node-cron");

const fs = require('fs');
const path = require('path');

require('dotenv/config');

//  prod --> env.token
//  dev --> auth.json
var TokenDiscord = process.env.Token;

//  date
let ts = Date.now();
let date_ob = new Date(ts);
let month = date_ob.getMonth() + 1;
let year = date_ob.getFullYear();
let hours = date_ob.getHours();
let minutes = date_ob.getMinutes();

let automaticReply = false;

//  opens puppeteer and stores the print
const sendImage = async (client, dateNow, size) => {
  const browser = await puppeteer.launch({
    'args' : [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const defaultViewport = {
    height: 585,
    width: 815
  };

  const page = await browser.newPage()

  if (client === "easy"){
    await page.goto(process.env.EASY)
  }
  else if (client === "ideal"){
    await page.goto(process.env.IDEAL)
  }
  else if (client === "guide"){
    await page.goto(process.env.GUIDE)
  }
  else if (client === "terra"){
    await page.goto(process.env.TERRA)
  }
  else if (client === "terra-uat"){
    await page.goto(process.env.TERRA_UAT)
  }
  else if(client === 'ideal-uat'){
    await page.goto(process.env.IDEAL_UAT)
    await page.hover('.symbol.online')
  }
  
  // await page.waitForFunction('window.ready');

  if(size === "big"){
    const bodyHandle = await page.$('body');
    const boundingBox = await bodyHandle.boundingBox();
    const newViewport = {
        // width: Math.max(defaultViewport.width, Math.ceil(boundingBox.width)),
        height: Math.max(defaultViewport.height, Math.ceil(boundingBox.height)),
    };

    await page.setViewport(Object.assign({}, defaultViewport, newViewport));
  }
  else{
    await page.setViewport(defaultViewport);
  }

  await page.screenshot({path: './prints/print_' + client + "_" + dateNow + '.png'})

  await browser.close()
}

//  when the client is on
client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
})

// imediato
client.on("message", async msg => {
  if (msg.author.bot) return

  let message = msg.content.split(" ")

  if (message[0] === "$image") {
    if(['easy', 'ideal', 'ideal-uat', 'guide', 'terra', 'terra-uat'].includes(message[1]) != true){
      msg.channel.send("💾 || o cliente " + message[1] + " nao existe");
    }
    try {
      msg.channel.send("💾 || loading print... (cliente: " + message[1] + ')');
      await sendImage(message[1], hours + '-' + minutes, "regular")

      console.log('Print sent (' + message[1] + ')')
      msg.reply("💾 || here it is", {files: ['./prints/print_' + message[1] + "_" + hours + '-' + minutes + '.png']});

    } catch (error) {
      msg.channel.send("💾 || houve um erro :(... ( " + error + " )");

    }
  }
})

// imediato com height
client.on("message", async msg => {
  if (msg.author.bot) return

  let message = msg.content.split(" ")

  if (message[0] === "$bigImage") {
    if(['easy', 'ideal', 'ideal-uat', 'guide', 'terra'].includes(message[1]) != true){
      msg.channel.send("💾 || o cliente " + message[1] + " nao existe");
    }

    try {
      msg.channel.send("💾 || loading print... (cliente: " + message[1] + ')');

      await sendImage(message[1], hours + '-' + minutes, "big")
  
      console.log('Print sent (' + message[1] + ')')
      msg.reply("💾 || here it is", {files: ['./prints/print_' + message[1] + "_" + hours + '-' + minutes + '.png']});

    } catch (error) {
      msg.channel.send("💾 || houve um erro :(... ( " + error + " )");
    
    }
  }
})

// depois de 15 minutos
client.on("message", async msg => {
  if (msg.author.bot) return

  let message = msg.content.split(" ")

  if (message[0] === "$delay") {
    if(['easy', 'ideal', 'ideal-uat', 'guide', 'terra', 'terra-uat'].includes(message[1]) != true){
      msg.reply("💾 || o cliente " + message[1] + " nao existe");
    }

    try {
      msg.channel.send("💾 || loading print... (cliente: " + message[1] + ')');
      msg.channel.send("💾 || o print será enviado daqui 15 minutos!");
  
      setTimeout(async function(){
        await sendImage(message[1], hours + '-' + minutes, "regular");
      
        console.log('Print sent (' + message[1] + ')');
        msg.reply("💾 || here it is", {files: ['./prints/print_' + message[1] + "_" + hours + '-' + minutes + '.png']});
      }, 900000)
  
    } catch (error) {
      msg.channel.send("💾 || houve um erro :(... ( " + error + " )");
      
    }
  }
})

// depois de n
client.on("message", async msg => {
  if (msg.author.bot) return

  let message = msg.content.split(" ")

  if (message[0] === "$delayP") {
    if(['easy', 'ideal', 'ideal-uat', 'guide', 'terra', 'terra-uat'].includes(message[1]) != true){
      msg.reply("💾 || o cliente " + message[1] + " nao existe!");
    }

    if(!message[2]){
      msg.reply("💾 || especifique o delay em minutos!");
      return 0
    }

    try {
      delay = Number(message[2]) * 60000

      msg.channel.send("💾 || loading print... (cliente: " + message[1] + ')');
      msg.channel.send("💾 || o print será enviado daqui " + message[2] + " minuto(s)!");
  
      setTimeout(async function () { 
        await sendImage(message[1], hours + '-' + minutes, "regular"); 

        console.log('Print sent (' + message[1] + ')')
        msg.reply("💾 || here it is", {files: ['./prints/print_' + message[1] + "_" + hours + '-' + minutes + '.png']});
      }, delay)

    } catch (error) {
      msg.channel.send("💾 || houve um erro :(... ( " + error + " )");
      
    }
  }
})

// automático após mensagem do outro bot
client.on("message", async msg => {
  let message = msg.content.split("|")

  if (message[0] === "Name: UAT-06 15m * " && automaticReply == false) {
    await msg.channel.send("💾 || As respostas automáticas não estão ativadas...");
  }
  if (message[0] === "Name: UAT-06 15m * " && automaticReply == true) {
    try {
      await msg.react("👀");
      await msg.channel.send("💾 || loading print... (cliente: ideal-uat)");
  
      await sendImage("ideal-uat", hours + '-' + minutes, "regular")
  
      console.log('Print sent (ideal-uat)')
      msg.reply("💾 || here it is", {files: ['./prints/print_ideal-uat_' + hours + '-' + minutes + '.png']});
  
    } catch (error) {
      msg.channel.send("💾 || houve um erro :(... ( " + error + " )");
    
    }
  }
})

// ativa resposta automática após mensagem do outro bot
client.on("message", async msg => {

  if (msg.content === "$enable automaticReply") {
    try {
      await msg.react("✅");

      automaticReply = true;
      await msg.channel.send("💾 || Resposta automática ativadas!");

    } catch (error) {
      await msg.react("⛔");
      msg.channel.send("💾 || houve um erro :(... ( " + error + " )");
      
    }
  }

  if (msg.content === "$disable automaticReply") {
    try {
      await msg.react("✅");

      automaticReply = false;
      await msg.channel.send("💾 || Resposta automática desativada!");

    } catch (error) {
      await msg.react("⛔");
      msg.channel.send("💾 || houve um erro :(... ( " + error + " )");
      
    }
  }
})

//  all commands
client.on("message", msg => {
  if (msg.author.bot) return

  if (msg === "$help") {

    msg.channel.send("Esses são os comandos disponíveis: (sempre use o prefixo & na frente do comando)");
    msg.channel.send("```1. image + cliente --> retorna o print do monitor de um dos clientes. \n2. delay15 + cliente --> mesma funcionalidade do anterior, porém manda após 15 minutos (sinal de delay) \n3. delayP + cliente + tempo de delay em minutos--> mesma funcionalidade do anterior, porém manda após os minutos programados \n4. bigImage + cliente --> print da tela inteira```")
  }

})

// cron do bot --> remove os prints todo dia
cron.schedule('0 1 * * *', () => {
  console.log('Deleting prints...');

  fs.readdir('./prints', (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join('./prints', file), err => {
        if (err) console.log(err);
      });
    }
  });

  console.log('Deleted all prints! ');

}, {
  scheduled: true,
  timezone: "America/Sao_Paulo"
});

client.login(TokenDiscord);
