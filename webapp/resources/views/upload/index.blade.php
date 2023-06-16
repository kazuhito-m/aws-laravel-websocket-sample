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
            </div>
        </div>
    </div>
</x-app-layout>
