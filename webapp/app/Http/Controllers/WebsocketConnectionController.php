<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWebsocketConnectionRequest;
use App\Http\Requests\UpdateWebsocketConnectionRequest;
use App\Models\Websocket\WebsocketConnection;

class WebsocketConnectionController extends Controller
{
    public function index()
    {
        $connections = WebsocketConnection::all();
        return view('user.index')->with('websocketConnection', $websocketConnection);
    }

    public function destroy(WebsocketConnection $websocketConnection)
    {
        //
    }
}
