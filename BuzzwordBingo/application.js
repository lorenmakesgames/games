/*globals $:false */
/*jslint browser:true */
//http://buzzingo-uxds.ose.optum.com/

var isMenuOpen = false;
var isChatOpen = false;
var screenLocked = false;
$('.flex-menu').addClass('hidden');
$('.flex-menu__profile').addClass('hidden');
$('.flex-menu__new-game').addClass('hidden');
$('.flex-menu__endgame').addClass('hidden');
$('.prompt__add-word').addClass('hidden');
$('.prompt__room-code').addClass('hidden');
$('.flex-menu__back').addClass('hidden');
$('.prompt__signin-error').addClass('hidden');
$('.flex-menu__leaderboard').addClass('hidden');
$('.roomkey-alert').addClass('hidden');
$('.title__roomkey').addClass('hidden');
$('.new-game-button').css({'display':'none'});
$('.add-word-button').css({'display':'none'});
$('.leaderboard-button').css({'display':'none'});
$('.profile-button').css({'display':'none'});
$('.prompt input[type="text"]').val('');

$(document).ready(function () {


    //Check if url contains Optum
    if(window.location.href.indexOf("optum") > -1) {
        //Leave the logo
    }
    else{
        $('.flex-logo').remove();
    }

    var currentRoom = "";
    $('.docs-grid-item').addClass("hvr-pop");

    function start_listening(){
        var user = firebase.auth().currentUser;
        var uid = user.uid;
        var ref = firebase.database().ref("Users/" + uid);
        ref.on('child_changed', function(data){
            if (data.key == "games_played"){

                //new gamesplayed = data.val()
                $('.games-played').html(data.val());
            }

            else if (data.key =="total_score"){
                //new total = data.val()
                $('.tot-points').html(data.val());
            }

            else if (data.key == "games_won"){
                //new gameswon = data.val()
                $('.games-won').html(data.val());
            }
        });
    }

    //chat visibility listener
    var visibility = window.matchMedia("screen and (min-width: 800px)");
    chatVisibility(visibility);
    visibility.addListener(chatVisibility);

    function chatVisibility(visibility){
        if(visibility.matches){
            $('.flex-chat').removeClass('hidden');
            $('.flex-chat').css({
                'width': '40%',
                'height': '100%',
                'position': 'relative',
                'top': '0',
                'left': '0'
            });
        }
        else{
            $('.flex-chat').addClass('hidden');
            $('.flex-chat').css({
                'position': 'absolute',
                'top': '100px',
                'left':'0px',
                'width': '100%',
                'height': 'inherit',
                'z-index': '2'
            });
        }
    }


    function listen_to_chat(){
        console.log('listening to chat');
        var newMessage = '';
        var ref = firebase.database().ref('Rooms/' + currentRoom).child('Messages');
        ref.on('child_added', function(data){
            var sender = data.child('sender').val();
            if(data.hasChild('message')){
                var message = data.child('message').val();
                newMessage = '<p class="message"> <span class="chat-name">' + sender + ': </span>' + message + '</p>';
            }
            else if(data.hasChild('alert')){
                var wordAlert = data.child('alert').val();
                newMessage = '<p class="chat-alert"> <span class="chat-name">' + sender + '</span>' + wordAlert + '</p>';
            }
            $('.flex-chat__messages').append(newMessage);
            $(".flex-chat__body").scrollTop($(".flex-chat__body").children().height());
            if($('.flex-chat').hasClass('hidden')){
                $('.chat-icon').addClass('message-notification');
            }
        });
        if($('.chat-icon').hasClass('message-notification')){
            $('.chat-icon').on('click', function(){
                $('.chat-icon').removeClass('message-notification');
            });
        }
    }

    var player_added;
    var player_removed;
    function listen_to_players(){
        //Setup a child added fucntion
        var ref = firebase.database().ref().child('Rooms').child(currentRoom).child('players');
        player_added = ref.on('child_added', function(data){
            //In the Room
            $('#join-player-list').append('<li><p>' + data.val().username + '</p></li>');
        });

        player_removed = ref.on('child_removed', function(data){
            //Just reload the list
            var list = $('#join-player-list');
            list.html('');
            ref.once('value', function(data){
                data.forEach(function(childsnap){
                    list.append('<li><p>' + childsnap.val().username + '</p></li>');
                });
            });
        });
    }

    function rank_update(total_score){
        if(total_score >= 0 && total_score < 25){
            playerRank = "End User";
        }
        else if(total_score >= 25 && total_score < 200){
            playerRank = "Promising Candidate";
        }
        else if(total_score >= 200 && total_score < 750){
            playerRank = "Well-Positioned";
        }
        else if(total_score >= 750 && total_score < 2000){
            playerRank = "Problem Solver";
        }
        else if(total_score >= 2000 && total_score < 4000){
            playerRank = "Valued Asset";
        }
        else if(total_score >= 4000 && total_score < 8000){
            playerRank = "Mission Critical";
        }
        else if(total_score >= 8000 && total_score < 20000){
            playerRank = "Game Changer";
        }
        else if(total_score >= 20000 && total_score < 50000){
            playerRank = "Corporate Prodigy";
        }
        else if(total_score >= 50000 && total_score < 100000){
            playerRank = "Business Guru";
        }
        else if(total_score >= 100000){
            playerRank = "Top Dog";
        }

        return playerRank;
    }

    function listen_to_room(){
        console.log("starting to listen");
        var ref = firebase.database().ref("Rooms/" + currentRoom);
        ref.on('child_changed', function(data){
            //get my username

        if(data.key === "winner"){
            var my_username = firebase.database().ref("Users/" + firebase.auth().currentUser.uid + "/username" );
            my_username.once('value', function(my_name){
                if ((data.val() !== "") && (data.val() !== my_name.val())){
                    console.log(data.val() + " won the game!");
                    $('.winner-name').html(data.val());
                    endGame();
                }

                else{
                    console.log("you won the game!!!");
                    $('.winner-name').html("You");
                    //Dont need endgame here because it is already called automatically
                }
            });
          }
        });
    }
   var playerRank = "End User";

    var localWin = false;
    var currentlyPlaying = false;

    function display_back() {
        if (isMenuOpen === true || bingo === true) {
            $('.flex-app__main').css({
                'opacity': '.2'
            });
            $('.flex-chat').css({
                'opacity': '.2'
            });
            screenLocked = true;
        } else {
            $('.flex-app__main').css({
                'opacity': '1'
            });
            $('.flex-chat').css({
                'opacity': '1'
            });
            screenLocked = false;
        }

    }

  var wordsArray = [];
  var roomArray = [];
  var initialArray = [];

  jQuery.ajaxSetup({
        cache: false
  });

    var just_started = true;
    function openMenu() {
        if ((isMenuOpen === false) && (just_started === false)) {
            isMenuOpen = true;
            $('.flex-menu-wrapper').css({'z-index':'1'});
            $('.flex-app').css({'z-index':'0'});
            $('.flex-menu').removeClass('hidden');
            $('.flex-menu__main').removeClass('hidden');
            $('.flex-menu__back').addClass('hidden');
            $('.flex-menu__action').removeClass('hidden');
            $('.new-game-button').css({'display':'block'});
            $('.add-word-button').css({'display':'block'});
            $('.leaderboard-button').css({'display':'block'});
            $('.profile-button').css({'display':'block'});
            display_back();
        }

        else{
            //When you start the game, just displays sign in or sign up
            isMenuOpen = true;
          //  just_started = false;
            $('.flex-menu').removeClass('hidden');
            $('.flex-menu__main').removeClass('hidden');
            display_back();

        }
    }

    openMenu();

    $('.flex-menu__main').on('click', '.new-game-button', function () {
        $('.flex-menu__main').addClass('hidden'); //fix fade-out fade-in
        $('.flex-menu__new-game').removeClass('hidden');
        $('.flex-menu__back').removeClass('hidden');

    });

    $('.flex-menu__main').on('click', '.add-word-button', function () {
        $('.flex-menu__main').addClass('hidden'); //fix fade-out fade-in
        $('.flex-menu__back').removeClass('hidden');
        $('.prompt__add-word').removeClass('hidden');
        $('.prompt__add-word__confirm').addClass('hidden');
        $('#text-field-2').val('');

        var newWord = "";
        $('.prompt__add-word').on('click', '.submit', function (event) {
            event.preventDefault();
            event.stopImmediatePropagation();
            $('.prompt__add-word').trigger('submit');

            //Add the word to firebase
            newWord = $('#text-field-2').val();
            var currentDate = new Date().getTime();
            //console.log(new Date(currentDate));
            firebase.database().ref().child('Words/'+ newWord).set({
                count: 1,
                userId: firebase.auth().currentUser.uid,
                date: currentDate
            });
            $('.prompt__add-word__confirm').removeClass('hidden');
        });

    });


    //When you tap sign in
    $('.prompt__signin').on('click', '.submit', function(){

        var email = $('#text-field-email').val();
        var password = $('#text-field-password').val();

        //sign in the user
            firebase.auth().signInWithEmailAndPassword(email, password).then(function(){
                console.log("Sign in was successful");
                var current = firebase.auth().currentUser;
                var uid = current.uid;

                //Update profile page
                var ref = firebase.database().ref("Users/" + uid );
                ref.once('value', function(snapshot){
                    snapshot.forEach(function(childsnap){
                        if (childsnap.key == "games_played"){

                        //new gamesplayed = data.val()
                        $('.games-played').html(childsnap.val());
                        }

                        else if (childsnap.key =="total_score"){
                            //new total = data.val()
                            $('.tot-points').html(childsnap.val());
                        }

                        else if (childsnap.key == "games_won"){
                            //new gameswon = data.val()
                            $('.games-won').html(childsnap.val());
                        }
                        else if(childsnap.key == "rank"){
                            $('.user-rank').html(childsnap.val());
                        }


                    });
                });

                 start_listening();
                //Open actual menu
                just_started = false;
                isMenuOpen = false;
                openMenu();
                $('.prompt__signin').addClass('hidden');
                $('.prompt__register').addClass('hidden');
                $('.prompt__signin-error').addClass('hidden');

            }, function(error){

                console.log(error.code);
                $('.prompt__signin-error').text("Invalid Username/Password");
                $('.prompt__signin-error').removeClass('hidden');
        });


    });

    //When you tap sign up
        $('.prompt__register').on('click', '.submit', function(){

        var email = $('#text-field-email-register').val();
        var password = $('#text-field-password-register').val();
        var username =  $('#text-field-username-register').val();

        //register and sign up the user
        firebase.auth().createUserWithEmailAndPassword(email, password).then(function(){

            //Signup was successful

            //Now automatically sign in the user and put him into users table
            firebase.auth().signInWithEmailAndPassword(email, password).then(function(){

                //Get the uuid of the user and append him to users table with other user info
                var thisUser = firebase.auth().currentUser;
                var uuid = thisUser.uid;

                //Append the user
                var usersRef = firebase.database().ref().child('Users').child(uuid);
                usersRef.set({
                    username:username,
                    email:email,
                    rank:playerRank,
                    total_score:0,
                    games_played: 0,
                    games_won: 0
                });

                //Update profile page
                //new gamesplayed = data.val()
                $('.games-played').html(0);

                //new total = data.val()
                $('.tot-points').html(0);


                //new gameswon = data.val()
                $('.games-won').html(0);



                //start listening
                start_listening();
                //Open actual menu
                just_started = false;
                isMenuOpen = false;
                openMenu();
                $('.prompt__signin').addClass('hidden');
                $('.prompt__register').addClass('hidden');
                $('.prompt__signin-error').addClass('hidden');

            }, function(error){

                console.log(error.code);
        });



        }, function(error){
            $('.prompt__signin-error').text(error.message);
            $('.prompt__signin-error').removeClass('hidden');
            console.log(error.code);
            console.log(error);
    });

    });
    $('.flex-menu__main').on('click', '.leaderboard-button', function () {

        $('.flex-menu__main').addClass('hidden');
        $('.flex-menu__leaderboard').removeClass('hidden');
        $('#leaderboard_list').removeClass('hidden');
        $('#top-words_list').addClass('hidden');
        $('.flex-menu__back').removeClass('hidden');

    });

    $('.top-list-switch').on('click', function(){
        $('#top-words_list').toggleClass('hidden');
        $('#leaderboard_list').toggleClass('hidden');
        if($('#leaderboard_list').is(':visible')){
            $('#leaderboard_header').text("Leaderboard");
            $('.top-list-switch').text("W");
        }
        else if($('#top-words_list').is(':visible')){
            $('#leaderboard_header').text("Top Words");
            $('.top-list-switch').text("L");
        }
    });

    $('.flex-menu__main').on('click', '.profile-button', function () {

        $('.flex-menu__main').addClass('hidden');
        $('.flex-menu__profile').removeClass('hidden');
        $('.flex-menu__back').removeClass('hidden');
        var thisUser = firebase.auth().currentUser;
        var uuid = thisUser.uid;
        firebase.database().ref().child('Users').child(uuid).child('username').once('value', function(snapshot){
            var username = snapshot.val();
            $('.flex-menu__profile-username p').text(username);
        });

        $('.propic').on('click', function() {
            $('.propic-upload').click();
            $('.propic-upload').change(function(e){
                var imgURL = URL.createObjectURL(e.target.files[0]);
                $('.propic').attr('src', imgURL);

                //var file = imgURL.substring(imgURL.lastIndexOf('/')+1);
                console.log("imgURL: " + imgURL);
                var storageRef = firebase.storage().ref().child('Users/');
                var profPicRef = storageRef.child(imgURL);
                var profPicImagesRef = storageRef.child('images/' + imgURL);
                storageRef.child('images/' + imgURL.name).put(imgURL);


                //FINISH THIS
            });

        });

    });
    //BACK LOGIC
    $('.flex-menu__back').on('click', function () {
        if ($('.flex-menu__new-game').is(":visible")) {
            $('.flex-menu__new-game').addClass('hidden');
            $('.flex-menu__main').removeClass('hidden');
            $('.flex-menu__back').addClass('hidden');
        } else if ($('.prompt__room-code').is(":visible")) {
            $('.prompt__room-code').addClass('hidden');
            $('.flex-menu__new-game').removeClass('hidden');
        } else if ($('.flex-menu__leaderboard').is(":visible")) {
            $('.flex-menu__leaderboard').addClass('hidden');
            $('.flex-menu__main').removeClass('hidden');
            $('.flex-menu__back').addClass('hidden');
        } else if ($('.prompt__add-word').is(":visible")) {
            $('.prompt__add-word').addClass('hidden');
            $('.prompt__add-word__confirm').addClass('hidden');
            $('.flex-menu__main').removeClass('hidden');
            $('.flex-menu__back').addClass('hidden');
        } else if ($('.flex-menu__profile').is(":visible")) {
            $('.flex-menu__profile').addClass('hidden');
            $('.flex-menu__main').removeClass('hidden');
            $('.flex-menu__back').addClass('hidden');
        } else if($('.flex-menu__endgame').is(":visible")) {
            $('.flex-menu__endgame').addClass('hidden');
            $('.flex-menu__main').removeClass('hidden');
            $('.flex-menu__back').addClass('hidden');
            $('.flex-app__main').find('.docs-grid-item').removeClass('wordSelected');
            score = 0;
            $('.points').html('<span>' + score + '</span>');
        }

    });
    var roomCode = "";
    $('.flex-menu__new-game').on('click', '.flex-menu__action', function () {
        if ($(this).hasClass("host")) {

            var newRoomCode = Math.random().toString(36).substring(2, 6);
            roomCode = newRoomCode;

            $('.flex-menu__new-game').addClass('hidden');
            $('.flex-menu__back').addClass('hidden');
            $('.roomkey-alert').removeClass('hidden');
            $('.roomkey').html(roomCode);

            //Initialize the host board
            firebase.database().ref('Words/').once('value', function(snapshot){

                var todaysDate = new Date();
                var day = 60 * 60 * 24 * 1000;
                snapshot.forEach(function(childsnap){
                    var x = (childsnap.key);
                    var count = childsnap.val().count;
                    //Before pushing the word to the global array, check if it should be deleted due to rare use.
                    var worddate = new Date(childsnap.val().date);
                    var utc1 = Date.UTC(todaysDate.getFullYear(), todaysDate.getMonth(), todaysDate.getDate());
                    var utc2 = Date.UTC(worddate.getFullYear(), worddate.getMonth(), worddate.getDate());
                    var difference = Math.floor((utc1 - utc2) / day);

                    //If word hasn't been used after 60 days, then delete it
                    if ((count === 1) && (difference > 60)){
                        //Remove the word from firebase
                        var wordRef = firebase.database().ref('Words/'+ x);
                        wordRef.remove();
                    }

                    else{
                         wordsArray.push(x);
                    }
                });
                var usedArray = new Array(wordsArray.length);
                var number = 0;
                for (var i = 0; i < 24; i++){
                     number = Math.floor(Math.random() * usedArray.length);
                    if (usedArray[number] !== true){
                        $('#cell' + i).html(wordsArray[number]);
                        roomArray.push(wordsArray[number]);
                        usedArray[number] = true;

                    }
                    else{
                        i--;
                    }
                }
                var user = firebase.auth().currentUser.uid;
                var initial = [user];
                console.log(initial[0]);
                firebase.database().ref().child('Rooms').child(newRoomCode).set({
                    array:roomArray,
                    winner:""
                });

                //Get username to store
                var username_ref = firebase.database().ref().child('Users').child(user);
                username_ref.once('value', function(data){
                    var username = data.val().username;
                     firebase.database().ref().child('Rooms').child(newRoomCode).child('players').child(user).set({
                         username:username
                     });
                });
            });
            var userRef = firebase.database().ref('Users/'+ firebase.auth().currentUser.uid);
            var userUpdate = {};
            userUpdate['/current_room'] = newRoomCode;
            userRef.update(userUpdate);
            currentlyPlaying = false;
            //First delete reference from old room if it exists
            if (currentRoom !== ""){
                 var oldRoom = firebase.database().ref().child('Rooms').child(currentRoom).child('players').child(firebase.auth().currentUser.uid);
                 oldRoom.remove();
                //Detach old listener
                var room_ref =  firebase.database().ref().child('Rooms').child(currentRoom).child('players');
                room_ref.off('child_added', player_added);
                room_ref.off('child_removed', player_removed);

            }

            currentRoom = newRoomCode;
            //start listening to room
            listen_to_room();
            listen_to_players();


            $('.roomkey-alert').off().on('click', 'button', function(){
                closeMenu();
                $('.roomkey-alert').addClass('hidden');
                $('.title__roomkey').removeClass('hidden');
                $('.title__roomkey').text(roomCode);
                $('.flex-chat__messages').find('.message').remove();
                $('.flex-chat__messages').find('.chat-alert').remove();
                currentlyPlaying = true;
                listen_to_chat();
            });

        } else if ($(this).hasClass("join")) {
            $('.flex-menu__new-game').addClass('hidden');
            $('.prompt__room-code').removeClass('hidden');
            $('.prompt__room-code').on('submit', function (event) {
                event.preventDefault();
                var submittedCode = $('.prompt__room-code input').val();

                firebase.database().ref('Rooms/').once('value', function(snapshot){
                    var found_room = false;
                    var count = 1;
                    snapshot.forEach(function(childsnap){
                        if(submittedCode == childsnap.key){
                            console.log("This room exists");
                            found_room = true;
                            var userRef = firebase.database().ref('Users/'+ firebase.auth().currentUser.uid);
                            var userUpdate = {};
                            userUpdate['/current_room'] = submittedCode;
                            userRef.update(userUpdate);
                            //First delete reference from old room if it exists
                            if (currentRoom !== ""){
                                 var oldRoom = firebase.database().ref().child('Rooms').child(currentRoom).child('players').child(firebase.auth().currentUser.uid);
                                 oldRoom.remove();
                                //Detach old listener
                                var room_ref =  firebase.database().ref().child('Rooms').child(currentRoom).child('players');
                                room_ref.off('child_added', player_added);
                                room_ref.off('child_removed', player_removed);
                            }
                            currentRoom = submittedCode;
                            //shuffle the array
                            var shuffledArray = shuffleArray(childsnap.val().array);
                            //upload room array to board
                            for (var i = 0; i < 24; i++){
                                $('#cell' + i).html(shuffledArray[i]);
                            }

                            //Add player to the joined room list
                            var userReference = firebase.database().ref().child('Users').child(firebase.auth().currentUser.uid);
                            userReference.once('value', function(data){
                                var username = data.val().username;
                                var rooomCodeRef = firebase.database().ref().child('Rooms').child(submittedCode).child('players').child(firebase.auth().currentUser.uid);
                                rooomCodeRef.set({
                                    username:username
                                });

                            });

                            listen_to_room();
                            $('.flex-chat__messages').find('.message').remove();
                            $('.flex-chat__messages').find('.chat-alert').remove();
                            closeMenu();
                            $('.title__roomkey').removeClass('hidden');
                            $('.title__roomkey').text(roomCode);
                            listen_to_chat();
                            //Listen for new members
                            listen_to_players();
                            currentlyPlaying = true;
                            console.log("hey");
                            return true;
                        }
                        else if ((found_room === false) && (count === snapshot.numChildren()) ){
                            console.log("This room does not exist");
                            return true;
                        }
                        else{
                            count ++;
                        }
                    });

                });

            });

        }


        score = 0;
        $('.points').html('<span>' + score + '</span>');
        $('.flex-app__main').find('.docs-grid-item').removeClass('wordSelected');
    });

    function shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    function closeMenu() {
        isMenuOpen = false;
        $('.flex-menu').addClass('hidden');
        $('.flex-menu__main').addClass('hidden');
        $('.flex-menu__new-game').addClass('hidden');
        $('.prompt__add-word').addClass('hidden');
        $('.prompt__room-code').addClass('hidden');
        $('.flex-menu-wrapper').css({'z-index':'0'});
        $('.flex-app').css({'z-index':'1'});
        display_back();
        $('.flex-menu__back').addClass('hidden');
    }

    $('.menu-icon').on('click', function () {
        if (just_started === false){
            if(isMenuOpen === false){
                if(chatVisibility(visibility) === false){
                    isChatOpen = true;
                    $('.chat-icon').click();
                }
                openMenu();
            }
            else if((isMenuOpen === true) && (currentlyPlaying === true)){
                closeMenu();
            }
        }
    });

    $('.chat-icon').on('click', function(){
        if(isMenuOpen === false){
            if(isChatOpen === false){
                $('.flex-chat').removeClass('hidden');
                isChatOpen = true;
            }
            else if(isChatOpen === true){
                $('.flex-chat').addClass('hidden');
                isChatOpen = false;
            }
        }
    });

    $('.flex-chat__exit').on('click', function(){
        isChatOpen = false;
        $('.flex-chat').addClass('hidden');
    });

    $('.flex-chat').on('submit', function (event) {
        event.preventDefault();
        var myarray = $('.send-message').serializeArray();
        var message = myarray[0].value;
        var username ='';
        var thisUser = firebase.auth().currentUser;
        var uuid = thisUser.uid;
        firebase.database().ref().child('Users').child(uuid).child('username').once('value', function(snapshot){
            username = snapshot.val();
        });

        if(message !== ""){
            firebase.database().ref('Rooms/' + currentRoom).child('Messages').push({
                message: message,
                sender: username
            });
        }
        $('.send-message').val("");

    });



    //WHEN A CELL IS SELECTED
    var score = 0;
    var bingo = false;
    $('.flex-app__main').on('click', '.docs-grid-item', function () {
        if (screenLocked === false) {
            if (bingo === false) {

                var thisItem = $(this);
                var thisWord = $(this).find('p').text();

                    if ($(this).hasClass('wordSelected')) {
                        score -= 5;
                        $('.points').html(score);
                    } else {
                        score += 5;
                        $('.points').html(score);
                    }
                    $('.points').html(score);

                $(this).toggleClass('wordSelected');
                var wordRef = firebase.database().ref('Words/' + thisWord);
                firebase.database().ref('Words/' + thisWord + '/count').once('value', function(snapshot){

                    var updates = {};
                    if(thisItem.hasClass('wordSelected')){
                        updates['/count'] = snapshot.val() + 1;
                    }
                    else{
                        updates['/count'] = snapshot.val() - 1;
                    }
                    wordRef.update(updates);
                });

                if($(this).hasClass('wordSelected')){
                    var wordAlert = (" got \"" + $(this).find('p').text() + "\"");
                    var username ='';
                    var thisUser = firebase.auth().currentUser;
                    var uuid = thisUser.uid;
                    firebase.database().ref().child('Users').child(uuid).child('username').once('value', function(snapshot){
                        username = snapshot.val();
                    });
                    firebase.database().ref('Rooms/' + currentRoom).child('Messages').push({
                        alert: wordAlert,
                        sender: username
                    });

                }
            }
            var columnNo = $(this).data('col');
            var rowNo = $(this).data('row');
            var thisRow = $('.docs-grid-item').filter('[data-row="' + rowNo + '"].wordSelected');
            var thisCol = $('.docs-grid-item').filter('[data-col="' + columnNo + '"].wordSelected');
            var thisDiag1 = $('.diag1').filter('.wordSelected');
            var thisDiag2 = $('.diag2').filter('.wordSelected');

            var selectedInCol = thisCol.size();
            var selectedInDiag1 = thisDiag1.size();
            var selectedInDiag2 = thisDiag2.size();
            var selectedInRow = thisRow.size();

            if (selectedInRow == 5) {
                thisRow.addClass('winningWords');
                localWin = true;
                triggerEnd();
            } else if (selectedInCol == 5) {
                thisCol.addClass('winningWords');
                localWin = true;
                triggerEnd();
            } else if (selectedInDiag1 == 5) {
                thisDiag1.addClass('winningWords');
                localWin = true;
                triggerEnd();
            } else if (selectedInDiag2 == 5) {
                thisDiag2.addClass('winningWords');
                localWin = true;
                triggerEnd();
            } else {
                bingo = false;
            }
            console.log("bingo: ", bingo);
        }
    });

    var rarityLevel = "";
    function getWordPoints(currentWordCount){
        var totalWordCount = 0;
        firebase.database().ref('Words').once('value', function(snapshot){
           snapshot.forEach(function(childSnapshot){
               totalWordCount += childSnapshot.val().count;
           });
            var wordPoints = 0;
            var rarity = currentWordCount / totalWordCount;
            if(rarity < 0.05){
                wordPoints = 30;
                rarityLevel = "Very Rare";
            }
            else if(rarity >= 0.05 && rarity < 0.15){
                wordPoints = 15;
                rarityLevel = "Uncommon";
            }
            else if(rarity >= 0.15){
                wordPoints = 5;
                rarityLevel = "Common";
            }
            return wordPoints;
        });
    }

    function triggerEnd() {
        if (bingo === false) {
            score += 50;
            $('.points').html('<span>' + score + '</span>');
        }
        bingo = true;
        endGame();
    }

    listen_to_leaderboard();
    listen_to_top_words();
    //Initial Leaderboard setup
    var userRef = firebase.database().ref("Users/");
    userRef.on('child_added', function(data){


        userRef.orderByChild("total_score").once('value', function(snapshot){
             $("#leaderboard_list").html("");
            var total_users = snapshot.numChildren();
            var count = snapshot.numChildren();
            snapshot.forEach(function(childsnap){
                    //Prepend to the ordered list
                    $("#leaderboard_list").prepend("<li>" + childsnap.val().username + "   <span>(" + childsnap.val().total_score + " Points)</span></li>");
            });

        });

    });

    var wordRef = firebase.database().ref("Words/");

    wordRef.on('child_added', function(data){

        wordRef.orderByChild("count").once('value', function(snapshot){
            $('#top-words_list').html("");
            var count = snapshot.numChildren();
            snapshot.forEach(function(childsnap){
            var word = childsnap.key;
            var wordCount = childsnap.val().count;
            if(word !== "Free Space"){
                $('#top-words_list').prepend("<li>" + word + "    <span>(" + wordCount + " Uses)</span></li>"); //FIX
            }
         });
        });
    });

    function listen_to_top_words(){

        var wordRef = firebase.database().ref("Words/");

        wordRef.on('child_changed', function(data){

            wordRef.orderByChild("count").once('value', function(snapshot){
               $('#top-words_list').html("");
                var count = snapshot.numChildren();
                snapshot.forEach(function(childsnap){
                       var word = childsnap.key;
                       var wordCount = childsnap.val().count;
                       if(word !== "Free Space"){
                        $('#top-words_list').prepend("<li>" + word + "    <span>(" + wordCount + " Uses)</span></li>");
                       }
                });
            });
        });
    }

    function listen_to_leaderboard(){

        var ref = firebase.database().ref("Users/");
        ref.on('child_changed', function(data){


            ref.orderByChild("total_score").once('value', function(snapshot){
                 $("#leaderboard_list").html("");
                var count = snapshot.numChildren();
                snapshot.forEach(function(childsnap){
                        //Prepend to the ordered list
                        $("#leaderboard_list").prepend("<li>" + childsnap.val().username + "   <span>(" + childsnap.val().total_score + " Points)</span></li>");
                });

            });

        });

    }

    function endGame() {
        if(isChatOpen === true){
            $('.chat-icon').click();
        }
        closeMenu();
        openMenu();
        $('.flex-menu__main').addClass('hidden');
        $('.flex-menu__endgame').removeClass('hidden');
        $('.flex-menu__back').removeClass('hidden');
        $('.title__roomkey').addClass('hidden');
        $('.flex-chat__messages').find('.message').remove();
        $('.flex-chat__messages').find('.chat-alert').remove();

        var user = firebase.auth().currentUser;
        var uid = user.uid;
        var latestScore = 0;
        var ref = firebase.database().ref('Users/' + uid);
        firebase.database().ref('Users/' + uid + '/games_played').once('value', function(snapshot){
            var updates = {};
            updates['/games_played'] = snapshot.val() + 1;
            ref.update(updates);
        });
        firebase.database().ref('Users/' + uid + '/total_score').once('value', function(snapshot){
            var updates = {};
            updates['/total_score'] = snapshot.val() + score;
            latestScore = snapshot.val() + score;
            ref.update(updates);
        });
        firebase.database().ref('Users/' + uid + '/rank').once('value', function(snapshot){
            var updates = {};
            //var latestScore = firebase.database().ref('Users/' + uid + '/total_score').val();
            console.log("Rank:" + rank_update(latestScore));
            updates['/rank'] = rank_update(latestScore);
            ref.update(updates);
        });
        if(localWin === true){
            firebase.database().ref('Users/' + uid + '/games_won').once('value', function(snapshot){
                var updates = {};
                updates['/games_won'] = snapshot.val() + 1;
                updates['/current_room'] = "";
                ref.update(updates);
            });

            firebase.database().ref('Users/' + uid + '/username').once('value', function(snapshot){

                var roomRef = firebase.database().ref('Rooms/'+ currentRoom);
                var roomUpdate = {};
                roomUpdate['/winner'] = snapshot.val();
                roomRef.update(roomUpdate);
                roomRef.remove();

            });
        }

        else{
            //The player lost
            console.log("You lost");
            firebase.database().ref('Users/' + uid + '/games_won').once('value', function(snapshot){
                var updates = {};
                updates['/current_room'] = "";
                ref.update(updates);
            });

        }

        bingo = false;

        var ref = firebase.database().ref('Rooms/' + currentRoom).child('Messages');
        ref.off('child_added', function(data){});
        currentlyPlaying = false;
        currentRoom = "";

    }
});
