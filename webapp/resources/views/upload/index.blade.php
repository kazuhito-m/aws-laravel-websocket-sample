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
                        <th>Action</th>
                    </tr>
                    @foreach ($files as $file)
                        <tr>
                            <td>{{ $file->id }}</td>
                            <td>
                                <a href="{{ $file->url() }}" target="_blank" rel="noopener"
                                    download="{{ $file->url() }}">
                                    {{ $file->original_name }}
                                    @if (str_contains($file->mime_type, 'image'))
                                        <br>
                                        <img src="{{ $file->url() }}" width="100" height="100">
                                    @endif
                                </a>
                            </td>
                            <td>{{ $file->mime_type }}</td>
                            <td>{{ $file->size }} Byte</td>
                            <td>{{ $file->created_at }}</td>
                            <td>
                                <form action="{{ route('upload.destroy', $file->id) }}" method="POST">
                                    @csrf
                                    @method('DELETE')
                                    <input type="hidden" name="id" value="{{ $file->id }}">
                                    <button type="submit" class="btn btn-danger">削除</button>
                                </form>
                            </td>
                        </tr>
                    @endforeach
                </table>
            </div>
        </div>
    </div>

</x-app-layout>
