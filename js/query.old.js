var blueWin, redWin, blueScore = 0,
redScore = 0, gameType, playedGameOver,
mapName, firstRun = true, teamPlay,
userIP, userPort, intervalTimer,
consecutiveFailures, activityHistory = [0, 0, 0, 0, 0 ,0 ,0 ,0 ,0 ,0],
arrayIndex = 0, gameVariant;

function beginQuery(userIP, userPort) {
    //Stops any active queries and resets the failures counter
    this.consecutiveFailures = 0;
    haltQuery();
    firstRun = true;

    this.userIP = userIP;
    this.userPort = userPort;

    //Begin the query timer and run the first query instantly
    this.intervalTimer = setInterval(queryServer, 2000);
    queryServer();
}

function haltQuery() {
    clearInterval(this.intervalTimer);
}

function queryServer() {
    var options = {
        'ip': userIP,
        'port': userPort
    };

    $.ajax({
        url: "script/ajax.php",
        type: 'POST',
        data: options,
        success: function(msg) {
            var obj = jQuery.parseJSON(msg);
            if (!obj.error) {
                //Display the tabs and switch to the server data
                if (firstRun) {
                    displayTabs();
                    firstRun = false;

                } else {
                    audioCues(obj); //play audio
                }
		activityHistory.push(obj.numplayers);
                activityHistory.shift();
		imageUpdate(obj);
                consecutiveFailures = 0;
                $('#activity_spark').sparkline(activityHistory, { type: "bar", width: "70px", height: "20px", lineWidth: 0, barColor: "#e1e1e1", chartRangeMin: 0, chartRangeMax: 16 });
                imageUpdate(obj); //load correct map image
                $('#server_name').text(obj.hostname);
                $('#server_ip').text(options.ip + ":" + options.port); //!?
                $('#server_version').text(obj.gamever);
                $('#player_count').text(obj.numplayers + " / " + obj.maxplayers);
                $('#game_mode').text(obj.gametype);
                $('#game_variant').text(obj.gamevariant);
                $('#current_map').text(obj.mapname);
                $('#dedicated').text((obj.dedicated == 1)? "Yes" : "No") ;
                $('#password').text((obj.password == 1)? "Yes" : "None");

                //Update title
                $('title').text(obj.mapname + ", " + obj.numplayers + "/"
                    + obj.maxplayers + " (" + options.ip + ":" +
                    options.port + ")");

                //Update the team information
                if (obj.teamplay == 1) {
                    var redPlayers = 0;
                    var bluePlayers = 0;

                    //Correct team scores for time based gametypes
                    if (obj.gametype === "Oddball" || obj.gametype === "King") {
                        obj.score_t0 = Math.floor(obj.score_t0 / 30);
                        obj.score_t1 = Math.floor(obj.score_t1 / 30);
                    }

                    //Work out how many players are on each team
                    if (obj.numplayers != 0) {
                        $.each(obj.players, function(i, item) {
                            if (item.team == 0) {
                                redPlayers++;
                            } else {
                                bluePlayers++;
                            }
                        })
                    }
                    var suffix;
                    //Figure out the score suffix and correct the frag limit value
                    if (obj.gametype === "CTF") {
                        suffix = " captures";
                    } else if (obj.gametype === "Slayer" || obj.gametype === "Team Slayer") {
                        suffix = " kills";
                    } else if (obj.gametype == "Oddball" || obj.gametype === "King") {
                        obj.fraglimit *= 60;
                        suffix = " seconds";
                    } else if (obj.gametype === "Race") {
                        suffix = " laps";
                    } else {
                        suffix = " unknown score unit";
                    }

                    //How far off are the teams from winning?
                    var blueWidth, redWidth;
                    if (obj.score_t0 == 0) {
                        redWin = 0;
                        redWidth = 0;
                    } else {
                        redWin = Math.floor((obj.score_t0 / obj.fraglimit) * 100);
                        redWidth = Math.round((460 * (redWin / 100))) + 40;
                    }

                    if (obj.score_t1 == 0) {
                        blueWin = 0;
                        blueWidth = 0;
                    } else {
                        blueWin = Math.floor((obj.score_t1 / obj.fraglimit) * 100);
                        blueWidth = Math.round((460 * (blueWin / 100))) + 40;
                    }

                    $('#blue .players').text(bluePlayers + " / " + obj.maxplayers);
                    $('#red .players').text(redPlayers + " / " + obj.maxplayers);
                    $('#red .score').text(obj.score_t0 + suffix);
                    $('#blue .score').text(obj.score_t1 + suffix);
                    $('#red .bar').text(redWin + "%");
                    $('#blue .bar').text(blueWin + "%");
                    
                    /*
                     * Only animate if the score has changed - fixes some behaviour
                     * where the team information box would resize slightly on each
                     * update
                     */
                    if(redScore != obj.score_t0) {
                        $('#red .bar').animate({
                            width: redWidth
                        }, 1500);
                    }
                    
                    if(blueScore != obj.score_t1) {
                        $('#blue .bar').animate({
                            width: blueWidth
                        }, 1500);
                    }
                    //$('#red .bar').css("width",  redWidth);
                    //$('#blue .bar').css("width", blueWidth);
                    $('#team_game').text("Yes");
                    $('#team_information').slideDown(2000);
                    blueScore = obj.score_t1;
                    redScore = obj.score_t0;
                } else {
                    $('#team_game').text("No");
                    $('#team_information').slideUp(2000);
                }

                //Update the players settings
                $('#lives').text(obj.flags.Player.NumberOfLives);
                $('#health').text(obj.flags.Player.MaximumHealth);
                $('#shields').text((obj.flags.Player.Shields? "Yes" : "No"));
                $('#respawn_delay').text(obj.flags.Player.RespawnTime + " seconds");
                $('#respawn_growth').text(obj.flags.Player.RespawnGrowth + " seconds");
                $('#odd_man_out').text((obj.flags.Player.OddManOut)? "Yes" : "No");
                $('#suicide_penalty').text(obj.flags.Player.SuicidePenalty + " seconds");
                $('#weapon_set').text(obj.flags.Player.WeaponSet);
                $('#starting_equipment').text(obj.flags.Player.StartingEquipment);
                $('#juggernaut').text((obj.flags.Player.InvisiblePlayers)? "Yes" : "No");
                $('#infinite_quadnading').text((obj.flags.Player.InfiniteGrenades)? "Yes" : "No");
                $('#nav_points').text(obj.flags.Player.Indicator);
                $('#radar_mode').text(obj.flags.Player.OtherPlayersOnRadar);
                $('#friend_indicators').text((obj.flags.Player.FriendIndicators)? "On" : "Off");
                $('#friendly_fire').text(obj.flags.Player.FriendlyFire);
                $('#friendly_fire_penalty').text(obj.flags.Player.FriendlyFirePenalty + " seconds");
                $('#auto_balance').text((obj.flags.Player.AutoTeamBalance)? "Enabled" : "Disabled");

                //Add team settings to the table
                if(gameType != obj.gametype) {
                    $('#vehicle_information').slideUp(1500, 
                        function() {
                            $("#vehicle_information tr").remove();
                            $.each(obj.flags.Team, function(i, item) {
                                $('#vehicle_information').append("<tr><td>" + i + "</td><td>" + item + " </td></tr>");
                            }),
                            $('#vehicle_information').slideDown(1500);
                        });
                }

                //Add game settings to the table
                $("#game_settings tr").remove();
                $.each(obj.flags.Game, function(i, item) {
                    if (item == 1) {
                        item = "Yes";
                    } else if (item == 0) {
                        item = "No";
                    }
                    $('#game_settings').append("<tr><td>" + i + "</td><td>" + item + " </td></tr>");
                })
                
                //Used for checking whether values have changed between update polls
                gameType = obj.gametype;
                teamPlay = obj.teamplay;
                mapName = obj.mapName;
		gameVariant = obj.gamevariant;
            } else {
                errorHandle(obj);
            }
        },
        error: function(data) {
            $.jGrowl(data);
            haltQuery();
        }
    });
}

