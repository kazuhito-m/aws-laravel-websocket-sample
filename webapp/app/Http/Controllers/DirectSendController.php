<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\DirectSend\ClientPushSignalForWebSocketEndpoint;
use App\Models\Websocket\WebsocketConnection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

use Aws\ApiGatewayManagementApi\ApiGatewayManagementApiClient;

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

        $websocketConnections = WebsocketConnection::query()
            ->where('user_id', intval($id))
            ->get();
        Log::debug('connection_ids:' . $websocketConnections);

        $signal = ClientPushSignalForWebSocketEndpoint::of($id, $message, Auth::user());

        $this->sendDirectEndPointOfWebSocket($signal, $websocketConnections);
    }

    private function sendDirectEndPointOfWebSocket(ClientPushSignalForWebSocketEndpoint $signal, $websocketConnections)
    {
        $client = new ApiGatewayManagementApiClient([
            'version' => '2018-11-29',
            'endpoint' => config('custom.websocket-url'),
            'region' => config('custom.websocket-api-region')
        ]);

        foreach ($websocketConnections as $websocketConnection) {
            $client->postToConnection([
                'ConnectionId' => $websocketConnection->connection_id,
                'Data' => json_encode($signal),
            ]);
        }
    }
}
