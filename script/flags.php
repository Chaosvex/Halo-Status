<?php

global $playerStrings, $gameStrings;

$playerStrings = array(
    "NumberOfLives" => array("Infinite", 1, 3, 5),
    "MaximumHealth" => array("50%", "100%", "150%", "200%", "300%", "400%"),
    "Shields" => array(1, 0),
    "RespawnTime" => array(0, 5, 10, 15),
    "RespawnGrowth" => array(0, 5, 10, 15),
    "OddManOut" => array(0, 1),
    "InvisiblePlayers" => array(0, 1),
    "SuicidePenalty" => array(0, 5, 10, 15),
    "InfiniteGrenades" => array(0, 1),
    "WeaponSet" => array(
        "Normal", "Pistols", "Assault Rifles", "Plasma", "Sniper", "No Sniping",
        "Rocket Launchers", "Shotguns", "Short Range", "Human", "Covenant",
        "Classic", "Heavy Weapons"),
    "StartingEquipment" => array("Custom", "Generic"),
    "Indicator" => array("Motion Tracker", "Nav Points", "None"),
    "OtherPlayersOnRadar" => array("No", "All", "", "Friends"),
    "FriendIndicators" => array(0, 1),
    "FriendlyFire" => array("Off", "On", "Shields Only", "Explosives Only"),
    "FriendlyFirePenalty" => array(0, 5, 10, 15),
    "AutoTeamBalance" => array(0, 1),
    //Team Flags
    "Vehicle respawn" => array(0, 30, 60, 90, 120, 180, 300),
    "Red vehicle set" => array(
        "Default", "No vehicles", "Warthogs", "Ghosts", "Scorpions", "Rocket Warthogs",
        "Banshees", "Shades", "Custom"),
    "Blue vehicle set" => array(
        "Default", "No vehicles", "Warthogs", "Ghosts", "Scorpions", "Rocket Warthogs",
        "Banshees", "Shades", "Custom"));

$gameStrings = array(
    "Game type" => array("", "Capture the Flag", "Slayer", "Oddball", "King of the Hill", "Race"),
    //CTF
    "Assault" => array(0, 1),
    "Flag must reset" => array(0, 1),
    "Flag at home to score" => array(0, 1),
    "Single flag" => array(0, 60, 120, 180, 300, 600),
    //Slayer
    "Death bonus" => array(1, 0),
    "Kill penalty" => array(1, 0),
    "Kill in order" => array(0, 1),
    //Oddball
    "Random start" => array(0, 1),
    "Speed with ball" => array("Slow", "Normal", "Fast"),
    "Trait with ball" => array("None", "Invisible", "Extra Damage", "Damage Resistant"),
    "Trait without ball" => array("None", "Invisible", "Extra Damage", "Damage Resistant"),
    "Ball type" => array("Normal", "Reverse Tag", "Juggernaut"),
    "Ball spawn count" => array(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16),
    //King of the Hill
    "Moving hill" => array(0, 1),
    //Race
    "Race type" => array("Normal", "Any Order", "Rally"),
    "Team scoring" => array("Minimum", "Maximum", "Sum"));
?>