function errorHandle(obj) {
    if(obj.errorcode == 1) {
        $.jGrowl(obj.error + ".", {
            life: 5000
        });
        haltQuery();
    } else {
        consecutiveFailures++;
        if (consecutiveFailures == 1) {
            $.jGrowl(obj.error + ". Retrying...", {
                header: "Retrying...", 
                life: 20000
            });
        } else if (consecutiveFailures >= 10) {
            $.jGrowl("The server failed to respond after 10 retries.", {
                header: "STOPPING UPDATES", 
                life: 20000
            });
            haltQuery();
        }
    }
}

function imageUpdate(obj) {
    var image = "default";
    var doUpdate = false;

    if (obj.mapname != mapName) {
        if (obj.mapname === "bloodgulch" || obj.mapname === "deathisland"
            || obj.mapname === "dangercanyon" || obj.mapname === "timberland"
            || obj.mapname === "gephyrophobia"|| obj.mapname === "icefields" 
            || obj.mapname === "infinity"|| obj.mapname === "sidewinder"
            || obj.mapname === "boardingaction" || obj.mapname === "putput" 
            || obj.mapname === "beavercreek" || obj.mapname === "carousel" 
            || obj.mapname === "longest" || obj.mapname === "hangemhigh" 
            || obj.mapname === "damnation" || obj.mapname === "ratrace" 
            || obj.mapname === "chillout"
            //CE maps 
            || obj.mapname === "talloniv") {
            image = mapName;
        } else {
	    image = "unknown.png";
        }

        //Update background, banner and map information
        $('#banner').css("background-image", "url('images/map_banners/" + obj.mapname + ".png')");
        /*$('#map_information img').fadeOut(2000, function() {
            $('#map_information img').attr("src", "images/map_information/" + obj.mapname + ".png");
	    $('#map_information img').fadeIn(2000);
        });*/
    }

	//Set game type image
	if (obj.gametype != gameType) {
	    switch(obj.gametype) {
                case "CTF" : image = 0; break;
		case "Slayer" : image = 1; break;
		case "King" : image = 3; break;
		case "Oddball" : image = 2; break;
		case "Race" : image = 13; break;
	    }
		doUpdate = true;
	}

	//Zombies/infection support
	if(obj.gamevariant != gameVariant) {
	    if(obj.gamevariant.toLowerCase().indexOf("zombie") != -1) {
	        image = 7;
		doUpdate = true;
	    }
	}

	if(doUpdate) {
	    $('#game-icon').fadeOut(1500, function() {
	        $('#game-icon').css("background-image", "url('images/game_icons/" + image + ".png')");
                $('#game-icon').fadeIn(1500);
            });
	}	
}

