<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
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
        // Log::debug($request);

        return redirect()->route('send.index')
            ->with('success', '送信成功しました。');
    }
}
