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

        // DEBUG 検索のサンプル
        Log::debug("region =>" . config('custom.websocket-api-region'));
        Log::debug("key =>" . config('custom.wsddb-aws-access-key-id'));
        Log::debug("secret =>" . config('custom.wsddb-aws-secret-access-key'));

        // $client = $this->createDynamoDBClient();
        // $connections = $client.scan(['TableName' => 'simplechat_connections']);

        // Log::debug('DynamoDBで取得できた connectionData の中身。');
        // Log::debug($connections);


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
            'region' => config('custom.default-region'),
            'version' => 'latest',
            'credentials' => [
                'key' =>  config('custom.aws-access-key-id'),
                'secret' => config('custom.aws-secret-access-key'),
            ],
            'http' => [
                'timeout' => 5,
            ],
        ]);
    }
}
