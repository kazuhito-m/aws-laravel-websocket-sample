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
        // TODO DynamoDBからデータを一覧する
        // $websocketConnections = WebsocketConnection::all();
        $wscItem = WebsocketConnectionDDB::of('1', 'userId001', date(DATE_RFC2822));
        $websocketConnections = array($wscItem);

        return view('websocketconnectionddb.index')
            ->with('websocketConnections', $websocketConnections);
    }

    public function destroy(string $connectionId)
    {
        Log::debug('削除対象ID:' . $connectionId);

        // TODO DynamoDBをインデクスで削除。

        return redirect()->route('websocketconnectionsddb.index')
            ->with('success', 'websocket connections deleted successfully');
    }


    private function createDynamoDBClient()
    {
        return new DynamoDbClient([
            'region' => 'ap-northeast-1',
            'version' => 'latest',
            'credentials' => [
                'key' => $access_key,
                'secret' => $secret_key,
            ],
            'http' => [
                'timeout' => 5,
            ],
        ]);
    }
}
