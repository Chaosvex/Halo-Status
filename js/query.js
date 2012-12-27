function Query(serverIP, serverPort) {
    this._serverIP = serverIP;
    this._serverPort = serverPort;
    this._saveStatus(); //hacky fix, like most of this script
    //this._playSound = soundManager.ok();
    //Fix for the team box sliding animation
    $('#team_information').hide();
}

Query.prototype._prevStatus = {};
Query.prototype._status = {};
Query.prototype._activityHistory = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
Query.prototype._soundQueue = [];
Query.prototype._consecutiveFailures = 0;
Query.prototype._firstRun = true;
//Query.prototype._playSound = false;
Query.prototype._soundQueueLock = false;
Query.prototype._blockingList = false;
Query.prototype._queryBlock = false;
Query.prototype._redCompletion = 0;
Query.prototype._blueCompletion = 0;



Query.prototype.setIntervalHandle = function(interval) {
    this._intervalHandle = interval;
};

Query.prototype.transferStatus = function(status) {
    this._prevStatus = status;
};

Query.prototype.getStatus = function() {
    return this._status;
};

/*
 * Queries the server and updates everything, basically.
 */
Query.prototype.update = function () {
    if (this._blockingQuery) {
        return;
    } else {
        this._blockingQuery = false;
    }
    
    var that = this;
    jQuery.ajax({
        url: "script/ajax.php",
        type: 'POST',
        data: {
            'ip': that._serverIP,
            'port': that._serverPort
        },
        success: function (msg) {
            that._status = msg;
            if (!that._status.error) {
                that._updateUI();
                if (soundManager.ok()) {
                    that._audioCues();
                }
                that._saveStatus();
                that._firstRun = false;
            } else {
                that._errorHandler();
            }
            that._blockingQuery = false;
        },
        //Kind of a cludge but it'll do for now
        error: function (msg) {
            that._status.error = "An HTTP error occured";
            that._errorHandler();
            that._blockingQuery = false;
        },
        timeout: function () {
            that._status.error = "The request to the server timed out";
            that._errorHandler();
            that._blockingQuery = false;
        },
        parsererror: function () {
            that._status.error = "The server returned an invalid response";
            that._errorHandler();
            that._blockingQuery = false;
        }
    });
};

/*
 * Calls the functions responsible for updating various parts of the UI
 */
Query.prototype._updateUI = function () {
    //Fix me later, maybe
    if (this._firstRun) {
        this.displayTabs();
    }
    this._pageTitle();
    this._playerActivitySpark();
    this._teamInformation();
    this._serverInformation();
    if (!this._blockingList) {
        this._renderPlayers();
    }

    if(this._status.mapname != this._prevStatus.mapname) {
        this._mapImages();
    }

    if(this._status.gametype != this._prevStatus.gametype
        || this._status.gamevariant != this._prevStatus.gamevariant) {
        this._playerSettings();
        this._gameSettings();
        this._vehicleSettings();
        this._gameIcon();
    }
};

Query.prototype._playerSettings = function () {
    //Update the players settings
    $('#lives').text(this._status.flags.Player.NumberOfLives);
    $('#health').text(this._status.flags.Player.MaximumHealth);
    $('#shields').text((this._status.flags.Player.Shields ? "Yes" : "No"));
    $('#respawn_delay').text(this._status.flags.Player.RespawnTime + " seconds");
    $('#respawn_growth').text(this._status.flags.Player.RespawnGrowth + " seconds");
    $('#odd_man_out').text((this._status.flags.Player.OddManOut) ? "Yes" : "No");
    $('#suicide_penalty').text(this._status.flags.Player.SuicidePenalty + " seconds");
    $('#weapon_set').text(this._status.flags.Player.WeaponSet);
    $('#starting_equipment').text(this._status.flags.Player.StartingEquipment);
    $('#juggernaut').text((this._status.flags.Player.InvisiblePlayers) ? "Yes" : "No");
    $('#infinite_quadnading').text((this._status.flags.Player.InfiniteGrenades) ? "Yes" : "No");
    $('#nav_points').text(this._status.flags.Player.Indicator);
    $('#radar_mode').text(this._status.flags.Player.OtherPlayersOnRadar);
    $('#friend_indicators').text((this._status.flags.Player.FriendIndicators) ? "On" : "Off");
    $('#friendly_fire').text(this._status.flags.Player.FriendlyFire);
    $('#friendly_fire_penalty').text(this._status.flags.Player.FriendlyFirePenalty + " seconds");
    $('#auto_balance').text((this._status.flags.Player.AutoTeamBalance) ? "Enabled" : "Disabled");
};

