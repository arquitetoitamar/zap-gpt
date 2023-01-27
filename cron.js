import { create } from 'venom-bot'
import { parseCronExpression } from 'cron-schedule'
import * as dotenv from 'dotenv'


dotenv.config()

create({
    session: 'Chat-GPT',
    multidevice: true
})
    .then((client) => start(client))
    .catch((erro) => {
        console.log(erro);
    });


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
        return `❌ OpenAI Response Error: ${e}`
    }
}



const commands = (client, message) => {
    const iaCommands = {
        davinci3: "ita",
        dalle: "/img",
        email: "/email",
        rastreio: "/rastreio"
    }
    let msg = message.text;

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
            client.sendText(message.from, response)
           //client.sendText(message.from === process.env.BOT_NUMBER ? message.to : message.from, response)
        })
    } 

}

async function start(client) {
    client.onAnyMessage((message) => commands(client, message));
}
