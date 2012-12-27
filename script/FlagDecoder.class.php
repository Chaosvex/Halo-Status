<?php

/*
  Based on Terje Bless' and Brian Hurley's work
  http://cpansearch.perl.org/src/LINK/Net-Halo-Status-0.02/lib/Net/Halo/Status.pm
 */
include("flags.php");

class FlagDecoder {

    private $playerFlags, $gameFlags, $vehicleFlags, $setFlags,
            $playerStrings, $gameStrings;

    function FlagDecoder($playerFlags, $vehicleFlags, $gameFlags) {
        $this->gameStrings = &$GLOBALS[gameStrings];
        $this->playerStrings = &$GLOBALS[playerStrings];
        $this->playerFlags = $playerFlags;
        $this->gameFlags = $gameFlags;
        $this->vehicleFlags = $vehicleFlags;
    }

    function getFlags() {
        $this->decodePlayer();
        $this->decodeVehicle();
        $this->decodeGame();
        $this->remap();
        return array("flags" => $this->setFlags);
    }

    private function remap() {
        //Need to take the int value from each key value and map it to the appropriate string
        foreach($this->setFlags['Player'] as $key => &$value) {
            $this->setFlags['Player'][$key] = $this->playerStrings[$key][$value];
        }

        foreach($this->setFlags['Team'] as $key => &$value) {
            $this->setFlags['Team'][$key] = $this->playerStrings[$key][$value];
        }

        foreach($this->setFlags['Game'] as $key => &$value) {
            $this->setFlags['Game'][$key] = $this->gameStrings[$key][$value];
        }
    }

    private function decodePlayer() {
        $this->setFlags['Player']['NumberOfLives'] = $this->playerFlags & 3;
        $this->setFlags['Player']['MaximumHealth'] = ($this->playerFlags >> 2) & 7;
        $this->setFlags['Player']['Shields'] = ($this->playerFlags >> 5) & 1;
        $this->setFlags['Player']['RespawnTime'] = ($this->playerFlags >> 6) & 3;
        $this->setFlags['Player']['RespawnGrowth'] = ($this->playerFlags >> 8) & 3;
        $this->setFlags['Player']['OddManOut'] = ($this->playerFlags >> 10) & 1;
        $this->setFlags['Player']['InvisiblePlayers'] = ($this->playerFlags >> 11) & 1;
        $this->setFlags['Player']['SuicidePenalty'] = ($this->playerFlags >> 12) & 3;
        $this->setFlags['Player']['InfiniteGrenades'] = ($this->playerFlags >> 14) & 1;
        $this->setFlags['Player']['WeaponSet'] = ($this->playerFlags >> 15) & 15;
        $this->setFlags['Player']['StartingEquipment'] = ($this->playerFlags >> 19) & 1;
        $this->setFlags['Player']['Indicator'] = ($this->playerFlags >> 20) & 3;
        $this->setFlags['Player']['OtherPlayersOnRadar'] = ($this->playerFlags >> 22) & 3;
        $this->setFlags['Player']['FriendIndicators'] = ($this->playerFlags >> 24) & 1;
        $this->setFlags['Player']['FriendlyFire'] = ($this->playerFlags >> 25) & 3;
        $this->setFlags['Player']['FriendlyFirePenalty'] = ($this->playerFlags >> 27) & 3;
        $this->setFlags['Player']['AutoTeamBalance'] = ($this->playerFlags >> 29) & 1;
    }

    private function decodeVehicle() {
        $this->setFlags['Team']['Vehicle respawn'] = ($this->vehicleFlags & 7);
        $this->setFlags['Team']['Red vehicle set'] = ($this->vehicleFlags >> 3) & 15;
        $this->setFlags['Team']['Blue vehicle set'] = ($this->vehicleFlags >> 7) & 15;
    }

    private function decodeGame() {
        $this->setFlags['Game']['Game type'] = $this->gameFlags & 7;
        if($this->setFlags['Game']['Game type'] == 1) { //CTF
            $this->setFlags['Game']['Assault'] = ($this->gameFlags >> 3) && 1;
            $this->setFlags['Game']['Flag must reset'] = ($this->gameFlags >> 5) && 1;
            $this->setFlags['Game']['Flag at home to score'] = ($this->gameFlags >> 6) && 1;
            $this->setFlags['Game']['Single flag'] = ($this->gameFlags >> 7) && 7;
        } else if($this->setFlags['Game']['Game type'] == 2) { //Slayer
            $this->setFlags['Game']['Death bonus'] = ($this->gameFlags >> 3) && 1;
            $this->setFlags['Game']['Kill penalty'] = ($this->gameFlags >> 5) && 1;
            $this->setFlags['Game']['Kill in order'] = ($this->gameFlags >> 6) && 1;
        } else if($this->setFlags['Game']['Game type'] == 3) { //Oddball
            $this->setFlags['Game']['Random start'] = ($this->gameFlags >> 3) && 1;
            $this->setFlags['Game']['Speed with ball'] = ($this->gameFlags >> 5) && 3;
            $this->setFlags['Game']['Trait with ball'] = ($this->gameFlags >> 7) && 3;
            $this->setFlags['Game']['Trait without ball'] = ($this->gameFlags >> 9) && 3;
            $this->setFlags['Game']['Ball type'] = ($this->gameFlags >> 11) && 3;
            $this->setFlags['Game']['Ball spawn count'] = ($this->gameFlags >> 13) && 31;
        } else if($this->setFlags['Game']['Game type'] == 4) { //KotH
            $this->setFlags['Game']['Moving hill'] = ($this->gameFlags >> 3) && 1;
        } else if($this->setFlags['Game']['Game type'] == 5) { //Race
            $this->setFlags['Game']['Race type'] = ($this->gameFlags >> 3) && 3;
            $this->setFlags['Game']['Team scoring'] = ($this->gameFlags >> 5) && 3;
        }
    }

}

?>