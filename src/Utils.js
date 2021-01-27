import firebase from 'firebase'

class Utils {
    getDefaultPicture = ()=> "https://workhound.com/wp-content/uploads/2017/05/placeholder-profile-pic.png"
   
    createTimestamp = (date) => firebase.firestore.Timestamp.fromDate(date)
    
    getChatInfo = (user, chat, contacts)=>{
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

    getMonths = ()=>{
        return  ["JANUARY", "FEBRAUARY", "MARCH", "APRIL",
         "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER",
        "OCTOBER", "NOVEMBER", "DECEMBER"]
    }

    isSameDay = (dateA, dateB)=>{
        return (dateA.getDate() === dateB.getDate() 
            && dateA.getMonth() === dateB.getMonth() 
            && dateA.getFullYear() === dateB.getFullYear())
    }

    getFullDate = (date) => `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`
    
    getTime =(date) => {
        let hrs = date.getHours()
        const meridian = hrs > 12 ? "pm" : "am"
        hrs = hrs > 12 ? hrs-12 : hrs
        return `${hrs}:${date.getMinutes()} ${meridian}`
    }

    getShortDate = (date)=>{
        const today = new Date()
        const yesterday = new Date(Date.now() - 864e5);

        if (this.isSameDay(date, today)) {
            // Less than One day
            return this.getTime(date)
        } else if (this.isSameDay(date, yesterday)) {
            return "Yesterday"
        } else {
            return this.getFullDate(date)
        }
    }

    getShortDateInWords = (date)=>{
        const today = new Date()
        const yesterday = new Date(Date.now() - 864e5);

        if (this.isSameDay(date, today)) {
            // Less than One day
            return "TODAY"
        } else if (this.isSameDay(date, yesterday)) {
            return "YESTERDAY"
        } else {
            return `${date.getDate()} ${this.getMonths()[date.getMonth()]} ${date.getFullYear()}`
        }
    }

}

const utils = new Utils()

export default utils