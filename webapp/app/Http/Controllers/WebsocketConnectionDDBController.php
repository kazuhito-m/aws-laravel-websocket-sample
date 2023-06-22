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
        $config = [
            'region' => config('custom.websocket-api-region'),
            'version' => 'latest',
            'http' => [
                'timeout' => 5,
            ],
        ];

        $accessKey = config('custom.wsddb-aws-access-key-id');
        $secretKey = config('custom.wsddb-aws-secret-access-key');
        if (!(empty($accessKey) && empty($secretKey))) {
            $config['credentials'] = [
                'key' => $accessKey,
                'secret' => $secretKey
            ];
            Log::info('Credential情報在りでDynamoDbClient生成。accessKey:' . $accessKey . ', $secretKey:' . $secretKey);
        } else {
            Log::info('Credential情報無しでDynamoDbClient生成。');
        }

        return new DynamoDbClient($config);
    }

    private function ddTableName()
    {
        return config('custom.wsddb-table-name');
    }
}