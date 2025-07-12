const ms = require("ms")
const { Chat } = require("../tools/schema")

const isGroupLimit = async (chatId) =>  {
     try {
         const chat = await Chat.findOne({ chatId })
         if (!chat) {
             const newChat = new Chat({ chatId })
             await newChat.save()
             return false
         }
         const currentTime = new Date().getTime()
         const limitGroup = chat.limitGroup
         if (currentTime >= limitGroup.time && limitGroup.time !== 0) {
            limitGroup.usage = 0
            limitGroup.time = 0
            await chat.save()
            return false
         } else if (limitGroup.usage >= limitGroup.main) {
            if (limitGroup.time === 0) {
                limitGroup.time = currentTime + ms('20m')
            }
            await chat.save()
            return true
        }
        return false
     } catch (error) {
         console.log(error)
         return false
     }
}

const addGroupLimit = async (chatId) => {
    try {
        const chat = await Chat.findOne({ chatId })
        if (!chat) {
            const newChat = new Chat({ chatId })
            await newChat.save()
            return;
        }
        chat.limitGroup.usage += 1
        await chat.save()
    } catch (error) {
        console.log(error)
    }
};

const getTimeGroup = async (chatId) => {
    try {
        const chat = await Chat.findOne({ chatId })
        if (!chat) {
            const newChat = new Chat({ chatId })
            await newChat.save()
            return;
        }
        const { limitGroup } = chat
        return limitGroup.time
    } catch (error) {
        console.log(error)
    }
}

module.exports = { isGroupLimit, addGroupLimit, getTimeGroup }
