<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Mail Send') }}
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

                    <form action="{{ route('mailsend.store') }}" method="POST">
                        @csrf
                        <input type="text" name="mailAddress" value="" class="form-control" placeholder="Mail Acdress">
                        <input type="text" name="message" value="" class="form-control" placeholder="Message">
                        <button type="submit" class="btn btn-danger">サンプルメール送信</button>
                    </form>

                </div>
            </div>
        </div>
    </div>
</x-app-layout>
