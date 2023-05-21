<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Websockeet Connections') }}
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
                            <th>ConnectionID</th>
                            <th>UserId</th>
                            <th>CreatedAt</th>
                            <th>Action</th>
                        </tr>
                        @foreach ($websocketConnections as $websocketConnection)
                            <tr>
                                <td>{{ $websocketConnection->id }}</td>
                                <td>{{ $websocketConnection->connection_id }}</td>
                                <td>{{ $websocketConnection->user_id }}</td>
                                <td>{{ $websocketConnection->created_at }}</td>
                                <td>
                                    <form action="{{ route('websocketconnections.destroy', $websocketConnection->id) }}" method="POST">
                                        @csrf
                                        @method('DELETE')
                                        <button type="submit" class="btn btn-danger">Delete</button>
                                    </form>
                                </td>
                            </tr>
                        @endforeach
                    </table>

                </div>
            </div>
        </div>
    </div>
</x-app-layout>
