<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            {{ __('Upload') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
            <div class="p-4 sm:p-8 bg-white shadow sm:rounded-lg">
                <div class="max-w-xl">

                    <form method="POST" action="/upload" enctype="multipart/form-data">
                        {{ csrf_field() }}

                        <input type="file" id="file" name="file" class="form-control" />

                        <button type="submit">アップロード</button>
                    </form>

                </div>

                <table class="table">
                    <tr>
                        <th>ID</th>
                        <th style="min-width: 250px">Original Name</th>
                        <th>Mime Type</th>
                        <th>Size</th>
                        <th>Updated Time</th>
                        <th>
                    </tr>
                    @foreach ($files as $file)
                        <tr>
                            <form action="{{ route('send.store') }}" method="POST">
                                @csrf
                                <td>{{ $file->id }}</td>
                                <td>
                                    <a href="{{ $file->s3_url }}" target="_blank" rel="noopener"
                                        download="{{ $file->s3_url }}">
                                        {{ $file->original_name }}
                                    </a>
                                </td>
                                <td>{{ $file->mime_type }}</td>
                                <td>{{ $file->size }} Byte</td>
                                <td>{{ $file->created_at }}</td>
                            </form>
                        </tr>
                    @endforeach
                </table>
            </div>
        </div>
    </div>

</x-app-layout>