Query.prototype._vehicleSettings = function () {
    var that = this;
    $('#vehicle_information').slideUp(1500, function () {
        $("#vehicle_information tr").remove();
        $.each((that)._status.flags.Team, function (i, item) {
            $('#vehicle_information').append("<tr><td>" + i + "</td><td>" + item + " </td></tr>");
        });
        $('#vehicle_information').slideDown(1500);
    });
};

Query.prototype._gameSettings = function () {
    //Add game settings to the table
    $("#game_settings tr").remove();
    $.each(this._status.flags.Game, function (i, item) {
        if (item === 1) {
            item = "Yes";
        } else if (item === 0) {
            item = "No";
        }
        $('#game_settings').append("<tr><td>" + i + "</td><td>" + item + " </td></tr>");
    });
};

/*
 * Updates the sparkbar that shows server activity history
 */
Query.prototype._playerActivitySpark = function () {
    this._activityHistory.push(this._status.numplayers);
    this._activityHistory.shift();
    $('#activity_spark').sparkline(this._activityHistory, {
        type: "bar",
        width: "70px",
        height: "20px",
        lineWidth: 0,
        barColor: "#e1e1e1",
        chartRangeMin: 0,
        chartRangeMax: 16
    });
};

/*
 * Calls the functions responsible for sounding audio cues
 */
Query.prototype._audioCues = function () {
    //Prevent score changes between new queries triggering announcements
    if (!this._firstRun) {
        this._announceScore();
    }
    this._announceGameOver();
    this._announceGameType();
    /*
     * Prevents a race condition where this method would otherwise keep creating
     * SoundManager objects until one of them managed to empty the queue
     */
    if(!this._soundQueueLock) {
        this._processSoundQueue();
    }
};

Query.prototype._serverInformation = function () {
    if(this._status.hostname != this._prevStatus.hostname) {
        if(this._status.hostname.length > 45) {
            $('#server_name').animate({
                fontSize: "22px"
            }, 1000);
        } else {
            $('#server_name').animate({
                fontSize: "30px"
            }, 1000); 
        }
    }
    $('#server_name').text(this._status.hostname);
    $('#server_ip').text(this._serverIP + ":" + this._serverPort);
    $('#server_version').text(this._status.gamever);
    $('#player_count').text(this._status.numplayers + " / " + this._status.maxplayers);
    $('#game_mode').text(this._status.gametype);
    $('#game_variant').text(this._status.gamevariant);
    $('#current_map').text((typeof this._mapInfo[this._status.mapname] != 'undefined')?
        this._mapInfo[this._status.mapname].name : this._status.mapname);
    $('#team_game').text((this._status.teamplay == 1) ? "Yes" : "No");
    $('#dedicated').text((this._status.dedicated == 1) ? "Yes" : "No");
    $('#password').text((this._status.password == 1) ? "Yes" : "None");
};

Query.prototype._pageTitle = function () {
    //Update title
    var mapName =  this._status.mapname;
    mapName = (typeof this._mapInfo[mapName] != 'undefined')? this._mapInfo[mapName].name : mapName;
    $('title').text(mapName + ", " + this._status.numplayers + "/"
        + this._status.maxplayers + " (" + this._serverIP + ":" + this._serverPort + ")");
};

