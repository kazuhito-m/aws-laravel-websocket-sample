<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWebsocketConnectionRequest;
use App\Http\Requests\UpdateWebsocketConnectionRequest;
use App\Models\Websocket\WebsocketConnectionDDB;
use Illuminate\Support\Facades\Log;

use Aws\ApiGatewayManagementApi\ApiGatewayManagementApiClient;
use Aws\DynamoDb\DynamoDbClient;

class WebsocketConnectionDDBController extends Controller
{
    public function index()
    {
        // $websocketConnections = WebsocketConnection::all();
        $wscItem = WebsocketConnectionDDB::of('connection001', 'userId001', date(DATE_RFC2822));
        $websocketConnections = array($wscItem);

        return view('websocketconnectionddb.index')
            ->with('websocketConnections', $websocketConnections);
    }

    public function destroy(WebsocketConnection $websocketConnection)
    {
        Log::debug('削除対象ID:' . $websocketConnection->id);

        $websocketConnection->delete();

        return redirect()->route('websocketconnections.index')
            ->with('success', 'websocket connections deleted successfully');
    }
}
