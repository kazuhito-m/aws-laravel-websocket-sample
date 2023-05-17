<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Send\ClientPushSignal;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use DateTime;

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

        $this->sendMessageOf($request->get('id'), $request->get('message'));

        return redirect()->route('send.index')
            ->with('success', '送信成功しました。');
    }

    private function sendMessageOf(string $id, string $message)
    {
        Log::debug('ID:' . $id . ', message:' . $message);

        date_default_timezone_set('Asia/Tokyo');
        $now = new DateTime();
        $serverTime = $now->format(DateTime::ATOM);

        $myself = Auth::user();

        $signal = new ClientPushSignal();
        $signal->toUserId = $id;
        $signal->message = $message;
        $signal->fromUserId = $myself->id;
        $signal->fromUserName = $myself->name;
        $signal->fromServerTime = $serverTime;

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
        $contents = file_get_contents($url, false, $context);
    }
}