Query.prototype._teamInformation = function () {
    if (this._status.teamplay != this._prevStatus.teamplay && !this._firstRun) {
        /*Can't use toggle since it the box may end up in an incorrect state if
          a change occurs while the user is viewing other tabs*/
        if(this._status.teamplay == 1) {
            $('#team_information').slideDown(2000);
        } else {
            $('#team_information').slideUp(2000);
        }  
    //$('#team_information').slideToggle(2000);
    }

    if (this._status.teamplay == 1) {
        var redPlayers = 0, bluePlayers = 0, blueWidth, redWidth, suffix;

        //Correct team scores for time based gametypes
        if (this._status.gametype === "Oddball" || this._status.gametype === "King") {
            this._status.score_t0 = Math.floor(this._status.score_t0 / 30);
            this._status.score_t1 = Math.floor(this._status.score_t1 / 30);
        }

        //Work out how many players are on each team
        if (this._status.numplayers != 0) {
            $.each(this._status.players, function (i, item) {
                if (item.team == 0) {
                    redPlayers++;
                } else {
                    bluePlayers++;
                }
            });
        }

        //Figure out the score suffix and correct the frag limit value
        if (this._status.gametype === "CTF") {
            suffix = " captures";
        } else if (this._status.gametype === "Slayer" || this._status.gametype === "Team Slayer") {
            suffix = " kills";
        } else if (this._status.gametype == "Oddball" || this._status.gametype === "King") {
            this._status.fraglimit *= 60;
            suffix = " seconds";
        } else if (this._status.gametype === "Race") {
            suffix = " laps";
        } else {
            suffix = " unknown score unit";
        }

        //How far off are the teams from winning?
        if (this._status.score_t0 == 0) {
            this._redCompletion = 0;
            redWidth = 0;
        } else {
            this._redCompletion = this._redCompletion = Math.floor((this._status.score_t0 / 
                this._status.fraglimit) * 100);
            redWidth = Math.round((460 * (this._redCompletion / 100))) + 40;
        }

        if (this._status.score_t1 == 0) {
            this._blueCompletion = 0;
            blueWidth = 0;
        } else {
            this._blueCompletion = Math.floor((this._status.score_t1 / this._status.fraglimit) * 100);
            blueWidth = Math.round((460 * (this._blueCompletion / 100))) + 40;
        }

        $('#blue .players').text(bluePlayers + " / " + this._status.maxplayers);
        $('#red .players').text(redPlayers + " / " + this._status.maxplayers);
        $('#red .score').text(this._status.score_t0 + suffix);
        $('#blue .score').text(this._status.score_t1 + suffix);
        $('#red .bar').text(this._redCompletion + "%");
        $('#blue .bar').text(this._blueCompletion + "%");

        /*
         * Only animate if the score has changed - fixes some behaviour
         * where the team information box would resize slightly on each
         * update
         */
        if (this._status.score_t0 != this._prevStatus.score_t0) {
            $('#red .bar').animate({
                width: redWidth
            }, 1500).css("overflow", "visible");
        }

        if (this._status.score_t1 != this._prevStatus.score_t1) {
            $('#blue .bar').animate({
                width: blueWidth
            }, 1500).css("overflow", "visible");
        }
    }
};

/*
 * Saves important information about the current server status so that on the
 * next update, the jQuery can animate changes (slides, fades etc)
 */
Query.prototype._saveStatus = function () {
    this._prevStatus = jQuery.extend(true, {}, this._status);
    this._prevStatus.completion = {
        'red': this._redCompletion,
        'blue': this._blueCompletion
    };
};

