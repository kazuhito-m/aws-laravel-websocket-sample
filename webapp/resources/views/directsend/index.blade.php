<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Direct Send (API Gatewau & Lambadを使わず直接送信)') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
            <div class="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                <div class="max-w-xl">

                    @if ($errors->any())
                        <div class="alert alert-danger">
                            <strong>エラー！</strong> 正しく入力して下さい。<br><br>
                            <ul>
                                @foreach ($errors->all() as $error)
                                    <li>{{ $error }}</li>
                                @endforeach
                            </ul>
                        </div>
                    @endif

                    <table class="table">
                        <tr>
                            <th>ID</th>
                            <th style="min-width: 150px">Name</th>
                            <th>Email</th>
                            <th>Message</th>
                            <th>Action</th>
                            <th style="min-width: 300px">Memo<th>
                        </tr>
                        @foreach ($users as $user)
                            <tr>
                                <form action="{{ route('send.store') }}" method="POST">
                                    @csrf
                                    <td>{{ $user->id }}</td>
                                    <td>{{ $user->name }}</td>
                                    <td>{{ $user->email }}</td>
                                    <td>
                                        <input type="hidden" name="id" value="{{ $user->id }}">
                                        <input type="text" name="message" value="" class="form-control"
                                            placeholder="Message">
                                    </td>
                                    <td>
                                        <button type="submit" class="btn btn-danger">直接送信</button>
                                    </td>
                                    <td>
                                        @if ($user->id == Auth::user()->id)
                                            <div style="color: red">
                                                自分へ送信する感じになります。
                                            </div>
                                        @endif
                                    </td>
                                </form>
                            </tr>
                        @endforeach
                    </table>

                </div>
            </div>
        </div>
    </div>
</x-app-layout>
