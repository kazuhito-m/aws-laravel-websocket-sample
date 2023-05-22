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

        $client = createDynamoDBClient();

        $connections = $client.scan(['TableName' => 'simplechat_connections']);

        Log::debug('DynamoDBで取得できた connectionData の中身。');
        Log::debug($connections);

        $connectionIds = array();
        foreach ($connections['data']['items'] as $connection) {
            if ($connection['userId'] == $id) {
                array_push($connectionIds, $connection['connectionId']);
            }
        }

        $signal = ClientPushSignalForWebSocketEndpoint::of($id, $message, Auth::user());

        $this->sendDirectEndPointOfWebSocket($signal, $connectionIds);
    }

    private function sendDirectEndPointOfWebSocket(ClientPushSignalForWebSocketEndpoint $signal, $connectionIds)
    {
        $client = new ApiGatewayManagementApiClient([
            'version' => '2018-11-29',
            'endpoint' => config('custom.websocket-url'),
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
