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
  let choiceMade = false;
  let turn = false;
  let opponentMove;
  let yourMove;
  let yourMessage = '';
  let otherMessage = '';

  // DICTATE WHO IS PLAYING
  function setPlayer() {
    database.ref("/game").once('value', function(snapshot){
      let snap = snapshot.val();
      console.log(snap.player1.userId)
      if (snap.player1.userId === userId) {
        alert("you are player 1")
        player = 1;
        database.ref("/game/player1/userId").set(userId);
        database.ref("/game/player1/move").set('');
        currentlyPlaying = true;
        turn = true;
      } else if (snap.player2.userId === '') {
        alert('You are player 2');
        player = 2;
        database.ref("/game/player2/userId").set(userId);
        database.ref("/game/player2/move").set('');
        currentlyPlaying = true;
      } else if (player === 0) {
        console.log('not a player yet');
        let count = 0;
        database.ref("/connections").once('value', function(snapshot){
          for(var prop in snapshot.val()) {
            console.log(prop);
              if (snapshot.val().hasOwnProperty(prop)) {
                ++count;
              }
          }
        });
        player = count;
      }
      console.log(player);
    });
  }

  // CHECK DB FOR SETUP
  database.ref("/game").once("value", function(snapshot) {
    // check if player data exists in the database or make it
    if (snapshot.child("player1").exists() || snapshot.child("player2").exists()) {
      console.log(`player1 and player2 exists`);
      if(!snapshot.child("player1").child('userId').exists()){
        database.ref('/game/player1/userId').set('');
      }
      if(!snapshot.child('player2').child('userId').exists()) {
        database.ref('/game/player2/userId').set('');
      }
      if(!snapshot.child('player1').child('name').exists()){
        database.ref('/game/player1/name').set('');
      }
      if(!snapshot.child('player2').child('name').exists()){
        database.ref('/game/player2/name').set('');
      }
      if(!snapshot.child('player1').child('move').exists()){
        database.ref('/game/player1/move').set('');
      }
      if(!snapshot.child('player2').child('move').exists()){
        database.ref('/game/player2/move').set('');
      }
      if(!snapshot.child('player1').child('turn').exists()){
        database.ref('/game/player1/turn').set(true);
      }
      if(!snapshot.child('player2').child('turn').exists()){
        database.ref('/game/player2/turn').set(false);
      }
      if(!snapshot.child('player1').child('message').exists()){
        database.ref('/game/player1/message').set('');
      }
      if(!snapshot.child('player2').child('message').exists()){
        database.ref('/game/player2/message').set('');
      }
    } else {
      database.ref("/game").set({
        "player1": {
          name: '',
          move: '',
          userId: '',
          turn: true,
          message: ''
        },
        "player2": {
          name: '',
          move: '',
          userId: '',
          turn: false,
          message: ''
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
        console.log(`number of players:${count}`);
        player = count;
        // if its just 1 make sure the userId's are cleared
        if (count === 1) {
          database.ref("/game/player1/userId").set(userId);
          database.ref("/game/player2/userId").set('')
          database.ref('/game/player1/message').set('')
          .then(setPlayer())
        } else {
          setPlayer();
        }
      });
      // Add user to the connections list.
      var con = connectionsRef.push(true);
      userId = con.key;
      con.onDisconnect();
      // Remove user from the connection list when they disconnect.
      con.onDisconnect().remove();
    }
  });

  function startGame() {
    connectionsRef.on('child_removed', function(snapshot) {
      console.log("someone killed a child");
      console.log(snapshot['ref_'].key);
      if (player > 2) {
        player--;
      }
      let lostConnectionId = snapshot['ref_'].key;
      database.ref("/game").once('value', function(snapshot){
        let snap = snapshot.val();
        if (snap.player1.userId === lostConnectionId) {
          database.ref("/game/player1/userId").set('');
          database.ref("/game/player1/name").set('');
          database.ref("/game/player1/move").set('');
          database.ref("/game/player1/message").set('');
        } else if (snap.player2.userId === lostConnectionId) {
          database.ref("/game/player2/userId").set('');
          database.ref("/game/player2/name").set('');
          database.ref("/game/player2/move").set('');
          database.ref("/game/player2/message").set('');
        }
      });
    // when a player leaves assign someone from queue
    if (player <= 2 && currentlyPlaying === false) {
      setPlayer();
    };
    });
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
    $('#c-1-0').html(`<button class='btn btn-primary game-choice' data-choice='rock'>Rock</button>`);
    $('#c-1-1').html(`<button class='btn btn-primary game-choice' data-choice='paper'>Paper</button>`);
    $('#c-1-2').html(`<button class='btn btn-primary game-choice' data-choice='scissors'>Scissors</button>`);
    $('#r-2').html(`
    <div class="col-12" id="messager">
      <div id="your-message-container">Player1:<span id="your-message"></span>
      </div>
      <div id="other-message-container">Player2:<span id="other-message"></span>
      </div>
      <form>
      <input type="text" name="lname" placeholder="message" id="message-text">
      <input type="submit" value="Submit" id="message-submit">
      </form>
    </div>`);
    database.ref("/game").on('value', function(snapshot){
      let snap = snapshot.val();
      if (yourMessage !== snap.player1.message) {
        let newMessage = snap.player1.message;
        $('#your-message').text(newMessage);
      }
      if (otherMessage !== snap.player2.message) {
        let newMessage = snap.player2.message;
        $('#other-message').text(newMessage);
      }
    });
    $(document).on('click', '#message-submit', function(event) {
      event.preventDefault();
      let newMessage = $('#message-text').val();
      database.ref(`/game/player${player}/message`).set(newMessage);
    })
  }

  function compareChoices(yourMove=this.yourMove) {
    console.log(`yours: ${yourMove}`);
    let result;
    if (yourMove === 'scissors') {
      if (opponentMove === 'rock') {
        result = 'You lose!';
      } else if (opponentMove === 'paper') {
        result = 'You Win!';
      } else if (opponentMove === 'scissors') {
        result = 'Tie!';
      } else {
        result = 'something went wrong';
      }
    } else if (yourMove === 'rock') {
      if (opponentMove === 'paper') {
        result = 'You lose!';
      } else if (opponentMove === 'scissors') {
        result = 'You Win!';
      } else if (opponentMove === 'rock') {
        result = 'Tie!';
      } else {
        result = 'something went wrong';
      }
    } else if (yourMove === 'paper') {
      if (opponentMove === 'scissors') {
        result = 'You lose!';
      } else if (opponentMove === 'rock') {
        result = 'You Win!';
      } else if (opponentMove === 'paper') {
        result = 'Tie!';
      } else {
        result = 'something went wrong';
      }
    } else {
      console.log('something went wrong with your move');
    }
  $('#c-0-1').html(`<h1>${result}</h1>`);
  $(`#c-0-2`).html(`<button class="btn btn-secondary" id="reset-button">Reset</button>`)
  }

  // on submit set the inital values
  // needs to be changed to get player choice then set value in database
  $("#start-game").on("click", function(event) {
    startGame();
    setUpGameScreen();
    if (player === 2) {
      $('#c-0-1').html(`<h1>Waiting...</h1>`);
      database.ref("/game/player1/move").on('value', function(snapshot){
        console.log(snapshot.val());
        opponentMove = snapshot.val();
        // when the first player has moved then let p2 play
        if (snapshot.val() !== '') {
          turn = true;
          $('#c-0-1').html(`<h1>Your Turn!</h1>`);
        }
      });
    }
  });

  $(document).on('click', '.game-choice', function(event) {
    let choice = $(this).attr('data-choice');
    console.log(choice);
    database.ref("/game").once('value', function(snapshot){
      if (currentlyPlaying && !choiceMade && turn) {
        yourMove = choice;
        database.ref(`/game/player${player}/move`).set(choice);
        $('#c-0-1').html(`<h1>Waiting...</h1>`);
        choiceMade = true;
        console.log(yourMove);
        if (player === 2) {
          compareChoices(yourMove);
        }
      }
    });
// something is wrong here....
    if (player === 1) {
      database.ref("/game/player2/move").on('value', function(snapshot){
        if (snapshot.val() !== '') {
          opponentMove = snapshot.val();
          compareChoices(yourMove);
        }
      });
    } else if (player === 2) {
      database.ref("/game/player1/move").on('value', function(snapshot){
        if (snapshot.val() !== '') {
          console.log('stuff');
          opponentMove = snapshot.val();
          // compareChoices();
        }
      });
    } else {
      console.log('something went wrong. Try refreshing the page.')
    }
  });

  $(document).on('click', '#reset-button', function(event) {
    $(`#c-0-2`).empty();
    choiceMade = false;
    if (player === 1) {
      turn = true;
      database.ref("/game/player1/move").set('');
      $('#c-0-1').html(`<h1>Your turn!</h1>`);
    } else {
      turn = false;
      database.ref("/game/player2/move").set('');
      $('#c-0-1').html(`<h1>Waiting...</h1>`);
    }
  });

});