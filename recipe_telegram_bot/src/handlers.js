import { isUrl } from "./functions";

export async function handleMessage(ctx) {
    const textMessage = (ctx.update.message.text)

    if (!isUrl(textMessage)) {
        await ctx.reply("Il messaggio inviato non è un url valido")
        return;
    }

    await ctx.reply(`Ho ricevuto il seguente url:${textMessage}`)
}
