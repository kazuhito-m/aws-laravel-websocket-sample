<?php

namespace App\Http\Controllers;

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
        Log::debug('ID:' . $id . ', message:' . $message);
        $signal = ClientPushSignalForWebSocketEndpoint::of($id, $message, Auth::user());

        $this->sendDirectEndPointOfWebSocket($signal);
    }

    private function sendDirectEndPointOfWebSocket(ClientPushSignalForWebSocketEndpoint $signal)
    {
        $endpoint = config('custom.websocket-url');
        Log::debug('endpoint:' . $endpoint);  

        $client = new ApiGatewayManagementApiClient([
            'apiVersion' => '2018-11-29',
            'version' => '2018-11-29',
            'endpoint' => $endpoint,
            'region' => 'ap-northeast-1'
        ]);

        $client->postToConnection([
            'ConnectionId' => $signal->message, // TODO とても仮実装。DBに貯めて、そっから取り出す方法。
            'Data' => json_encode($signal),
        ]);
    }
}
