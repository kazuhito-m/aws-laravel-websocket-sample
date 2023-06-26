<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Dashboard') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="pull-right">
                    <a class="btn btn-success" href="/receive">メッセージ通知画面(receive)</a>
                </div>
                <div class="pull-right">
                    <a class="btn btn-success" href="/send">メッセージ送信画面(send)</a>
                </div>
                <div class="pull-right">
                    <a class="btn btn-success" href="/directsend">メッセージ送信画面(API Gatewau & Lambadを使わず直接送信)(directsend)</a>
                </div>
                <div class="pull-right">
                    <a class="btn btn-success" href="/users"> Users</a>
                </div>
                <div class="pull-right">
                    <a class="btn btn-success" href="/profile"> Profile</a>
                </div>
                <div class="pull-right">
                    <a class="btn btn-success" href="/websocketconnections"> Websockeet Connectilons</a>
                </div>
                <div class="pull-right">
                    <a class="btn btn-success" href="/websocketconnectionsddb"> Websockeet Connectilons(Dynamo DB)</a>
                </div>
                <div class="pull-right">
                    <a class="btn btn-success" href="/upload"> ファイルアップロード</a>
                </div>
                <div class="pull-right">
                    <a class="btn btn-success" href="/mailsend"> メール送信</a>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>