Query.prototype._errorHandler = function () {
    if (this._status.errorcode == 1) {
        $.jGrowl(this._status.error + ".", {
            life: 5000
        });
        this.stop();
    } else {
        this._consecutiveFailures++;
        if (this._consecutiveFailures == 1) {
            $.jGrowl(this._status.error + ". Retrying...", {
                header: "Retrying...",
                life: 20000
            });
        } else if (this._consecutiveFailures == 10) {
            $.jGrowl("The server failed to respond after 10 retries.", {
                header: "STOPPING UPDATES",
                life: 20000
            });
            this.stop();
        }
    }
};

Query.prototype._gameIcon = function () {
    var doUpdate = false, image;

    if (this._status.gametype != this._prevStatus.gametype) {
        switch (this._status.gametype) {
            case "CTF":
                image = 0;
                break;
            case "Slayer":
                image = 1;
                break;
            case "King":
                image = 3;
                break;
            case "Oddball":
                image = 2;
                break;
            case "Race":
                image = 13;
                break;
        }
        doUpdate = true;
    }

    //Zombies/infection support
    if (this._status.gamevariant != this._prevStatus.gamevariant) {
        if (this._status.gamevariant.toLowerCase().indexOf("zombie") != -1) {
            image = 7;
            doUpdate = true;
        }
    }

    if (doUpdate) {
        $('#game-icon').fadeOut(1500, function () {
            $('#game-icon').css("background-image", "url('images/game_icons/" + image + ".png')");
            $('#game-icon').fadeIn(1500);
        });
        
        //Update the favicon - note, totally doesn't work. Fix with a canvas at some point.
        $("#favicon").attr("href","images/game_icons/favicons/" + image + ".ico");
    }
};

Query.prototype._mapImages = function () {
    var image;
    var mapName = this._status.mapname.toLowerCase();
    if(typeof this._mapInfo[mapName] != 'undefined') {
        image = mapName;
    } else {
        image = "unknown";
    }

    //Update background, banner and map information
    $('#banner').css("background-image", "url('images/map_banners/" + image + ".jpg')");
    $('#map_information img').fadeOut(2000, function () {
        $('#map_information img').attr("src", "images/map_information/" + image + ".jpg");
        $('#map_information img').fadeIn(2000);
    });
    var name = (typeof this._mapInfo[mapName] != 'undefined')? this._mapInfo[mapName].name : mapName;
    var description = (typeof this._mapInfo[mapName] != 'undefined')? this._mapInfo[mapName].description : "No description";
    $('#map_information img').attr("title", name + " - " + description);
};

Query.prototype._announceScore = function () {
    //Gametype specific score checks
    if (this._status.gametype === "CTF") {
        if (this._status.score_t1 > this._prevStatus.score_t1) {
            this._soundQueue[this._soundQueue.length] = "blue_team_score";
        } else if (this._status.score_t0 > this._prevStatus.score_t0) {          
            this._soundQueue[this._soundQueue.length] = "red_team_score";
        }
    }
};

Query.prototype._announceGameType = function () {
    var sound;
    //Work out if the game type has changed
    if (this._status.gametype != this._prevStatus.gametype || this._status.teamplay != this._prevStatus.teamplay) {
        if (this._status.gametype === "CTF") {
            sound = "capture_the_flag";
        } else if (this._status.gametype === "Race") {
            if (this._status.teamplay === 1) {
                sound = "team_race";
            } else {
                sound = "race";
            }
        } else if (this._status.gametype === "King") {
            if (this._status.teamplay == 1) {
                sound = "team_king_of_the_hill";
            } else {
                sound = "king_of_the_hill";
            }
        } else if (this._status.gametype === "Oddball") {
            if (this._status.teamplay == 1) {
                sound = "team_oddball";
            } else {
                sound = "oddball";
            }
        } else if (this._status.gametype === "Slayer") {
            if (this._status.teamplay == 1) {
                sound = "team_slayer";
            } else {
                sound = "slayer";
            }
        }
        this._soundQueue[this._soundQueue.length] = sound;
    }
};

