// Initialize Firebase
var config = {
  apiKey: "AIzaSyDJOc-KuuzhQDTr5HQpjy7JADzxv02As_M",
  authDomain: "rps-multiplayer-825c3.firebaseapp.com",
  databaseURL: "https://rps-multiplayer-825c3.firebaseio.com",
  projectId: "rps-multiplayer-825c3",
  storageBucket: "rps-multiplayer-825c3.appspot.com",
  messagingSenderId: "149498190515"
};
firebase.initializeApp(config);
var database = firebase.database();

// All of our connections will be stored in this directory.
var connectionsRef = database.ref("/connections");
// builtin file that updates based on client's connection
var connectedRef = database.ref(".info/connected");

let userId; 

connectedRef.on("value", function(snap) {
  if (snap.val()) {
    // Add user to the connections list.
    var con = connectionsRef.push(true);
    userId = con.key;
    // Remove user from the connection list when they disconnect.
    con.onDisconnect().remove();
  }
});


// initial values
let name = "player";
let move = "rock";
