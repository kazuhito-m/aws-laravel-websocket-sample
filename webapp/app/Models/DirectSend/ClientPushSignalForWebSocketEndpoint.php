<?php

namespace App\Models\DirectSend;

use App\Models\User;
use DateTime;

class ClientPushSignalForWebSocketEndpoint
{
    public $toUserId;
    public $message;
    public $fromUserId;
    public $fromUserName;
    public $fromServerTime;
    public $apiSendTime;

    public static function of(string $id, string $message, User $myself)
    {
        $signal = new ClientPushSignalForWebSocketEndpoint();

        $signal->toUserId = $id;
        $signal->message = $message;
        $signal->fromUserId = $myself->id;
        $signal->fromUserName = $myself->name;
        $signal->fromServerTime = ClientPushSignalForWebSocketEndpoint::isoDateText();
        $signal->apiSendTime = "WebSocket直書、そんなものは無い";

        return $signal;
    }

    private static function isoDateText()
    {
        date_default_timezone_set('Asia/Tokyo');
        $now = new DateTime();
        return $now->format(DateTime::ATOM);
    }
}