Query.prototype._announceGameOver = function () {
    if ((this._redCompletion == 100 && this._prevStatus.completion.red != 100)
        || (this._blueCompletion == 100 && this._prevStatus.completion.blue != 100)) {
        this._soundQueue[this._soundQueue.length] = "game_over";
    }
};

Query.prototype.displayTabs = function () {
    var curr = this;
    $(function () {
        $('#tabs ul li').removeClass('active');
        $('#server_select').removeClass('hidden');
        $('#player_select').removeClass('hidden');
        $('#server_select').addClass('active');
        $('#query-tab').slideUp(600, function () {
            $('#tabs ul li').fadeIn(1000);
            $('#server-tab').slideDown(1000, function() {
                if (curr._status.teamplay == 1) {
                    $('#team_information').slideDown(2000);
                }
            });
        });
    });
};

Query.prototype.stop = function () {
    clearInterval(this._intervalHandle);
};

Query.prototype._processSoundQueue = function () {
    if (this._soundQueue.length != 0) {
        var that = this, sound = soundManager.createSound({
            id:this._soundQueue[0],
            url:'audio/' + this._soundQueue[0] + ".mp3",
            onfinish: function () {
                that._soundQueue.shift();
                that._processSoundQueue();
            }
        });
        this._soundQueueLock = true; //only allows SoundManager to call this function during playback 
        sound.play();
    } else {
        this._soundQueueLock = false;
    }
};
Query.prototype._sortScores = function(a, b) {
    return b.score.replace(":", "") - a.score.replace(":", ""); // =(
    
}
Query.prototype._playerHashes = {};

Query.prototype._renderPlayers = function() {
    this._blockingList = true;
    var that = this;
    
    if(that._status.numplayers > 0) {
        //Sort the array of player data by score
        this._status.players.sort(this._sortScores);
            
        //Iterate over the list of players, updating the hidden list
        $.each(this._status.players, function (i, item) {
            if(typeof that._playerHashes[item.name] == 'undefined') {
                that._playerHashes[item.name] = {
                    hash: md5(item.name)
                };
            }
            if(!item.ping) item.ping = 0;
            var quality = that._pingChart(item.ping);
            var liClass = "class=";
            
            if(that._status.teamplay == 1) {
                if (that._status.gamevariant.toLowerCase().indexOf("zombie") != -1) {
                    liClass += "'zombies";
                } else {
                    liClass += "'normal";
                }
                  
                if(item.team == 0) {
                    liClass +=" red'";
                } else {
                    liClass +=" blue'";
                }
            }
            
            $('.merge').append("<li data-id='" + that._playerHashes[item.name].hash+ "'" + liClass+ ">"
                + "<span class=\"playerrank\">" + (i + 1) + "</span>"
                + "<span class=\"playername\">" + item.name + "</span>"
                + "<span class=\"playerscore\">" + item.score + "</span>"
                + "<span class=\"playerping\">" + item.ping + "</span>"
                + "<span class=\"pingbars + " + quality + "\"></span>"
                + "</li>");
        });
        $('.visible').quicksand($('.merge li'), {
            duration: 500,
            easing: 'easeInOutQuad'
        }, function() {
            $('.merge').empty();
            that._blockingList = false;
        });
    } else {
        //If the server becomes empty, clear all of the list elements out
        $('.merge').empty();
        $('.visible').quicksand($('.merge li'), {
            duration: 800
        //easing: 'easeInOutQuad'
        });
        that._blockingList = false;
    }
};

Query.prototype._pingChart = function(ping) {
    var quality;
    if(ping == 0) {
        quality = "unknown";
    } else if(ping <= 60) { //33-34
        quality = "excellent";
    } else if(ping <=  80) { // 66-67
        quality = "good";
    } else if(ping <= 105) { // 99-101
        quality = "decent";
    } else if(ping <= 180) { // 133-167
        quality = "mediocre";
    } else if(ping <= 220) { //167+
        quality = "poor";
    } else if(ping <= 260) { 
        quality = "bad";
    }else { 
        quality = "unplayable";
    }
    
    return quality;
}

