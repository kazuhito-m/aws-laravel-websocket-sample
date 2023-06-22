<?php

namespace App\Models\Websocket;

use Aws\DynamoDb\DynamoDbClient;
use Illuminate\Support\Facades\Log;

class WebsocketConnectionStorage
{
    private function __construct(private readonly DynamoDbClient $client)
    {
    }

    public function findAll()
    {
        $records = $this->client->scan(['TableName' => $this->ddTableName()]);

        $websocketConnections = array();
        foreach ($records['Items'] as $record) {
            $connection = WebsocketConnectionDDB::of(
                $record['connectionId']['S'],
                $record['userId']['S'],
                $record['connectedTime']['S'],
            );
            array_push($websocketConnections, $connection);
        }

        return $websocketConnections;
    }

    public function findConnectionIdsOf(string $userId)
    {
        $tableName = $this->ddTableName();
        Log::info('検索対象のDynamoDBのテーブル名:' . $tableName);

        $records = $this->client->scan(['TableName' => $tableName]);

        $websocketConnections = array();
        foreach ($records['Items'] as $record) {
            $connection = WebsocketConnectionDDB::of(
                $record['connectionId']['S'],
                $record['userId']['S'],
                $record['connectedTime']['S'],
            );
            array_push($websocketConnections, $connection);
        }

        $connectionIds = array();
        foreach ($websocketConnections as $connection) {
            if ($connection->userId != $userId)
                continue;
            array_push($connectionIds, $connection->connectionId);
        }

        return $connectionIds;
    }

    public function removeOf(string $connectionId)
    {
        Log::debug('削除対象ID:' . $connectionId);
        $client = $this->createDynamoDBClient();

        $client->deleteItem([
            'Key' => ['connectionId' => ['S' => $connectionId]],
            'TableName' => $this->ddTableName(),
        ]);
    }

    private function ddTableName()
    {
        return config('custom.wsddb-table-name');
    }

    public static function of()
    {
        $client = WebsocketConnectionStorage::createDynamoDBClient();
        return new WebsocketConnectionStorage($client);
    }

    private static function createDynamoDBClient()
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
}