<?php

namespace App\Models\Websocket;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WebsocketConnection extends Model
{
    protected $fillable = [
        'id',
        'connection_id',
        'user_id',
        'created_at'
    ];
}
