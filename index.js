import { create } from 'venom-bot'
import * as dotenv from 'dotenv'
import { Configuration, OpenAIApi } from "openai"
import axios from 'axios';
import chalk from 'chalk';
import {
    calcularPrecoPrazo,
    consultarCep,
    rastrearEncomendas,
  } from 'correios-brasil';

import midjourney from 'midjourney-client';

dotenv.config()
export const { log } = console;

const map1 = new Map();

map1.set("Objeto em trânsito - por favor aguarde","🚚");
map1.set("Objeto saiu para entrega ao destinatário","🙌");
map1.set("Objeto entregue ao destinatário","🎁");
map1.set("Pagamento confirmado","🤑");
map1.set("Aguardando o pagamento do despacho postal","💸");
map1.set("Objeto encaminhado para fiscalização aduaneira","🔎");
map1.set("Objeto recebido pelos correios do Brasil","🛬");
map1.set("Objeto postado","📦");
map1.set("DAFAULT","🚧");

export function getIcon(status) {
	return map1.get(status) || map1.get('DEFAULT');
}

create({
    session: 'Chat-GPT',
    multidevice: true
    })
    .then((client) => start(client))
    .catch((erro) => {
        console.log(erro);
    });

const configuration = new Configuration({
    organization: process.env.ORGANIZATION_ID,
    apiKey: process.env.OPENAI_KEY,
});

const openai = new OpenAIApi(configuration);


const getDavinciResponse = async (clientText) => {
    const options = {
        model: "text-davinci-003", // Modelo GPT a ser usado
        prompt: clientText, // Texto enviado pelo usuário
        temperature: 1, // Nível de variação das respostas geradas, 1 é o máximo
        max_tokens: 4000 // Quantidade de tokens (palavras) a serem retornadas pelo bot, 4000 é o máximo
    }

    try {
        const response = await openai.createCompletion(options)
        let botResponse = ""
        response.data.choices.forEach(({ text }) => {
            botResponse += text
        })
        return `🤖\n\n ${botResponse.trim()}`
    } catch (e) {
        //  OpenAI Response Error: ${e.response.data.error.message}
        return `🤖`
    }
}

const tracking = async (objNumber) => {

    try {
        console.log(objNumber)
        let codRastreio = []; // array de códigos de rastreios
        codRastreio.push(objNumber.trim())

        const response = await rastrearEncomendas(codRastreio)
      
        const events = response[0]?.eventos || [];
        let result = ''
        events?.reverse().forEach((event) => {
            const { descricao, dtHrCriado, unidade, unidadeDestino } = event;
    
            log(`==> ${getIcon(descricao)} ${chalk.bold(descricao)}`);
            log(chalk.blackBright(`Data: ${new Date(dtHrCriado).toLocaleString()}`));
            log(chalk.blackBright(`Local: ${unidade}`));
            
            result += `==> ${getIcon(descricao)} ${descricao}`
            result += `Data: ${new Date(dtHrCriado).toLocaleString()}`
            result += `Local: ${unidade}`

            if (unidadeDestino) {
                log(chalk.blackBright(`Indo para: ${unidadeDestino}`));
                result += chalk.blackBright(`Indo para: ${unidadeDestino}`)
            }
        });
        return result
    } catch (e) {
        //return `❌ OpenAI Response Error: ${e}`
        return `🤖`
    }
}

const sendEmailResponse = async (to,text,subject) => {
    try {

        var body = {
            to: to, // Modelo GPT a ser usado
            subject: subject, // Texto enviado pelo usuário
            text: text
        }
        //console.log(body)

        const response = await axios.post(
            'http://admin:admin@activemq.gerenciapedidos.com.br:8161/api/message?destination=queue://email.topic.send', 
            body);

        return `🤖\n\n email enviado!}`
    } catch (e) {
        //return `❌ OpenAI Response Error: ${e}`
        return `🤖`
    }
}

const getDalleResponse = async (clientText) => {
    const options = {
        prompt: clientText, // Descrição da imagem
        n: 1, // Número de imagens a serem geradas
        size: "1024x1024", // Tamanho da imagem
    }

    try {
        const response = await openai.createImage(options);
        return response.data.data[0].url
    } catch (e) {
       // return `❌ OpenAI Response Error: ${e}`
        return `🤖`
    }
}



