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
        $client = $this->createDynamoDBClient();

        $records = $client->scan(['TableName' => 'simplechat_connections']);

        $websocketConnections = array();
        foreach ($records['Items'] as $record) {
            $connection = WebsocketConnectionDDB::of(
                $record['connectionId']['S'],
                $record['userId']['S'],
                $record['connectedTime']['S'],
            );
            array_push($websocketConnections, $connection);
        }

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
            'region' => config('custom.websocket-api-region'),
            'version' => 'latest',
            'credentials' => [
                'key' =>  config('custom.wsddb-aws-access-key-id'),
                'secret' => config('custom.wsddb-aws-secret-access-key'),
            ],
            'http' => [
                'timeout' => 5,
            ],
        ]);
    }
}
