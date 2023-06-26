<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

use App\Models\User;
use App\Models\MailSend\SampleMail;

class MailSendController extends Controller
{
    public function index()
    {
        $users = User::all();
        return view('mailsend.index', compact('users'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'mailAddress' => 'required',
            'message' => 'required',
        ]);

        $this->sendEMailOf($request->get('mailAddress'), $request->get('message'));

        return redirect()->route('mailsend.index')
            ->with('success', '送信成功しました。');
    }


    private function sendEMailOf(string $mailAddress, string $message)
    {
        Log::info('mailAddress:' . $mailAddress . ', message:' . $message);
        $user = Auth::user();
        Mail::to($mailAddress)->send(new SampleMail($message, $user->name));
    }
}