/* 
 * CE maps should be added here. You must ensure that all custom maps have an image of the same name
 * in both the map_banners and map_information directories. Example, 'talloniv' should have matching images
 * called 'talloniv.jpg' in the aforementioned directories.
 */
Query.prototype._mapInfo = {
    bloodgulch: {
        name: "Blood Gulch",
        description: "The quick and the dead"
    },    
    infinity: {
        name: "Infinity",
        description: "I imagined it would be bigger"
    },    
    deathisland: {
        name: "Death Island",
        description: "Sand, surf and spent shells"
    },    
    gephyrophobia: {
        name: "Gephyrophobia",
        description: "Scary, huh?"
    },    
    timberland: {
        name: "Timberland",
        description: "An enemy behind every tree!"
    },    
    dangercanyon: {
        name: "Danger Canyon",
        description: "Don't look down unless you fall"
    },    
    icefields: {
        name: "Ice Fields",
        description: "Slipping and sliding"
    },    
    ratrace: {
        name: "Rat Race",
        description: "Up the ramps, down the tubes"
    },  
    prisoner: {
        name: "Prisoner",
        description: "Get on top"
    },  
    carousel: {
        name: "Carousel",
        description: "Deep space anomaly #0198"
    },  
    putput: {
        name: "Chiron TL-34",
        description: "Spartan clone training complex"
    },  
    beavercreek: {
        name: "Battle Creek",
        description: "Splash splash, bang bang"
    },
    sidewinder: {
        name: "Sidewinder",
        description: "Red blood, white snow"
    },
    damnation: {
        name: "Damnation",
        description: "Covenant hydro-processing centre..."
    },
    longest: {
        name: "Longest",
        description: "A long walk down a short hall..."
    },
    boardingaction: {
        name: "Boarding Action",
        description: "Ship-to-ship combat"
    },
    wizard: {
        name: "Wizard",
        description: "Round and Round and Round"
    },
    hangemhigh: {
        name: "Hang 'em High",
        description: "Tombstones for everybody"
    },
    chillout: {
        name: "Chill Out",
        description: "Dude, you really need to..."
    },
    portent: {
        name: "Portent",
        description: "A secluded Forerunner outpost on the planet Summary"
    },
    hugeass: {
        name: "Hugeass",
        description: "It really is"
    },    
    coldsnap: {
        name: "Coldsnap",
        description: "An ice plateau with a large crevasse"
    },    
    "Yoyorast Island V2":{
        name: "Yoyorast Island V2",
        description: "Second version of the Yoyorast Island map"
    },    
    Mystic: {
        name: "Mystic",
        description: "Deep within an impenetrable valley covered by coagulated pinelands lays two secret shrines of the forest hidden by a dense layer of mist"
    },    
    destiny: {
        name: "Destiny",
        description: "This a small, asymmetric map inspired by the Mirror's Edge DLC"
    },    
    "TallonIV Overworld RC1": {
        name: "Tallon IV Overworld",
        description: "Metroid Online – Tallon IV Overworld - Release Candidate 1"
    },
    precipice: {
        name: "Precipice",
        description: "A vast Forerunner complex hides many passageways...and many secrets"
    },           
    sciophobia: {
        name: "Sciophobia",
        description: "An abandoned UNSC research space station"
    },
    cmt_Snow_Grove: {
        name: "CMT Snow Grove",
        description: "A Forerunner installation located within a snowy canyon"
    },
    Hydrolysis: {
        name: "Hydrolysis",
        description: "One of the many facilities powering Installation 04"
    },    
    revelations: {
        name: "Revelations",
        description: "This level takes place on an unfinished Halo ring being constructed in The Ark"
    }
}