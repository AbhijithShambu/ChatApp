import { React, useEffect, useState } from 'react';
import './App.css';
import firestoreDB from './firestoreDB.js';

function App() {
  const [user, setUser] = useState({})
  const [chats, setChats] = useState([])

  useEffect(() => {
    const phone = 1111111111

    const db = firestoreDB()
    db.userInfo(phone).then((userInfo)=>{
      setUser(userInfo)
      console.log("UserInfo")
      console.log(userInfo)
      
      db.userChatsObserver(userInfo.id, phone, (chats)=>{
        setChats(chats)
        console.log("Chats:")
        console.log(chats)
      })
    })
    
  }, [])

  return (
    <div className="App">
      
    </div>
  );
}

export default App;