function audioCues(obj) {
    var doPlay = false;

    //Work out if the game type has changed
    if (obj.gametype != gameType || obj.teamplay != teamPlay) {
        doPlay = true;
        if (obj.gametype === "CTF") {
            sound = "capture_the_flag.mp3";
        } else if (obj.gametype === "Race") {
            if (obj.teamplay === 1) {
                sound = "team_race.mp3";
            } else {
                sound = "race.mp3";
            }
        } else if (obj.gametype === "King") {
            if (obj.teamplay == 1) {
                sound = "team_king_of_the_hill.mp3";
            } else {
                sound = "king_of_the_hill.mp3";
            }
        } else if (obj.gametype === "Oddball") {
            if (obj.teamplay == 1) {
                sound = "team_oddball.mp3";
            } else {
                sound = "oddball.mp3";
            }
        } else if (obj.gametype === "Slayer") {
            if (obj.teamplay == 1) {
                sound = "team_slayer.mp3";
            } else {
                sound = "slayer.mp3";
            }
        }
    }

    //Check to see if the game is over
    if (blueWin == 100 || redWin == 100) {
        if (!playedGameOver) {
            doPlay = true;
            sound = "game_over.mp3";
        }
        playedGameOver = true;
    } else {
        playedGameOver = false;
    }

    //Gametype specific score checks
    if (obj.gametype === "CTF") {
        if (obj.score_t1 != blueScore) {
            doPlay = true;
            sound = "blue_team_score.mp3";
        } else if (obj.score_t0 != redScore) {
            doPlay = true;
            sound = "red_team_score.mp3";
        }
    }

    if (doPlay) {
        soundManager.play(sound,'audio/' + sound);
    }
}

function displayTabs() {
    $(function () {
        var tabContainers = $('div#tabs > div');
        $('#tabs ul li').removeClass('active');
        $('#server_select').addClass('active');
        //tabContainers.fadeOut(500).filter('#server-tab').slideDown(1500);
        $('#query-tab').slideUp(600, function() {
            $('#team_information').hide(); //animation fix
            $('#tabs ul li').fadeIn(1000);
            $('#server-tab').slideDown(1000);
        });
    });
}
