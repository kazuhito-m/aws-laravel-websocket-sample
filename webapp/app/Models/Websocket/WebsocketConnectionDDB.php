<?php

namespace App\Models\Websocket;

class WebsocketConnectionDDB
{
    public $connectionId;
    public $userId;
    public $connectedTime;


    public static function of(string $connectionId, string $userId, string $connectedTime)
    {
        $con = new WebsocketConnectionDDB();

        $con->connectionId = $connectionId;
        $con->userId = $userId;
        $con->connectedTime = $connectedTime;

        return $con;
    }
}
