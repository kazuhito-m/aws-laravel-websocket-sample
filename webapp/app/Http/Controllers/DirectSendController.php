<?php

namespace App\Http\Controllers;

use App\Models\Websocket\WebsocketConnectionStorage;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\DirectSend\ClientPushSignalForWebSocketEndpoint;
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
        $storage = WebsocketConnectionStorage::of();

        Log::info('ID:' . $id . ', message:' . $message);

        $connectionIds = $storage->findConnectionIdsOf($id);

        Log::debug('connextionIds');
        Log::debug($connectionIds);

        $signal = ClientPushSignalForWebSocketEndpoint::of($id, $message, Auth::user());

        $this->sendDirectEndPointOfWebSocket($signal, $connectionIds);
    }

    private function sendDirectEndPointOfWebSocket(ClientPushSignalForWebSocketEndpoint $signal, $connectionIds)
    {
        $apiUrl = config('custom.websocket-api-url');
        $endpoint = $this->completingTrailingSlashesOf($apiUrl);
        Log::info('endpoint: ' . $endpoint);

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

    private function completingTrailingSlashesOf(string $text)
    {
        return preg_replace('/\/*$/', '', $text) . '/';
    }
}
