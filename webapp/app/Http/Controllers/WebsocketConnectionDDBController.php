<?php

namespace App\Http\Controllers;

use App\Models\Websocket\WebsocketConnectionStorage;

class WebsocketConnectionDDBController extends Controller
{
    public function index()
    {
        $storage = WebsocketConnectionStorage::of();

        $websocketConnections = $storage->findAll();

        return view('websocketconnectionddb.index')
            ->with('websocketConnections', $websocketConnections);
    }

    public function destroy(string $connectionId)
    {
        $storage = WebsocketConnectionStorage::of();

        $storage->removeOf($connectionId);

        return redirect()->route('websocketconnectionsddb.index')
            ->with('success', 'websocket connections deleted successfully');
    }
}