const commands = (client, message) => {
    const iaCommands = {
        davinci3: "ita",
        dalle: "/img",
        email: "/email",
        rastreio: "/rastreio",
        midjourney: "/mid"
    }
    let msg = message.text;

    if (msg.toUpperCase().match(/ITA /)){
        getDavinciResponse(msg).then((response) => {
            console.log(msg)
            //console.log(response);
            /*
             * Faremos uma validação no message.from
             * para caso a gente envie um comando
             * a response não seja enviada para
             * nosso próprio número e sim para 
             * a pessoa ou grupo para o qual eu enviei
             */
           //client.sendText(message.from, response)
           client.sendText(message.from === process.env.BOT_NUMBER ? message.to : message.from, response)
        })
    } 

    if(msg.toUpperCase().match(/BOM DIA/) 
        || msg.toUpperCase().match(/BOA TARDE/)
        || msg.toUpperCase().match(/BOA NOITE/)){
        getDavinciResponse(msg).then((response) => {
            console.log(msg)
            //console.log(response);
            /*
             * Faremos uma validação no message.from
             * para caso a gente envie um comando
             * a response não seja enviada para
             * nosso próprio número e sim para 
             * a pessoa ou grupo para o qual eu enviei
             */
            //client.sendText(message.from, response)
           client.sendText(message.from === process.env.BOT_NUMBER ? message.to : message.from, response)
           //client.sendText(message.from === process.env.BOT_NUMBER ? message.to : message.from, response)
        })
    } 

    let firstWord = msg.substring(0, message.text.indexOf(" "));
    
    switch (firstWord) {
        case iaCommands.davinci3:
            const question = message.text.substring(message.text.indexOf(" "));
            getDavinciResponse(question).then((response) => {
                console.log(question)
                //console.log(response);
                /*
                 * Faremos uma validação no message.from
                 * para caso a gente envie um comando
                 * a response não seja enviada para
                 * nosso próprio número e sim para 
                 * a pessoa ou grupo para o qual eu enviei
                 */
                //client.sendText(message.from, response)
                    client.sendText(message.from === process.env.BOT_NUMBER ? message.to : message.from, response)
               // client.sendText(message.from === process.env.BOT_NUMBER ? message.to : message.from, response)
            })
            break;

        case iaCommands.dalle:
            const imgDescription = message.text.substring(message.text.indexOf(" "));
            getDalleResponse(imgDescription, message).then((imgUrl) => {
                client.sendImage(
                    message.from === process.env.BOT_NUMBER ? message.to : message.from,
                    imgUrl,
                    imgDescription,
                    'Imagem gerada pela IA🤖'
                )
            })
            break;
        case iaCommands.email:
            const bodyMessage = message.text.substring(message.text.indexOf("mensagem:"));
            const to = message.text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi);

            sendEmailResponse(to[0], bodyMessage, "Bot").then((response) => {
                client.sendText(message.from, response)
            })
            break;
        case iaCommands.rastreio:
            const trackingNumber = message.text.substring(message.text.indexOf(" "));

            tracking(trackingNumber).then((response) => {
                console.log(response)
                //client.sendText(message.from, JSON.stringify(response))
                client.sendText(message.from === process.env.BOT_NUMBER ? message.to : message.from, JSON.stringify(response))
            })
            break;
         case iaCommands.midjourney:
            const midCommand = message.text.substring(message.text.indexOf(" "));
            console.log("mid")
            midjourney(midCommand)
              .then((result)=>{
                console.log(result)
                client.sendImage(message.from === process.env.BOT_NUMBER ? message.to : message.from, result[0], "Imagem Gerada Midjourney")
              }).catch((error)=>{
                console.log(error)
              })
           
            //client.sendText(message.from === process.env.BOT_NUMBER ? message.to : message.from, )
            
            break;
    }
}

async function start(client) {
    client.onAnyMessage((message) => commands(client, message));
}
