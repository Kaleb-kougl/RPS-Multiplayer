$(document).ready(function() {
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
  let player; 

  // PLAYER CONNECTIONS
  connectedRef.on("value", function(snap) {
    if (snap.val()) {
      // Add user to the connections list.
      var con = connectionsRef.push(true);
      userId = con.key;
      // Remove user from the connection list when they disconnect.
      con.onDisconnect().remove();

      // call function to set player
      setPlayer();
    }
  });

  // DICTATE WHO IS PLAYING
  function setPlayer() {
    console.log('set player called');
    database.ref("/game").once('value', function(snapshot){
      let snap = snapshot.val();
      console.log(snap);
      if (snap.player1.userId === '') {
        alert("you are player 1")
        database.ref("/game/player1/userId").set(userId);
      } else if (snap.player2.userId === '') {
        alert('You are player 2');
        database.ref("/game/player2/userId").set(userId);
      } else {
        alert("you are waiting");
      }
    });
  }

  // initial values
  let name = "player";
  let move = "rock";

  // CHECK DB FOR SETUP
  database.ref("/game").on("value", function(snapshot) {
    // check if player data exists in the database or make it
    if (snapshot.child("player1").exists() || snapshot.child("player2").exists()) {

    } else {
      database.ref("/game").push({
        "player1": {
          name: name,
          move: move,
          userId: ''
        },
        "player2": {
          name: name,
          move: move,
          userId: ''
        }
      });
    }
  });


  // on submit set the inital values
  // needs to be changed to get player choice then set value in database
  $("#submit-choice").on("click", function(event) {
    database.ref("/game").set({
      "player1": {
        name: name,
        move: move,
        userId: ''
      },
      "player2": {
        name: name,
        move: move,
        userId: ''
      }
    });
  });
});