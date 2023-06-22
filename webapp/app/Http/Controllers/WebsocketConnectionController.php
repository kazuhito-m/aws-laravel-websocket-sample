<?php

namespace App\Http\Controllers;

use App\Models\Websocket\WebsocketConnection;
use Illuminate\Support\Facades\Log;

class WebsocketConnectionController extends Controller
{
    public function index()
    {
        $websocketConnections = WebsocketConnection::all();
        return view('websocketconnection.index')->with('websocketConnections', $websocketConnections);
    }

    public function destroy(WebsocketConnection $websocketConnection)
    {
        Log::debug('削除対象ID:' . $websocketConnection->id);

        $websocketConnection->delete();

        return redirect()->route('websocketconnections.index')
            ->with('success', 'websocket connections deleted successfully');
    }
}
