import { create } from 'venom-bot'
import * as dotenv from 'dotenv'
import { Configuration, OpenAIApi } from "openai"
import axios from 'axios';


dotenv.config()

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
        return `Ita Bot🤖\n\n ${botResponse.trim()}`
    } catch (e) {
        return `❌ OpenAI Response Error: ${e.response.data.error.message}`
    }
}
const sendEmailResponse = async (to,text,subject) => {
    try {
        var body = {
            to: to, // Modelo GPT a ser usado
            subject: subject, // Texto enviado pelo usuário
            text: text
        }

        const response = await axios.post(
            'http://admin:admin@activemq.gerenciapedidos.com.br:8161/api/message?destination=queue://email.topic.send', 
            JSON.parse(body));

        return `Ita Bot🤖\n\n email enviado!}`
    } catch (e) {
        return `❌ OpenAI Response Error: ${e}`
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
        return `❌ OpenAI Response Error: ${e.response.data.error.message}`
    }
}



const commands = (client, message) => {
    const iaCommands = {
        davinci3: "ita",
        dalle: "/img",
        email: "/email"
    }

    let firstWord = message.text.substring(0, message.text.indexOf(" "));

    switch (firstWord) {
        case iaCommands.davinci3:
            const question = message.text.substring(message.text.indexOf(" "));
            getDavinciResponse(question).then((response) => {
                //console.log(response);
                /*
                 * Faremos uma validação no message.from
                 * para caso a gente envie um comando
                 * a response não seja enviada para
                 * nosso próprio número e sim para 
                 * a pessoa ou grupo para o qual eu enviei
                 */
                client.sendText(message.from, response)
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
            const bodyMessage = message.text.substring(message.text.indexOf("mensagem:") + 1);
            const to = message.text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi);

            sendEmailResponse(to, bodyMessage, "Bot").then((response) => {
                client.sendText(message.from, response)
            })
            break;
    }
}

async function start(client) {
    client.onAnyMessage((message) => commands(client, message));
}
