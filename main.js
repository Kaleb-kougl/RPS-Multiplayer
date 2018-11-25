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
  let player = 0;
  let currentlyPlaying = false;

  function startGame() {
    // CHECK DB FOR SETUP
  database.ref("/game").once("value", function(snapshot) {
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
  // PLAYER CONNECTIONS
  connectedRef.on("value", function(snap) {
    if (snap.val()) {
      // see how many people are connected
      database.ref("/connections").once('value', function(snapshot){
        let count = 0;
        for(var prop in snapshot.val()) {
            if (snapshot.val().hasOwnProperty(prop)) {
              ++count;
            }
        }
        // if its just 1 make sure the userId's are cleared
        if (count === 1) {
          database.ref("/game/player1/userId").set('');
          database.ref("/game/player2/userId").set('');
        }
      });
      // Add user to the connections list.
      var con = connectionsRef.push(true);
      userId = con.key;
      con.onDisconnect();
      // Remove user from the connection list when they disconnect.
      con.onDisconnect().remove();
      // call function to set player
      setPlayer();
    }
  });

  connectionsRef.on('child_removed', function(snapshot) {
    console.log("someone killed a child");
    console.log(snapshot['ref_'].key);
    if (player > 2) {
      player--;
      // alert(`now waiting for ${player}`)
      console.log(player);
    }
    let lostConnectionId = snapshot['ref_'].key;
    database.ref("/game").once('value', function(snapshot){
      let snap = snapshot.val();
      if (snap.player1.userId === lostConnectionId) {
        database.ref("/game/player1/userId").set('');
      } else if (snap.player2.userId === lostConnectionId) {
        database.ref("/game/player2/userId").set('');
      }
    });
  // when a player leaves assign someone from queue
   if (player <= 2 && currentlyPlaying === false) {
    setPlayer();
   };
  });

  // DICTATE WHO IS PLAYING
  function setPlayer() {
    console.log('set player called');
    database.ref("/game").once('value', function(snapshot){
      let snap = snapshot.val();
      if (snap.player1.userId === '') {
        alert("you are player 1")
        player = 1;
        database.ref("/game/player1/userId").set(userId);
        currentlyPlaying = true;
      } else if (snap.player2.userId === '') {
        alert('You are player 2');
        player = 2;
        database.ref("/game/player2/userId").set(userId);
        currentlyPlaying = true;
      } else if (player === 0) {
        console.log('not a player yet');
        let count = 0;
        database.ref("/connections").once('value', function(snapshot){
          for(var prop in snapshot.val()) {
              if (snapshot.val().hasOwnProperty(prop)) {
                ++count;
              }
          }
        });
        player = count;
        console.log(player);
      }
    });
  }

  // initial values
  let name = "player";
  let move = "";

  
  }

  function setUpGameScreen() {
    $('body').empty();
    let screen = $('<article>');
    screen.attr('class', 'container-fluid');
    screen.attr('class', 'game-screen');
    for (let i = 0; i < 3; i++) {
      let row = $('<div>');
      row.attr('class', 'row');
      row.attr('id', `r-${i}`);
      if (i < 2) {
        for (let j = 0; j < 3; j++) {
          let col = $('<div>');
          col.attr('class', 'col-4');
          col.attr('id', `c-${i}-${j}`);
          row.append(col);
        }
      }
      screen.append(row);
    }
    $('body').append(screen);
    $('#c-0-1').html(`<h1>Your Move!</h1>`);
    $('#c-1-0').html(`<button class='btn btn-primary'>Rock</button>`);
    $('#c-1-1').html(`<button class='btn btn-primary'>Paper</button>`);
    $('#c-1-2').html(`<button class='btn btn-primary'>Scissors</button>`);
  }

  // on submit set the inital values
  // needs to be changed to get player choice then set value in database
  $("#start-game").on("click", function(event) {
    startGame();
    setUpGameScreen();
  });

});