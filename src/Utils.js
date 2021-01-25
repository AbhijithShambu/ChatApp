

class Utils {
    getChatInfo(user, chat, contacts) {
        const chatInfo = {}
        if (chat.type == 'individual') {
            const chatUser = contacts[chat.participants.filter((participant)=>user.userId != participant).pop()]
            chatInfo['name'] = chatUser.name
            chatInfo["picture"] = chatUser.picture
            chatInfo['description'] = chatUser.description
            chatInfo['phone'] = chatUser.phone
        } else if (chat.type == 'group'){
            chatInfo['name'] = chat.name
            chatInfo["picture"] = chat.picture
            chatInfo['description'] = chat.description
        }
        return chatInfo
    }

    getFullDate = (date) => `${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`
    
    getTime =(date) => {
        let hrs = date.getHours()
        const meridian = hrs > 12 ? "pm" : "am"
        hrs = hrs > 12 ? hrs-12 : hrs
        return `${hrs}:${date.getMinutes()} ${meridian}`
    }

    getShortDate = (date)=>{
        const now = new Date(Date.now())
        const diff = Math.abs(now - date)
        if (diff < 86400000) {
            // Less than One day
            return this.getTime(date)
        } else if (diff < 172800000) {
            return "Yesterday"
        } else {
            return this.getFullDate(date)
        }
    }

}

const utils = new Utils()

export default utils