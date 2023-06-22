<?php

namespace App\Http\Controllers;

use App\Models\Websocket\WebsocketConnectionDDB;
use Illuminate\Support\Facades\Log;

use Aws\DynamoDb\DynamoDbClient;

class WebsocketConnectionDDBController extends Controller
{
    public function index()
    {
        $client = $this->createDynamoDBClient();

        $records = $client->scan(['TableName' => $this->ddTableName()]);

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
        $client = $this->createDynamoDBClient();

        $client->deleteItem([
            'Key' => ['connectionId' => ['S' => $connectionId]],
            'TableName' => $this->ddTableName(),
        ]);

        return redirect()->route('websocketconnectionsddb.index')
            ->with('success', 'websocket connections deleted successfully');
    }

    private function createDynamoDBClient()
    {
        return new DynamoDbClient([
            'region' => config('custom.websocket-api-region'),
            'version' => 'latest',
            'credentials' => [
                'key' => config('custom.wsddb-aws-access-key-id'),
                'secret' => config('custom.wsddb-aws-secret-access-key'),
            ],
            'http' => [
                'timeout' => 5,
            ],
        ]);
    }

    private function ddTableName()
    {
        return config('custom.wsddb-table-name');
    }
}
