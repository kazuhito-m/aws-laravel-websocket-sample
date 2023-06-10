<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\DirectSend\ClientPushSignalForWebSocketEndpoint;
use App\Models\Websocket\WebsocketConnectionDDB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

use Aws\ApiGatewayManagementApi\ApiGatewayManagementApiClient;
use Aws\DynamoDb\DynamoDbClient;

class DirectSendController extends Controller
{
    public function index()
    {
        $users = User::all();
        return view('directsend.index', compact('users'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'id' => 'required',
            'message' => 'required',
        ]);

        $this->sendMessageOf($request->get('id'), $request->get('message'));

        return redirect()->route('directsend.index')
            ->with('success', '送信成功しました。');
    }


    private function sendMessageOf(string $id, string $message)
    {
        Log::debug('ID:' . $id . ', message:' . $message);
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

        $connectionIds = array();
        foreach ($websocketConnections as $connection) {
            if ($connection->userId == $id) {
                array_push($connectionIds, $connection->connectionId);
            }
        }

        Log::debug('connextionIds');
        Log::debug($connectionIds);

        $signal = ClientPushSignalForWebSocketEndpoint::of($id, $message, Auth::user());

        $this->sendDirectEndPointOfWebSocket($signal, $connectionIds);
    }

    private function sendDirectEndPointOfWebSocket(ClientPushSignalForWebSocketEndpoint $signal, $connectionIds)
    {
        $endpoint = config('custom.websocket-api-url');
        Log::debug('endpoint: ' . $endpoint);
        $client = new ApiGatewayManagementApiClient([
            'version' => '2018-11-29',
            'endpoint' => $endpoint,
            'region' => config('custom.websocket-api-region')
        ]);

        foreach ($connectionIds as $connectionId) {
            $client->postToConnection([
                'ConnectionId' => $connectionId,
                'Data' => json_encode($signal),
            ]);
        }
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
        if (isset($accessKey) || isset($secretKey)) {
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