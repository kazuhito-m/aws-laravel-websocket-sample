<?php

namespace App\Models\Send;

use App\Models\User;
use DateTime;

class ClientPushSignal
{
    public $toUserId;
    public $message;
    public $fromUserId;
    public $fromUserName;
    public $fromServerTime;

    public static function of(string $id, string $message, User $myself)
    {
        $signal = new ClientPushSignal();

        $signal->toUserId = $id;
        $signal->message = $message;
        $signal->fromUserId = $myself->id;
        $signal->fromUserName = $myself->name;
        $signal->fromServerTime = ClientPushSignal::isoDateText();

        return $signal;
    }

    private static function isoDateText()
    {
        date_default_timezone_set('Asia/Tokyo');
        $now = new DateTime();
        return $now->format(DateTime::ATOM);
    }
}
