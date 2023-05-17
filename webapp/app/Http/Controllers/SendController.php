<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Send\ClientPushSignal;
use Illuminate\Support\Facades\Log;

class SendController extends Controller
{
    public function index()
    {
        $users = User::all();
        return view('send.index', compact('users'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'id' => 'required',
            'message' => 'required',
        ]);

        // TODO APIに送信
        Log::debug('ID:' . $request->get('id') . ', message:' . $request->get('message'));

        $signal = new ClientPushSignal();
        $signal->toUserId = $request->get('id');
        $signal->message = $request->get('message');

        $json = json_encode($signal);
        Log::debug("JSON文字列のテスト。");
        Log::debug($json);

        $url = config('custom.client-send-api-url');
        $options = array(
            'http' => array(
                'method'=> 'POST',
                'header'=> 'Content-type: application/json; charset=UTF-8',
                'content' => $json
            )
        );
        $context = stream_context_create($options);
        $contents = file_get_contents($url, false,$context);

        return redirect()->route('send.index')
            ->with('success', '送信成功しました。');
    }
}
