import { create } from 'venom-bot'
import * as dotenv from 'dotenv'
import { Configuration, OpenAIApi } from "openai"

dotenv.config()
export const { log } = console;

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
        model: "text-davinci-003", // Modelo GPT a ser usado text-davinci-003"
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


const getDalleResponse = async (clientText) => {
    const options = {
        prompt: clientText, // Descrição da imagem
        n: 4, // Número de imagens a serem geradas
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



const commands = async(client, message) => {
    const iaCommands = {
        davinci3: "bot",
        dalle: "/img",
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
        
    }
}

async function start(client) {
    client.onAnyMessage((message) => commands(client, message)).catch((error)=>{
        console.log(error);
    });
}

